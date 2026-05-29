const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Helper — standard JSON response
const limitHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

// ─── OTP Send — 5 requests per 15 min per IP ──────────────────────────────────
const otpLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               isDev ? 50 : 5,
  standardHeaders:   true,
  legacyHeaders:     false,
  skipSuccessfulRequests: false,
  handler: limitHandler('Bahut zyada OTP requests. 15 minute baad try karo.'),
});

// ─── OTP Verify / Login — 10 attempts per 30 min per IP ───────────────────────
const loginLimiter = rateLimit({
  windowMs:          30 * 60 * 1000,
  max:               isDev ? 100 : 10,
  standardHeaders:   true,
  legacyHeaders:     false,
  skipSuccessfulRequests: true,
  handler: limitHandler('Bahut zyada login attempts. 30 minute baad try karo.'),
});

// ─── General API — 200 requests per min per IP ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: limitHandler('Bahut zyada requests. Thodi der baad try karo.'),
});

// ─── Strict — sensitive endpoints (e.g. withdrawal) — 5 per hour ─────────────
const strictLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: limitHandler('Limit exceed ho gayi. 1 ghante baad try karo.'),
});

module.exports = { otpLimiter, loginLimiter, apiLimiter, strictLimiter };
