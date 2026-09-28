const express   = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const { protect, admin } = require('../../middleware/auth');
const { saathiProtect, saathiActive } = require('../middleware/saathiAuth');
const { asyncHandler } = require('../utils/safe');

const authCtrl       = require('../controllers/authController');
const dashboardCtrl  = require('../controllers/dashboardController');
const referralCtrl   = require('../controllers/referralController');
const networkCtrl    = require('../controllers/networkController');
const earningsCtrl   = require('../controllers/earningsController');
const withdrawalCtrl = require('../controllers/withdrawalController');
const profileCtrl    = require('../controllers/profileController');
const publicCtrl     = require('../controllers/publicController');
const adminCtrl      = require('../controllers/adminController');

const router = express.Router();

// Har handler asyncHandler se wrapped hai. Iske bina ek bhi reject hua promise
// Express ke bahar nikal jaata hai aur server.js ka unhandledRejection handler
// poora process band kar deta hai — yaani Saathi ka ek bug poori app le dubta.
const h = asyncHandler;

// ─── Rate limiters ───────────────────────────────────────────────────────────
// OTP par sakht limit — har OTP par SMS ka paisa lagta hai.
const otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             process.env.NODE_ENV !== 'production' ? 100 : 8,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => {
    const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
    return phone ? `saathi_otp:${phone}` : ipKeyGenerator(req.ip);
  },
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: 'Bahut baar OTP maanga gaya. Thodi der baad try karein.',
  }),
});

// Public claim endpoint khula hai (app signup ke waqt bina token ke call hoti
// hai), isliye IP par limit zaruri hai — warna koi script code brute-force kar
// ke doosre Saathi ke referrals apne naam kar sakta hai.
const publicLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             process.env.NODE_ENV !== 'production' ? 200 : 30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: 'Bahut zyada requests. Thodi der baad try karein.',
  }),
});

// ─── Public (driver/user app ke liye — koi token nahi) ───────────────────────
router.get ('/public/verify-code', publicLimiter, h(publicCtrl.verifyCode));
router.post('/public/claim',       publicLimiter, h(publicCtrl.claim));

// ─── Auth (portal login) ─────────────────────────────────────────────────────
router.post('/auth/send-otp',   otpLimiter, h(authCtrl.sendLoginOtp));
router.post('/auth/verify-otp', otpLimiter, h(authCtrl.verifyLoginOtp));
router.post('/auth/refresh',    h(authCtrl.refresh));
router.post('/auth/logout',     h(authCtrl.logout));
router.post('/auth/logout-all', saathiProtect, h(authCtrl.logoutAll));
router.get ('/auth/me',         saathiProtect, h(authCtrl.me));

// ─── Admin (main app ka admin login — protect + admin) ───────────────────────
// Ye `/:id` wale portal routes se pehle mount hai, warna '/admin/list' ko
// Express ek Saathi id samajh leta.
router.get   ('/admin/list',             protect, admin, h(adminCtrl.listSaathis));
router.get   ('/admin/earnings',         protect, admin, h(adminCtrl.listEarnings));
router.patch ('/admin/earnings/:id',     protect, admin, h(adminCtrl.reviewEarning));
router.get   ('/admin/withdrawals',      protect, admin, h(adminCtrl.listWithdrawals));
router.patch ('/admin/withdrawals/:id',  protect, admin, h(adminCtrl.reviewWithdrawal));
router.post  ('/admin/run-rewards',      protect, admin, h(adminCtrl.runRewards));
router.get   ('/admin/:id',              protect, admin, h(adminCtrl.getSaathi));
router.patch ('/admin/:id/status',       protect, admin, h(adminCtrl.setStatus));

// ─── Portal (Saathi ka apna token) ───────────────────────────────────────────
// Profile aur logout pending Saathi ko bhi milte hain, taaki wo apna status
// dekh sake aur details theek kar sake. Baaki sab `saathiActive` ke peeche.
router.get('/profile',        saathiProtect, h(profileCtrl.getProfile));
router.put('/profile',        saathiProtect, h(profileCtrl.updateProfile));
router.put('/profile/payout', saathiProtect, h(profileCtrl.updatePayout));

router.get('/dashboard',          saathiProtect, saathiActive, h(dashboardCtrl.getDashboard));
router.get('/referral',           saathiProtect, saathiActive, h(referralCtrl.getReferral));
router.get('/network/drivers',    saathiProtect, saathiActive, h(networkCtrl.getDrivers));
router.get('/network/customers',  saathiProtect, saathiActive, h(networkCtrl.getCustomers));
router.get('/network/bookings',   saathiProtect, saathiActive, h(networkCtrl.getBookings));
router.get('/earnings',           saathiProtect, saathiActive, h(earningsCtrl.getEarnings));

router.get ('/withdrawals', saathiProtect, saathiActive, h(withdrawalCtrl.getWithdrawals));
router.post('/withdrawals', saathiProtect, saathiActive, h(withdrawalCtrl.requestWithdrawal));

// ─── Module ka apna 404 ──────────────────────────────────────────────────────
router.use((req, res) => {
  res.status(404).json({ success: false, message: `Saathi route nahi mili: ${req.method} ${req.originalUrl}` });
});

// ─── Module ka apna error handler ────────────────────────────────────────────
// Saathi module ki koi bhi error yahin ruk jaati hai — main app ke global
// handler tak nahi jaati, aur na hi process ko gira sakti hai.
router.use((err, req, res, _next) => {
  console.error(`[saathi] ${req.method} ${req.originalUrl} error:`, err.stack || err.message);

  // Mongoose ki aam galtiyon ko samajhne laayak message mein badlo
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ success: false, message: first?.message || 'Data valid nahi hai.' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid id bheji gayi hai.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Ye record pehle se maujood hai.' });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: 'Saathi service mein problem aa gayi. Thodi der baad try karein.',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
});

module.exports = router;
