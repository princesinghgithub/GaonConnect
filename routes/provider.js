const express = require('express');
const router  = express.Router();

const { protect }    = require('../middleware/auth');
const { docUpload, createPhotoUpload }  = require('../middleware/upload');
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
  uploadProviderDocument,
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
  requestVehicleChange,
} = require('../controllers/providerController');

const { sendPhoneOTP, verifyPhoneOTP } = require('../controllers/authController');

// ─── Profile photo upload config ─────────────────────────────────────────────
const photoUpload = createPhotoUpload('gaonconnect/profile');

// ─── PUBLIC ROUTES — no token needed ─────────────────────────────────────────

// Driver OTP login (phone based)
router.post('/send-phone-otp',   otpLimiter,   validate(schemas.sendPhoneOTP),   sendPhoneOTP);
router.post('/verify-phone-otp', loginLimiter, validate(schemas.verifyPhoneOTP), verifyPhoneOTP);

// Provider registration (KYC + vehicle, ek hi request mein) — naye driver ke paas token nahi hota
router.post('/register', docUpload.fields([
  { name: 'profilePhoto',  maxCount: 1 },
  { name: 'aadhaarPhoto',  maxCount: 1 },
  { name: 'licensePhoto',  maxCount: 1 },
  { name: 'rcPhoto',       maxCount: 1 },
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

// Document upload (Provider-level KYC — aadhaar)
router.post('/documents/upload', protect, docUpload.single('document'), uploadProviderDocument);

// FCM token (push notifications)
router.post('/fcm-token', protect, updateFCMToken);

// ─── Vehicles (Step 3 — repeatable) ───────────────────────────────────────────
router.post('/vehicles',                       protect, addVehicle);
router.get('/vehicles',                        protect, getMyVehicles);
router.get('/vehicles/:vehicleId',             protect, getVehicleById);
router.put('/vehicles/:vehicleId',             protect, updateVehicle);
router.delete('/vehicles/:vehicleId',          protect, deleteVehicle);
router.post('/vehicles/:vehicleId/documents',  protect, docUpload.single('document'), uploadVehicleDocument);
router.post('/vehicles/:vehicleId/request-change', protect, requestVehicleChange);

// ⚠️  Dynamic :id route MUST be last — warna /me, /stats, /vehicles sab catch ho jaate hain
router.get('/:id', getProviderById);

module.exports = router;
