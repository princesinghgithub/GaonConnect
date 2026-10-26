const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const redis  = require('../../config/redis');

// Saathi ke tokens driver/customer wale tokens se alag rakhe gaye hain.
//
// Do layer ki safety:
//  1. Payload mein `typ: 'saathi'` hai — saathiProtect iske bina token nahi maanta.
//  2. Redis key prefix `saathi_refresh:` alag hai — driver ka refresh token
//     yahan chalega hi nahi, aur ulta bhi nahi.
//
// Iska matlab: chori hua Saathi token driver/admin API par bekaar hai, aur
// driver ka token Saathi portal par bekaar hai.

const ACCESS_TOKEN_EXPIRY_SEC  = 30 * 60;            // 30 min — portal desktop par khula rehta hai
const REFRESH_TOKEN_EXPIRY_SEC = 30 * 24 * 60 * 60;  // 30 din

const refreshKey  = (token)    => `saathi_refresh:${token}`;
const sessionsKey = (saathiId) => `saathi_sessions:${saathiId}`;

const generateAccessToken = (saathiId) =>
  jwt.sign(
    { id: saathiId.toString(), typ: 'saathi' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY_SEC }
  );

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

const saveRefreshToken = async (saathiId, token) => {
  const id = saathiId.toString();
  const pipeline = redis.pipeline();
  pipeline.setex(refreshKey(token), REFRESH_TOKEN_EXPIRY_SEC, id);
  pipeline.sadd(sessionsKey(id), token);
  pipeline.expire(sessionsKey(id), REFRESH_TOKEN_EXPIRY_SEC);
  await pipeline.exec();
};

const verifyRefreshToken = (token) => redis.get(refreshKey(token));

const revokeRefreshToken = async (token) => {
  const id = await verifyRefreshToken(token);
  if (!id) return;
  const pipeline = redis.pipeline();
  pipeline.del(refreshKey(token));
  pipeline.srem(sessionsKey(id), token);
  await pipeline.exec();
};

const revokeAllTokens = async (saathiId) => {
  const id = saathiId.toString();
  const tokens = await redis.smembers(sessionsKey(id));
  if (!tokens.length) return;
  const pipeline = redis.pipeline();
  tokens.forEach((t) => pipeline.del(refreshKey(t)));
  pipeline.del(sessionsKey(id));
  await pipeline.exec();
};

// Purana refresh token hata kar naya deta hai. Null matlab token invalid/expired.
const rotateRefreshToken = async (oldToken) => {
  const id = await verifyRefreshToken(oldToken);
  if (!id) return null;

  await revokeRefreshToken(oldToken);

  const newToken = generateRefreshToken();
  await saveRefreshToken(id, newToken);
  return { saathiId: id, newToken };
};

// Login/refresh dono yahi shape lautate hain
const issueSession = async (saathi) => {
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(saathi._id, refreshToken);
  return {
    accessToken: generateAccessToken(saathi._id),
    refreshToken,
    expiresIn:   ACCESS_TOKEN_EXPIRY_SEC,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllTokens,
  rotateRefreshToken,
  issueSession,
  ACCESS_TOKEN_EXPIRY_SEC,
  REFRESH_TOKEN_EXPIRY_SEC,
};
