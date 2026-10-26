const express = require('express');
const router  = express.Router();

const { protect, admin } = require('../middleware/auth');
const { loginLimiter }   = require('../middleware/rateLimiter');
const {
  login, setup2fa, verify2fa,
  status, changePassword, regenerateBackupCodes,
} = require('../controllers/adminAuthController');

// Mounted at /api/auth/admin — admin dashboard ka login (email + password + Google Authenticator).
// Purane /api/auth/send-otp, /verify-otp waise hi chalte rahenge.

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login',      loginLimiter, login);
router.post('/setup-2fa',  loginLimiter, setup2fa);
router.post('/verify-2fa', loginLimiter, verify2fa);

// ─── Logged-in admin ──────────────────────────────────────────────────────────
router.get('/status',                 protect, admin, status);
router.post('/change-password',       protect, admin, loginLimiter, changePassword);
router.post('/backup-codes/regenerate', protect, admin, loginLimiter, regenerateBackupCodes);

module.exports = router;
