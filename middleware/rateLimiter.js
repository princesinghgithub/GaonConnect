const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isDev = process.env.NODE_ENV !== 'production';

// Asli user ka IP. Live server Cloudflare → Render ke peeche hai; `req.ip`
// (trust proxy 1) beech ke proxy ka IP deta hai jo HAZAARON users share karte
// hain — live par jaancha: lagaatar requests ka "remaining" 199,197,199,195
// upar-neeche hota tha, yaani ginti doosron ke saath mil rahi thi. Cloudflare
// har request par asli IP `CF-Connecting-IP` mein likhta hai (client ise
// badal nahi sakta — Cloudflare overwrite karta hai).
const clientIp = (req) => {
  const cf = req.headers['cf-connecting-ip'] || req.headers['true-client-ip'];
  return ipKeyGenerator(String(cf || req.ip || '').trim());
};

// Login wala user ho to uski apni ginti — Jio/Airtel CGNAT par ek IP ke
// peeche bahut log hote hain, ek ki wajah se doosre na rukein. Token yahan
// sirf pehchaan ke liye padhte hain; asli jaanch `protect` karta hai.
const userOrIpKey = (req) => {
  if (req.user?.id) return `user:${req.user.id}`;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    try {
      const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
      if (id) return `user:${id}`;
    } catch { /* expired/galat token — IP se gino */ }
  }
  return `ip:${clientIp(req)}`;
};

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
  return phone.length === 10 ? `phone:${phone}` : `ip:${clientIp(req)}`;
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

  return `ip:${clientIp(req)}`;
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

// ─── General API — 200 requests per min per user (login nahi to per IP) ───────
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    userOrIpKey,
  handler: limitHandler('Bahut zyada requests. Thodi der baad try karo.'),
});

// ─── Strict — sensitive endpoints (e.g. withdrawal) — 5 per hour ─────────────
const strictLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    userOrIpKey,
  handler: limitHandler('Limit exceed ho gayi. 1 ghante baad try karo.'),
});

// ─── SOS — musibat mein banda baar-baar dabata hai; use rokna nahi hai, bas
// ek account se spam na ho. Pehle strictLimiter (5/ghanta, proxy IP par —
// yaani saare users milakar 5) lagta tha.
const sosLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    userOrIpKey,
  handler: limitHandler('Bahut baar SOS dabaya gaya. Turant madad ke liye 112 par call karein.'),
});

module.exports = { otpLimiter, loginLimiter, apiLimiter, strictLimiter, sosLimiter, userOrIpKey, clientIp };
