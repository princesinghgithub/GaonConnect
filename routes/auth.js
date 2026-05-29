const express = require('express');
const router  = express.Router();

const { protect }                                        = require('../middleware/auth');
const { otpLimiter, loginLimiter }                       = require('../middleware/rateLimiter');
const { validate, schemas }                              = require('../middleware/validate');
const { verifyRefreshToken, rotateRefreshToken,
        revokeRefreshToken, revokeAllUserTokens,
        generateAccessToken }                            = require('../utils/tokenService');
const {
  register, sendOTP, verifyOTP,
  sendPhoneOTP, verifyPhoneOTP,
  getProfile, updateProfile,
} = require('../controllers/authController');

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register',
  otpLimiter,
  validate(schemas.register),
  register
);

// ─── Email OTP ────────────────────────────────────────────────────────────────
router.post('/send-otp',
  otpLimiter,
  validate(schemas.sendOTP),
  sendOTP
);

router.post('/verify-otp',
  loginLimiter,
  validate(schemas.verifyOTP),
  verifyOTP
);

// ─── Phone OTP ────────────────────────────────────────────────────────────────
router.post('/send-phone-otp',
  otpLimiter,
  validate(schemas.sendPhoneOTP),
  sendPhoneOTP
);

router.post('/verify-phone-otp',
  loginLimiter,
  validate(schemas.verifyPhoneOTP),
  verifyPhoneOTP
);

// ─── Token Refresh ────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Body: { refreshToken: "..." }
// Returns: { accessToken, refreshToken } — old token revoke, naya issue (rotation)
router.post('/refresh',
  validate(schemas.refreshToken),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      const result = await rotateRefreshToken(refreshToken);
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid ya expired refresh token. Dobara login karo.' });
      }

      const accessToken = generateAccessToken(result.userId);

      return res.status(200).json({
        success: true,
        accessToken,
        refreshToken: result.newToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ success: false, message: 'Token refresh mein error.' });
    }
  }
);

// ─── Logout (current device) ──────────────────────────────────────────────────
// POST /api/auth/logout
// Body: { refreshToken: "..." }
router.post('/logout',
  protect,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }
      return res.status(200).json({ success: true, message: 'Logout successful.' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(200).json({ success: true, message: 'Logout successful.' });
    }
  }
);

// ─── Logout All Devices ───────────────────────────────────────────────────────
// POST /api/auth/logout-all
router.post('/logout-all',
  protect,
  async (req, res) => {
    try {
      await revokeAllUserTokens(req.user._id);
      return res.status(200).json({ success: true, message: 'Sabhi devices se logout ho gaye.' });
    } catch (error) {
      console.error('Logout-all error:', error);
      return res.status(500).json({ success: false, message: 'Logout mein error.' });
    }
  }
);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, validate(schemas.updateProfile), updateProfile);

module.exports = router;
