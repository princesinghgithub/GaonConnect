// const express = require('express');
// const router = express.Router();
// const { protect}= require('../middleware/auth');

// const {
//   createRide,
//   getRideById,
//   getCurrentRideCustomer,
//   getCurrentRideDriver,
//   acceptRide,
//   rejectRide,
//   updateRideStatus,
//   verifyOTPAndStart,
//   cancelRide,
//   getRideHistoryCustomer,
//   getRideHistoryDriver,getSearchingRides
// } = require('../controllers/rideController');

// // ========== CUSTOMER ROUTES ==========
// // Create new ride request
// router.post('/create', protect, createRide);

// // Get current active ride
// router.get('/current/customer', protect, getCurrentRideCustomer);

// // Get ride history
// router.get('/history/customer', protect, getRideHistoryCustomer);

// // ========== DRIVER ROUTES ==========
// // Get current active ride
// router.get('/current/driver', protect, getCurrentRideDriver);

// // Accept ride request
// router.post('/accept', protect, acceptRide);

// // Reject ride request
// router.post('/reject', protect, rejectRide);

// // Update ride status (arrived, started, completed)
// router.put('/status', protect, updateRideStatus);

// // Verify OTP and start ride
// router.post('/verify-otp', protect, verifyOTPAndStart);

// // Get ride history
// router.get('/history/driver', protect, getRideHistoryDriver);

// // ========== COMMON ROUTES ==========
// // Get specific ride details
// router.get('/:id', protect, getRideById);

// // Cancel ride
// router.post('/cancel', protect, cancelRide);

// router.get('/searching', protect, getSearchingRides);

// module.exports = router;

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { calculateFare, calculateDistance, calculateDuration } = require('../utils/fareCalculator');

const {
  createRide,
  getRideById,
  getCurrentRideCustomer,
  getCurrentRideDriver,
  acceptRide,
  rejectRide,
  updateRideStatus,
  verifyOTPAndStart,
  cancelRide,
  getRideHistoryCustomer,
  getRideHistoryDriver,
  getSearchingRides,getScheduledRidesDriver
} = require('../controllers/rideController');

// ========== SPECIFIC ROUTES PEHLE — /:id se pehle! ==========

// Customer
router.post('/create',          protect, createRide);
router.get('/current/customer', protect, getCurrentRideCustomer);
router.get('/history/customer', protect, getRideHistoryCustomer);

// Driver
router.get('/current/driver',   protect, getCurrentRideDriver);
router.post('/accept',          protect, acceptRide);
router.post('/reject',          protect, rejectRide);
router.put('/status',           protect, updateRideStatus);
router.post('/verify-otp',      protect, verifyOTPAndStart);
router.get('/history/driver',   protect, getRideHistoryDriver);
router.get('/searching',        protect, getSearchingRides);
router.get('/scheduled/driver', protect, getScheduledRidesDriver);  

// Common
router.post('/cancel',          protect, cancelRide);

// ✅ FARE ESTIMATE — /:id se pehle ZAROORI
router.get('/fare-estimate', protect, (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng } = req.query;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res.status(400).json({ success: false, message: 'Coordinates required' });
    }

    const distance = calculateDistance(
      parseFloat(pickupLat), parseFloat(pickupLng),
      parseFloat(dropLat),   parseFloat(dropLng)
    );

    const duration = calculateDuration(distance);

    const fares = {
      bike:    calculateFare(distance, 'bike'),
      auto:    calculateFare(distance, 'auto'),
      car:     calculateFare(distance, 'car'),
      tractor: calculateFare(distance, 'tractor'),
      tempo:   calculateFare(distance, 'tempo'),
      truck:   calculateFare(distance, 'truck'),
      jcb:     calculateFare(distance, 'jcb'),
    };

    return res.json({
      success: true,
      data: { distance, duration, fares }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ⚠️ DYNAMIC ROUTE — SABSE LAST MEIN
router.get('/:id', protect, getRideById);

module.exports = router;
