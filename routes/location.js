// // routes/location.js
// const express = require('express');
// const router = express.Router();
// const {
//   searchLocation,
//   getPlaceDetails,
//   reverseGeocode,
//   calculateDistance
// } = require('../controllers/locationController');

// // Search locations (autocomplete)
// router.get('/search', searchLocation);

// // Get place details by ID
// router.get('/details/:placeId', getPlaceDetails);

// // Reverse geocode (coordinates to address)
// router.get('/reverse', reverseGeocode);

// // Calculate distance and duration
// router.post('/distance', calculateDistance);

// module.exports = router;




const express = require('express');
const router = express.Router();

// Import controller functions
const {
  searchLocation,
  getPlaceDetails,
  reverseGeocode,
  calculateDistance
} = require('../controllers/locationController');

// Routes
router.get('/search', searchLocation);
router.get('/details/:placeId', getPlaceDetails);
router.get('/reverse', reverseGeocode);
router.post('/distance', calculateDistance);

module.exports = router;