const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const { sosLimiter }  = require('../middleware/rateLimiter');
const { triggerSOS, resolveSOSAlert, getActiveAlerts, getAlertHistory } = require('../controllers/sosController');

// SOS trigger — logged-in user (customer ya driver)
// sosLimiter — har user ke 20 / 10 min (spam rokne ke liye, asli SOS nahi)
router.post('/trigger', protect, sosLimiter, triggerSOS);

// Admin routes
router.put('/:alertId/resolve', protect, admin, resolveSOSAlert);
router.get('/active',           protect, admin, getActiveAlerts);
router.get('/history',          protect, admin, getAlertHistory);

module.exports = router;
