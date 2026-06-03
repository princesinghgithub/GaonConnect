const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const redis  = require('../config/redis');

const ACCESS_TOKEN_EXPIRY_SEC  = 15 * 60;           // 15 minutes
const REFRESH_TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60;  // 7 days

// ─── Keys ────────────────────────────────────────────────────────────────────
const refreshKey   = (token)  => `refresh:${token}`;
const userTokenKey = (userId) => `user_tokens:${userId}`;

// ─── Generate ─────────────────────────────────────────────────────────────────
// activeRole = 'customer' | 'provider' — jis app se login ho raha hai
const generateAccessToken = (userId, activeRole = 'customer') =>
  jwt.sign(
    { id: userId.toString(), role: activeRole },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY_SEC }
  );

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

// ─── Save ─────────────────────────────────────────────────────────────────────
const saveRefreshToken = async (userId, token) => {
  const id = userId.toString();
  const pipeline = redis.pipeline();
  // Token → userId mapping (to verify ownership)
  pipeline.setex(refreshKey(token), REFRESH_TOKEN_EXPIRY_SEC, id);
  // userId → set of tokens (to revoke all on logout from all devices)
  pipeline.sadd(userTokenKey(id), token);
  pipeline.expire(userTokenKey(id), REFRESH_TOKEN_EXPIRY_SEC);
  await pipeline.exec();
};

// ─── Verify ───────────────────────────────────────────────────────────────────
const verifyRefreshToken = async (token) => {
  const userId = await redis.get(refreshKey(token));
  return userId || null; // returns userId string or null
};

// ─── Revoke single token (logout current device) ──────────────────────────────
const revokeRefreshToken = async (token) => {
  const userId = await redis.get(refreshKey(token));
  if (userId) {
    const pipeline = redis.pipeline();
    pipeline.del(refreshKey(token));
    pipeline.srem(userTokenKey(userId), token);
    await pipeline.exec();
  }
};

// ─── Revoke all tokens for a user (logout from all devices) ──────────────────
const revokeAllUserTokens = async (userId) => {
  const id = userId.toString();
  const tokens = await redis.smembers(userTokenKey(id));

  if (tokens.length > 0) {
    const pipeline = redis.pipeline();
    tokens.forEach((t) => pipeline.del(refreshKey(t)));
    pipeline.del(userTokenKey(id));
    await pipeline.exec();
  }
};

// ─── Rotate (revoke old, issue new) ──────────────────────────────────────────
const rotateRefreshToken = async (oldToken) => {
  const userId = await verifyRefreshToken(oldToken);
  if (!userId) return null;

  await revokeRefreshToken(oldToken);

  const newToken = generateRefreshToken();
  await saveRefreshToken(userId, newToken);

  return { userId, newToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  rotateRefreshToken,
  ACCESS_TOKEN_EXPIRY_SEC,
  REFRESH_TOKEN_EXPIRY_SEC,
};
