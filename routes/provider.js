// // const express = require('express');
// // const router = express.Router();
// // const { protect } = require('../middleware/auth');
// // const multer = require('multer');

// // // Configure multer for file uploads
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, 'uploads/documents/');
// //   },
// //   filename: function (req, file, cb) {
// //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// //     cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
// //   }
// // });

// // const upload = multer({ 
// //   storage: storage,
// //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// //   fileFilter: (req, file, cb) => {
// //     if (file.mimetype.startsWith('image/')) {
// //       cb(null, true);
// //     } else {
// //       cb(new Error('Only image files are allowed'), false);
// //     }
// //   }
// // });

// // const {
// //   getAvailableProviders,
// //   getProviderById,
// //   registerProvider,
// //   updateProviderStatus,
// //   toggleDuty,
// //   updateProviderLocation,
// //   getProviderStats,
// //   getProviderProfile,
// //   updateProviderProfile,
// //   updateBankDetails,
// //   updatePreferences,
// //   getTodayEarnings,
// //   getWeeklyEarnings,
// //   uploadDocument,
// //   updateFCMToken,uploadProfilePhoto
// // } = require('../controllers/providerController');

// // // ========== PUBLIC ROUTES ==========
// // // Get available providers near location
// // router.get('/available', getAvailableProviders);

// // // Get specific provider details
// // router.get('/:id', getProviderById);

// // // ========== PROTECTED ROUTES ==========
// // // Provider registration
// // router.post('/register', protect, registerProvider);

// // // Profile management
// // router.get('/profile/me', protect, getProviderProfile);
// // router.put('/profile/update', protect, updateProviderProfile);

// // router.post('/profile/photo', protect, uploadPhoto, uploadProfilePhoto);

// // // Status management
// // router.put('/status', protect, updateProviderStatus);
// // router.put('/duty-toggle', protect, toggleDuty);

// // // Location management
// // router.put('/location', protect, updateProviderLocation);

// // // Stats & Earnings
// // router.get('/stats/me', protect, getProviderStats);
// // router.get('/earnings/today', protect, getTodayEarnings);
// // router.get('/earnings/weekly', protect, getWeeklyEarnings);

// // // Bank details
// // router.put('/bank-details', protect, updateBankDetails);

// // // Preferences
// // router.put('/preferences', protect, updatePreferences);

// // // Document upload
// // router.post('/documents/upload', protect, upload.single('document'), uploadDocument);

// // // FCM Token for notifications
// // router.post('/fcm-token', protect, updateFCMToken);

// // module.exports = router;


// // const express = require('express');
// // const router = express.Router();
// // const { protect } = require('../middleware/auth');
// // const { docUpload } = require(
// //   '../middleware/upload');

// // const multer = require('multer');
// // const path = require('path');

// // const {
// //   getAvailableProviders,
// //   getProviderById,
// //   registerProvider,
// //   updateProviderStatus,
// //   toggleDuty,
// //   updateProviderLocation,
// //   getProviderStats,
// //   getProviderProfile,
// //   updateProviderProfile,
// //   updateBankDetails,
// //   updatePreferences,
// //   getTodayEarnings,
// //   getWeeklyEarnings,
// //   uploadDocument,
// //   updateFCMToken,
// //   uploadProfilePhoto,uploadDoc
// // } = require('../controllers/providerController');


// // // ========== PROFILE PHOTO UPLOAD MULTER ==========
// // const photoStorage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, 'uploads/profile/'),
// //   filename: (req, file, cb) =>
// //     cb(null, 'profile-' + Date.now() + path.extname(file.originalname))
// // });

// // const photoFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith('image/')) cb(null, true);
// //   else cb(new Error('Only image files allowed'), false);
// // };

// // const photoUpload = multer({
// //   storage: photoStorage,
// //   limits: { fileSize: 5 * 1024 * 1024 },
// //   fileFilter: photoFilter
// // });


// // // ========== DOCUMENT UPLOAD ==========
// // const docStorage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, 'uploads/documents/'),
// //   filename: (req, file, cb) =>
// //     cb(null, 'doc-' + Date.now() + path.extname(file.originalname))
// // });

// // const docUpload = multer({ storage: docStorage });


// // // ================= ROUTES =================

// // // Public
// // router.get('/available', getAvailableProviders);
// // router.get('/:id', getProviderById);

// // // Register
// // router.post('/register', protect, registerProvider);

// // // Profile
// // router.get('/profile/me', protect, getProviderProfile);
// // router.put('/profile/update', protect, updateProviderProfile);

// // // Upload profile photo
// // router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto);

// // // Status / Duty
// // router.put('/status', protect, updateProviderStatus);
// // router.put('/duty-toggle', protect, toggleDuty);

// // // Location
// // router.put('/location', protect, updateProviderLocation);

// // // Stats
// // router.get('/stats/me', protect, getProviderStats);
// // router.get('/earnings/today', protect, getTodayEarnings);
// // router.get('/earnings/weekly', protect, getWeeklyEarnings);

// // // Bank + Preferences
// // router.put('/bank-details', protect, updateBankDetails);
// // router.put('/preferences', protect, updatePreferences);

// // // Documents
// // router.post('/documents/upload', 
// //   protect, 
// //   docUpload.single('document'),  // Only apply multer once
// //   uploadDoc                       // Your actual controller
// // );

// // // FCM Token
// // router.post('/fcm-token', protect, updateFCMToken);

// // module.exports = router;





// // const express = require('express');
// // const router = express.Router();
// // const { protect } = require('../middleware/auth');
// // const { docUpload } = require('../middleware/upload');
// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs');

// // const {
// //   getAvailableProviders,
// //   getProviderById,
// //   registerProvider,
// //   updateProviderStatus,
// //   toggleDuty,
// //   updateProviderLocation,
// //   getProviderStats,
// //   getProviderProfile,
// //   updateProviderProfile,
// //   updateBankDetails,
// //   updatePreferences,
// //   getTodayEarnings,
// //   getWeeklyEarnings,
// //   updateFCMToken,
// //   uploadProfilePhoto,
// //   uploadDoc
// // } = require('../controllers/providerController');

// // // ========== ENSURE UPLOAD DIRECTORIES EXIST ==========
// // const profileDir = 'uploads/profile/';
// // const documentsDir = 'uploads/documents/';

// // if (!fs.existsSync(profileDir)) {
// //   fs.mkdirSync(profileDir, { recursive: true });
// // }
// // if (!fs.existsSync(documentsDir)) {
// //   fs.mkdirSync(documentsDir, { recursive: true });
// // }

// // // ========== PROFILE PHOTO UPLOAD MULTER ==========
// // const photoStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'uploads/profile/');
// //   },
// //   filename: (req, file, cb) => {
// //     const userId = req.user?.id || 'user';
// //     cb(null, `profile-${userId}-${Date.now()}${path.extname(file.originalname)}`);
// //   }
// // });

// // const photoFilter = (req, file, cb) => {
// //   const allowed = /jpeg|jpg|png/;
// //   const extname = allowed.test(path.extname(file.originalname).toLowerCase());
// //   const mimetype = file.mimetype.startsWith('image/');
  
// //   if (extname && mimetype) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only JPG/PNG image files are allowed'));
// //   }
// // };

// // const photoUpload = multer({
// //   storage: photoStorage,
// //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// //   fileFilter: photoFilter
// // });

// // // ================= ROUTES =================

// // // Public
// // router.get('/available', getAvailableProviders);
// // router.get('/:id', getProviderById);

// // // Register
// // router.post('/register', protect, registerProvider);

// // // Profile
// // router.get('/profile/me', protect, getProviderProfile);
// // router.put('/profile/update', protect, updateProviderProfile);

// // // Upload profile photo
// // router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto)

// // // Status / Duty
// // router.put('/status', protect, updateProviderStatus);
// // router.put('/duty-toggle', protect, toggleDuty);

// // // Location
// // router.put('/location', protect, updateProviderLocation);

// // // Stats
// // router.get('/stats/me', protect, getProviderStats);
// // router.get('/earnings/today', protect, getTodayEarnings);
// // router.get('/earnings/weekly', protect, getWeeklyEarnings);

// // // Bank + Preferences
// // router.put('/bank-details', protect, updateBankDetails);
// // router.put('/preferences', protect, updatePreferences);

// // // Documents (using middleware)
// // router.post('/documents/upload', protect, docUpload.single('document'), uploadDoc);

// // // FCM Token
// // router.post('/fcm-token', protect, updateFCMToken);

// // module.exports = router;


// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/auth');
// const { docUpload } = require('../middleware/upload');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const {
//   getAvailableProviders,
//   getProviderById,
//   registerProvider,
//   updateProviderStatus,
//   toggleDuty,
//   updateProviderLocation,
//   getProviderStats,
//   getProviderProfile,
//   updateProviderProfile,
//   updateBankDetails,
//   updatePreferences,
//   getTodayEarnings,
//   getWeeklyEarnings,
//   updateFCMToken,
//   uploadProfilePhoto,
//   uploadDoc
// } = require('../controllers/providerController');

// // OTP functions — authController se
// const { sendOTP, verifyOTP } = require('../controllers/authController');

// // Upload dirs
// ['uploads/profile/', 'uploads/documents/'].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// const photoStorage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/profile/'),
//   filename: (req, file, cb) => cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`)
// });
// const photoUpload = multer({
//   storage: photoStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) cb(null, true);
//     else cb(new Error('Only images allowed'));
//   }
// });

// // ============================================================
// // ✅ PUBLIC ROUTES — Koi token nahi chahiye
// // ============================================================
// router.post('/send-otp',   sendOTP);
// router.post('/verify-otp', verifyOTP);

// // ✅ REGISTER — protect BILKUL NAHI — naya driver token kahan se laayega?
// router.post('/register', docUpload.fields([
//   { name: 'profilePhoto', maxCount: 1 },
//   { name: 'licensePhoto', maxCount: 1 },
//   { name: 'rcPhoto',      maxCount: 1 },
// ]), registerProvider);

// router.get('/available', getAvailableProviders);

// // ============================================================
// // ✅ PROTECTED ROUTES — Token required
// // ============================================================
// router.get('/me',             protect, getProviderProfile);
// router.get('/profile/me',     protect, getProviderProfile);
// router.put('/profile/update', protect, updateProviderProfile);
// router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto);

// router.put('/status',      protect, updateProviderStatus);
// router.put('/duty-toggle', protect, toggleDuty);
// router.put('/location',    protect, updateProviderLocation);

// router.get('/stats/me',        protect, getProviderStats);
// router.get('/earnings/today',  protect, getTodayEarnings);
// router.get('/earnings/weekly', protect, getWeeklyEarnings);

// router.put('/bank-details',  protect, updateBankDetails);
// router.put('/preferences',   protect, updatePreferences);

// router.post('/documents/upload', protect, docUpload.single('document'), uploadDoc);
// router.post('/fcm-token',        protect, updateFCMToken);

// // ⚠️ ID route SABSE LAST — warna /me aur /stats ko intercept kar leta hai
// router.get('/:id', getProviderById);

// module.exports = router;


// routes/provider.js — POORA REPLACE KARO
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { docUpload } = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  uploadDoc
} = require('../controllers/providerController');

// OTP — authController se (same jo customer use karta hai)
const { sendOTP, verifyOTP } = require('../controllers/authController');

// Upload dirs ensure
['uploads/profile/', 'uploads/documents/'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profile/'),
  filename:    (req, file, cb) => cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`)
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// ============================================================
// PUBLIC ROUTES — Token bilkul nahi chahiye
// ============================================================

// OTP login (driver ke liye — same authController)
router.post('/send-otp',   sendOTP);
router.post('/verify-otp', verifyOTP);

// ✅ Register — protect NAHI — naye driver ke paas token kahan se aayega?
router.post('/register', docUpload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'rcPhoto',      maxCount: 1 },
]), registerProvider);

router.get('/available', getAvailableProviders);

// ============================================================
// PROTECTED ROUTES — Token required
// ============================================================
router.get('/me',             protect, getProviderProfile);   // Driver App /me
router.get('/profile/me',     protect, getProviderProfile);
router.put('/profile/update', protect, updateProviderProfile);
router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto);

router.put('/status',      protect, updateProviderStatus);
router.put('/duty-toggle', protect, toggleDuty);
router.put('/location',    protect, updateProviderLocation);

router.get('/stats/me',        protect, getProviderStats);
router.get('/earnings/today',  protect, getTodayEarnings);
router.get('/earnings/weekly', protect, getWeeklyEarnings);

router.put('/bank-details',  protect, updateBankDetails);
router.put('/preferences',   protect, updatePreferences);

router.post('/documents/upload', protect, docUpload.single('document'), uploadDoc);
router.post('/fcm-token',        protect, updateFCMToken);

// ⚠️ ID route SABSE LAST — warna /me, /stats sab catch ho jaate hain
router.get('/:id', getProviderById);

module.exports = router;
