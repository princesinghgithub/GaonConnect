const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { chat } = require('../controllers/agentController');

router.use(protect);
router.use(admin);

router.post('/chat', chat);

module.exports = router;
