const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/auth');
const { createComplaint, myComplaints } = require('../controllers/supportController');

// Dono apps ke liye — customer aur driver, dono shikayat kar sakte hain.
router.post('/complaint',  protect, createComplaint);
router.get('/complaints',  protect, myComplaints);

module.exports = router;
