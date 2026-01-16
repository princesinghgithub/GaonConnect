const express = require('express');
const router = express.Router();
const { protect}= require('../middleware/auth');

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
  getRideHistoryDriver,getSearchingRides
} = require('../controllers/rideController');

// ========== CUSTOMER ROUTES ==========
// Create new ride request
router.post('/create', protect, createRide);

// Get current active ride
router.get('/current/customer', protect, getCurrentRideCustomer);

// Get ride history
router.get('/history/customer', protect, getRideHistoryCustomer);

// ========== DRIVER ROUTES ==========
// Get current active ride
router.get('/current/driver', protect, getCurrentRideDriver);

// Accept ride request
router.post('/accept', protect, acceptRide);

// Reject ride request
router.post('/reject', protect, rejectRide);

// Update ride status (arrived, started, completed)
router.put('/status', protect, updateRideStatus);

// Verify OTP and start ride
router.post('/verify-otp', protect, verifyOTPAndStart);

// Get ride history
router.get('/history/driver', protect, getRideHistoryDriver);

// ========== COMMON ROUTES ==========
// Get specific ride details
router.get('/:id', protect, getRideById);

// Cancel ride
router.post('/cancel', protect, cancelRide);

router.get('/searching', protect, getSearchingRides);

module.exports = router;