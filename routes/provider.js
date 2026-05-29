const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const { protect }    = require('../middleware/auth');
const { docUpload }  = require('../middleware/upload');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { validate, schemas }        = require('../middleware/validate');

const {
  getAvailableProviders,
  getProviderById,
  registerProvider,
  updateProviderStatus,
  toggleDuty,
  updateProviderLocation,
  getProviderStats,
  getProviderProfile,
  updateProviderProfile,
  updateBankDetails,
  updatePreferences,
  getTodayEarnings,
  getWeeklyEarnings,
  updateFCMToken,
  uploadProfilePhoto,
  uploadDoc,
} = require('../controllers/providerController');

const { sendPhoneOTP, verifyPhoneOTP } = require('../controllers/authController');

// ─── Ensure upload dirs exist ────────────────────────────────────────────────
['uploads/profile/', 'uploads/documents/'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Profile photo upload config ─────────────────────────────────────────────
const { randomUUID } = require('crypto');

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/profile/'),
    filename:    (_req, file, cb) => cb(null, `profile-${randomUUID()}${path.extname(file.originalname)}`),
  }),
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sirf image files allowed hain (JPG/PNG)'));
  },
});

// ─── PUBLIC ROUTES — no token needed ─────────────────────────────────────────

// Driver OTP login (phone based)
router.post('/send-phone-otp',   otpLimiter,   validate(schemas.sendPhoneOTP),   sendPhoneOTP);
router.post('/verify-phone-otp', loginLimiter, validate(schemas.verifyPhoneOTP), verifyPhoneOTP);

// Provider registration — naye driver ke paas token nahi hota
router.post('/register', docUpload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'rcPhoto',      maxCount: 1 },
]), registerProvider);

// Available providers near location
router.get('/available', getAvailableProviders);

// ─── PROTECTED ROUTES — token required ───────────────────────────────────────

// Profile
router.get('/me',             protect, getProviderProfile);
router.get('/profile/me',     protect, getProviderProfile);
router.put('/profile/update', protect, updateProviderProfile);
router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto);

// Status & Duty
router.put('/status',      protect, updateProviderStatus);
router.put('/duty-toggle', protect, toggleDuty);

// Location
router.put('/location', protect, updateProviderLocation);

// Stats & Earnings
router.get('/stats/me',        protect, getProviderStats);
router.get('/earnings/today',  protect, getTodayEarnings);
router.get('/earnings/weekly', protect, getWeeklyEarnings);

// Bank & Preferences
router.put('/bank-details', protect, updateBankDetails);
router.put('/preferences',  protect, updatePreferences);

// Document upload
router.post('/documents/upload', protect, docUpload.single('document'), uploadDoc);

// FCM token (push notifications)
router.post('/fcm-token', protect, updateFCMToken);

// ⚠️  Dynamic :id route MUST be last — warna /me, /stats sab catch ho jaate hain
router.get('/:id', getProviderById);

module.exports = router;
