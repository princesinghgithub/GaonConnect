const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendOTP,
  verifyOTP,
  register,
  getProfile,
  updateProfile
} = require('../controllers/authController');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;