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
const { docUpload } = require('../middleware/upload');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

// ===== DASHBOARD =====
router.get('/stats/overview', adminController.getStats);
router.get('/activity/recent', adminController.getRecentActivity);
router.get('/revenue/chart', adminController.getRevenueChart);
router.get('/dashboard/metrics', adminController.getDashboardMetrics);
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/ai-agent/tasks', adminController.getAIAgentTasks);

// ===== DRIVERS MANAGEMENT =====
router.post('/drivers', adminController.createDriver);
router.get('/drivers', adminController.getAllDrivers);
router.get('/drivers/live-locations', adminController.getActiveDriversLocation);
router.get('/drivers/:id', adminController.getDriverById);
router.get('/drivers/:id/stats', adminController.getDriverStats);
router.get('/drivers/:id/performance', adminController.getDriverPerformance);

router.put('/drivers/:id/approve', adminController.approveDriver);
router.put('/drivers/:id/reject', adminController.rejectDriver);
router.put('/drivers/:id/block', adminController.blockDriver);
router.put('/drivers/:id/unblock', adminController.unblockDriver);
router.put('/drivers/:id/status', adminController.updateDriverStatus);
router.put('/drivers/:id/documents/verify', adminController.verifyDocument);
router.post('/drivers/:id/documents/upload', docUpload.single('document'), adminController.uploadDriverDocumentAdmin);
router.put('/drivers/:id/bank-details/verify', adminController.verifyBankDetails);
router.put('/drivers/:id/bank-details', adminController.updateBankDetailsAdmin);
router.put('/drivers/:id/profile', adminController.updateDriverProfileAdmin);
router.delete('/drivers/:id', adminController.deleteDriver);
router.post('/drivers/:id/vehicles', adminController.addVehicleAdmin);

// ===== VEHICLES MANAGEMENT =====
router.get('/vehicles', adminController.getAllVehicles);
router.get('/vehicles/:id', adminController.getVehicleByIdAdmin);
router.put('/vehicles/:id/approve', adminController.approveVehicle);
router.put('/vehicles/:id/reject', adminController.rejectVehicle);
router.put('/vehicles/:id/documents/verify', adminController.verifyVehicleDocument);
router.post('/vehicles/:id/documents/upload', docUpload.single('document'), adminController.uploadVehicleDocumentAdmin);
router.put('/vehicles/:id', adminController.updateVehicleAdmin);
router.put('/vehicles/:id/change-request/resolve', adminController.resolveVehicleChangeRequest);
router.delete('/vehicles/:id', adminController.deleteVehicleAdmin);

// ===== RIDES MANAGEMENT =====
router.get('/rides', adminController.getAllRides);
router.get('/rides/stats', adminController.getRideStats);
router.get('/rides/ongoing', adminController.getOngoingRides);
router.get('/rides/:id', adminController.getRideDetails);
router.get('/rides/:id/track', adminController.trackRide);
router.post('/rides/:id/cancel', adminController.cancelRideAdmin);

// ===== PAYMENTS =====
router.get('/payments', adminController.getAllPayments);
router.get('/payments/stats', adminController.getPaymentStats);
router.get('/payments/withdrawals/pending', adminController.getPendingWithdrawals);
router.get('/payments/commission', adminController.getCommissionReport);
router.put('/payments/withdrawal/:id', adminController.processWithdrawal);

// ===== USERS/CUSTOMERS =====
router.post('/users', adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);

// ===== SETTINGS =====
router.get('/settings', adminController.getSettings);
router.get('/config', adminController.getSystemConfig);
router.put('/settings', adminController.updateSettings);
router.put('/pricing', adminController.updatePricing);
router.get('/hourly-rates', adminController.getHourlyRates);
router.put('/hourly-rates', adminController.updateHourlyRate);
router.get('/vehicle-types', adminController.getVehicleTypes);
router.post('/vehicle-types', adminController.createVehicleType);
router.delete('/vehicle-types/:id', adminController.deleteVehicleType);

// ===== REPORTS & ANALYTICS =====
router.get('/analytics', adminController.getAnalytics);
router.get('/reports/export', adminController.exportReport);

// ===== NOTIFICATIONS =====
router.post('/notifications/send', adminController.sendNotification);
router.post('/notifications/bulk', adminController.sendBulkNotification);

// ===== PROMO CODES =====
router.get('/promos', adminController.getAllPromos);
router.post('/promos', adminController.createPromo);
router.put('/promos/:id', adminController.updatePromo);
router.delete('/promos/:id', adminController.deletePromo);

// ===== MANUAL DRIVER ASSIGN =====
router.put('/rides/:id/assign', adminController.assignDriverToRide);

// ===== EXPIRING DOCUMENTS =====
router.get('/vehicles/expiring', adminController.getExpiringDocuments);

// ===== COMPLAINTS =====
router.get('/complaints', adminController.getAllComplaints);
router.post('/complaints', adminController.createComplaint);
router.put('/complaints/:id', adminController.updateComplaint);
router.delete('/complaints/:id', adminController.deleteComplaint);

// ===== DB FIX =====
router.post('/fix/roles', adminController.fixUserRoles);

module.exports = router;