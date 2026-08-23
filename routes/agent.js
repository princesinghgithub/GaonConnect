const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { protect, admin } = require('../middleware/auth');
const { chat, supportChat } = require('../controllers/agentController');

// Sab kuch login ke peeche — har call Gemini pe paisa kharch karti hai, isliye
// ise khula chhodna seedha bill ka risk hai.
router.use(protect);

// ─── Customer support chat ────────────────────────────────────────────────────
// Kisi bhi logged-in user ke liye (admin hone ki zarurat nahi).
//
// Mode client se nahi aata — controller hamesha customer-support prompt lagata
// hai. Warna customer `mode: 'ops'` bhej kar operations agent khol leta.
const supportLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             process.env.NODE_ENV !== 'production' ? 100 : 15,
  standardHeaders: true,
  legacyHeaders:   false,
  // IP se nahi, user se — Jio/Airtel CGNAT ki wajah se hazaaron log ek hi
  // public IP share karte hain, aur IP-based limit asli users ko block kar deti.
  // ipKeyGenerator IPv6 ko sahi tarah normalize karta hai — seedha req.ip
  // use karne par express-rate-limit warn karta hai.
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: 'Bahut zyada sawaal. Thodi der baad try karein.',
  }),
});

router.post('/support', supportLimiter, supportChat);

// ─── Admin ops agent ──────────────────────────────────────────────────────────
// Ye alag hai: ismein operations/marketing/driver prompts hain jo customer ko
// nahi milne chahiye.
router.post('/chat', admin, chat);

module.exports = router;
