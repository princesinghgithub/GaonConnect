// const express = require('express');
// const router = express.Router();
// const { protect, admin } = require('../middleware/auth');
// const {
//   getAdminStats,
//   getRecentActivity,
//   getAllUsers,
//   getAllProviders,
//   approveProvider,
//   getBookingAnalytics
// } = require('../controllers/adminController');

// // All routes are protected and admin-only
// router.use(protect);
// router.use(admin);

// // Dashboard
// router.get('/stats', getAdminStats);
// router.get('/activity', getRecentActivity);
// router.get('/analytics/bookings', getBookingAnalytics);

// // User management
// router.get('/users', getAllUsers);

// // Provider management
// router.get('/providers', getAllProviders);
// router.put('/providers/:id/approve', approveProvider);

// module.exports = router;


// routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

// ===== DASHBOARD =====
router.get('/stats/overview', adminController.getStats);
router.get('/activity/recent', adminController.getRecentActivity);
router.get('/revenue/chart', adminController.getRevenueChart);
router.get('/dashboard/metrics', adminController.getDashboardMetrics);

// ===== DRIVERS MANAGEMENT =====
router.get('/drivers', adminController.getAllDrivers);
router.get('/drivers/:id', adminController.getDriverById);
router.get('/drivers/:id/stats', adminController.getDriverStats);
router.get('/drivers/:id/performance', adminController.getDriverPerformance);

router.put('/drivers/:id/approve', adminController.approveDriver);
router.put('/drivers/:id/reject', adminController.rejectDriver);
router.put('/drivers/:id/block', adminController.blockDriver);
router.put('/drivers/:id/unblock', adminController.unblockDriver);
router.put('/drivers/:id/status', adminController.updateDriverStatus);
router.put('/drivers/:id/documents/verify', adminController.verifyDocument);
router.delete('/drivers/:id', adminController.deleteDriver);

// ===== RIDES MANAGEMENT =====
router.get('/rides', adminController.getAllRides);
router.get('/rides/stats', adminController.getRideStats);
router.get('/rides/ongoing', adminController.getOngoingRides);
router.get('/rides/:id', adminController.getRideDetails);
router.get('/rides/:id/track', adminController.trackRide);
router.post('/rides/:id/cancel', adminController.cancelRideAdmin);

// ===== LIVE MAP =====
router.get('/drivers/live-locations', adminController.getActiveDriversLocation);

// ===== PAYMENTS =====
router.get('/payments', adminController.getAllPayments);
router.get('/payments/stats', adminController.getPaymentStats);
router.get('/payments/withdrawals/pending', adminController.getPendingWithdrawals);
router.get('/payments/commission', adminController.getCommissionReport);
router.put('/payments/withdrawal/:id', adminController.processWithdrawal);

// ===== USERS/CUSTOMERS =====
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);

// ===== SETTINGS =====
router.get('/settings', adminController.getSettings);
router.get('/config', adminController.getSystemConfig);
router.put('/settings', adminController.updateSettings);
router.put('/pricing', adminController.updatePricing);

// ===== REPORTS & ANALYTICS =====
router.get('/analytics', adminController.getAnalytics);
router.get('/reports/export', adminController.exportReport);

// ===== NOTIFICATIONS =====
router.post('/notifications/send', adminController.sendNotification);
router.post('/notifications/bulk', adminController.sendBulkNotification);

module.exports = router;