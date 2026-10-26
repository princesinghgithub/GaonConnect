const express = require('express');
const router  = express.Router();

const { protect, admin } = require('../middleware/auth');
const {
  getActiveBanners, trackClick,
  listBanners, createBanner, updateBanner, deleteBanner,
} = require('../controllers/bannerController');

// App
router.get('/',           protect, getActiveBanners);
router.post('/:id/click', protect, trackClick);

// Admin — banner banane/badalne ke liye app release ki zarurat nahi
router.get('/admin/all',  protect, admin, listBanners);
router.post('/admin',     protect, admin, createBanner);
router.put('/admin/:id',  protect, admin, updateBanner);
router.delete('/admin/:id', protect, admin, deleteBanner);

module.exports = router;
