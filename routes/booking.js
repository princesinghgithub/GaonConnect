const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  createBooking,
  getUserBookings,
  getDriverBookings,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  startRide,
  completeRide,
  cancelRide,
  driverRideResponse,
  getDriverEarnings
} = require('../controllers/bookingController');


// USER
router.post('/create', protect, createBooking);
router.get('/user/history', protect, getUserBookings);

// DRIVER
router.get('/driver/history', protect, getDriverBookings);
router.get('/driver/earnings', protect, getDriverEarnings);
router.post('/ride-response', protect, driverRideResponse);

// COMMON
router.put('/:id/status', protect, updateBookingStatus);
router.post('/:id/start', protect, startRide);
router.post('/:id/complete', protect, completeRide);
router.post('/:id/cancel', protect, cancelRide);
router.get('/:id', protect, getBookingById);

// ADMIN (optional)
router.get('/admin/all', protect, getAllBookings);

module.exports = router;
