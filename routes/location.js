const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const { protect } = require('../middleware/auth');
const {
  searchLocation,
  getPlaceDetails,
  reverseGeocode,
  calculateDistance,
} = require('../controllers/locationController');

// Ye routes pehle bilkul khule the — bina token ke koi bhi inhe hit kar sakta
// tha, yaani backend ek muft geocoding proxy ban gaya tha. Har call aage
// Nominatim jaati hai, jo ek shared 1-req/sec budget pe chalti hai, isliye
// bahar ka traffic seedha asli users ki search dheemi karta tha.
router.use(protect);

// Search har keystroke pe chalti hai (500ms debounce), toh limit thodi udaar
// honi chahiye — par itni nahi ki ek client akela poora Nominatim budget kha jaye.
const { userOrIpKey } = require('../middleware/rateLimiter');
const isDev = process.env.NODE_ENV !== 'production';

const searchLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             isDev ? 300 : 40,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    userOrIpKey,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: 'Bahut zyada search. Thodi der baad try karo.',
    }),
});

router.get('/search',            searchLimiter, searchLocation);
router.get('/details/:placeId',  searchLimiter, getPlaceDetails);
router.get('/reverse',           searchLimiter, reverseGeocode);

// Ab ye sadak ka raasta bahar se mangata hai (OSRM, ya GOOGLE_ROUTES_API_KEY
// ho to Google — paid) — isliye isi search limit ke andar.
router.post('/distance', searchLimiter, calculateDistance);

module.exports = router;
