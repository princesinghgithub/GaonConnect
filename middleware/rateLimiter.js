const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Helper — standard JSON response
const limitHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

// Indian mobile carriers (Jio/Airtel/Vi) heavily use CGNAT — thousands of
// unrelated users can share one public IP. Rate-limiting OTP by IP alone
// locks out real users because of OTHER people's traffic on the same IP.
// Key by the phone number being OTP'd instead — that's the actual abuse
// target (someone OTP-bombing one number) — falling back to IP only when
// no phone is present on the request (malformed/unexpected calls).
const otpKeyGenerator = (req) => {
  const raw = req.body?.phone ?? req.query?.phone;
  const phone = String(raw || '').replace(/\D/g, '').slice(-10);
  return phone.length === 10 ? `phone:${phone}` : ipKeyGenerator(req.ip);
};

// ─── OTP Send — 5 requests per 15 min per phone number ────────────────────────
const otpLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               isDev ? 50 : 5,
  standardHeaders:   true,
  legacyHeaders:     false,
  skipSuccessfulRequests: false,
  keyGenerator:      otpKeyGenerator,
  handler: limitHandler('Bahut zyada OTP requests. 15 minute baad try karo.'),
});

// Same CGNAT reasoning as otpKeyGenerator — key by the account being
// verified (phone or email), not the shared carrier IP.
const loginKeyGenerator = (req) => {
  const rawPhone = req.body?.phone;
  const phone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
  if (phone.length === 10) return `phone:${phone}`;

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;

  return ipKeyGenerator(req.ip);
};

// ─── OTP Verify / Login — 10 attempts per 30 min per account ──────────────────
const loginLimiter = rateLimit({
  windowMs:          30 * 60 * 1000,
  max:               isDev ? 100 : 10,
  standardHeaders:   true,
  legacyHeaders:     false,
  skipSuccessfulRequests: true,
  keyGenerator:      loginKeyGenerator,
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
