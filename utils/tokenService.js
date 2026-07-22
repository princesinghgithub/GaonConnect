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

// Refresh token Redis value encodes "userId:activeRole" so that rotation
// can re-issue an access token for the SAME app session (customer vs
// provider) instead of falling back to the user's static profile role —
// that fallback broke dual-role accounts (e.g. a customer who also drives)
// once their access token expired mid-session. Legacy entries saved before
// this change have no ":role" suffix; they're read with role=null and the
// caller falls back to the user's profile role for that one rotation, then
// self-heal into the new format since rotation always re-saves with role.

// ─── Save ─────────────────────────────────────────────────────────────────────
const saveRefreshToken = async (userId, token, activeRole) => {
  const id = userId.toString();
  const pipeline = redis.pipeline();
  // Token → "userId:role" mapping (to verify ownership + preserve app session role)
  pipeline.setex(refreshKey(token), REFRESH_TOKEN_EXPIRY_SEC, `${id}:${activeRole}`);
  // userId → set of tokens (to revoke all on logout from all devices)
  pipeline.sadd(userTokenKey(id), token);
  pipeline.expire(userTokenKey(id), REFRESH_TOKEN_EXPIRY_SEC);
  await pipeline.exec();
};

// ─── Verify ───────────────────────────────────────────────────────────────────
// Returns { userId, role } (role is null for legacy pre-migration entries) or null
const verifyRefreshToken = async (token) => {
  const raw = await redis.get(refreshKey(token));
  if (!raw) return null;
  const sep = raw.indexOf(':');
  return sep === -1
    ? { userId: raw, role: null }
    : { userId: raw.slice(0, sep), role: raw.slice(sep + 1) };
};

// ─── Revoke single token (logout current device) ──────────────────────────────
const revokeRefreshToken = async (token) => {
  const session = await verifyRefreshToken(token);
  if (session) {
    const pipeline = redis.pipeline();
    pipeline.del(refreshKey(token));
    pipeline.srem(userTokenKey(session.userId), token);
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
  const session = await verifyRefreshToken(oldToken);
  if (!session) return null;

  await revokeRefreshToken(oldToken);

  const newToken = generateRefreshToken();
  await saveRefreshToken(session.userId, newToken, session.role);

  return { userId: session.userId, role: session.role, newToken };
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
