const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const { strictLimiter }  = require('../middleware/rateLimiter');
const { triggerSOS, resolveSOSAlert, getActiveAlerts, getAlertHistory } = require('../controllers/sosController');

// SOS trigger — logged-in user (customer ya driver)
// strictLimiter — 5/hour (prevent spam)
router.post('/trigger', protect, strictLimiter, triggerSOS);

// Admin routes
router.put('/:alertId/resolve', protect, admin, resolveSOSAlert);
router.get('/active',           protect, admin, getActiveAlerts);
router.get('/history',          protect, admin, getAlertHistory);

module.exports = router;
