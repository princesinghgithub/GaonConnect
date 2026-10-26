const express = require('express');
const router  = express.Router();

const { protect }    = require('../middleware/auth');
const { docUpload, createPhotoUpload }  = require('../middleware/upload');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { validate, schemas }        = require('../middleware/validate');

const {
  getAvailableProviders,
  getProviderById,
  registerProvider,
  updateProviderStatus,
  toggleDuty,
  updateProviderLocation,
  getProviderStats,
  getProviderProfile,
  updateProviderProfile,
  updateBankDetails,
  updatePreferences,
  getTodayEarnings,
  getWeeklyEarnings,
  updateFCMToken,
  uploadProfilePhoto,
  uploadProviderDocument,
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  updateVehicleEquipment,
  deleteVehicle,
  uploadVehicleDocument,
  requestVehicleChange,
} = require('../controllers/providerController');

const { sendPhoneOTP, verifyPhoneOTP } = require('../controllers/authController');

// ─── Profile photo upload config ─────────────────────────────────────────────
const photoUpload = createPhotoUpload('gaonconnect/profile');

// Driver ki kisi bhi list/jawab mein safar ka OTP na jaaye (login wale OTP
// routes token ke bina hain — un par ye lagta hi nahi)
router.use(require('../middleware/hideOtpFromDriver'));

// ─── PUBLIC ROUTES — no token needed ─────────────────────────────────────────

// Driver OTP login (phone based)
router.post('/send-phone-otp',   otpLimiter,   validate(schemas.sendPhoneOTP),   sendPhoneOTP);
router.post('/verify-phone-otp', loginLimiter, validate(schemas.verifyPhoneOTP), verifyPhoneOTP);

// Provider registration (KYC + vehicle, ek hi request mein) — naye driver ke paas token nahi hota
router.post('/register', docUpload.fields([
  { name: 'profilePhoto',  maxCount: 1 },
  { name: 'aadhaarPhoto',  maxCount: 1 },
  { name: 'aadhaarBackPhoto', maxCount: 1 },
  { name: 'panPhoto',      maxCount: 1 }, // optional
  { name: 'insurancePhoto', maxCount: 1 }, // optional
  { name: 'licensePhoto',  maxCount: 1 },
  { name: 'licenseBackPhoto', maxCount: 1 },
  { name: 'rcPhoto',       maxCount: 1 },
  { name: 'rcBackPhoto',   maxCount: 1 },
  { name: 'vehiclePhoto',  maxCount: 1 }, // optional
]), registerProvider);

// Available providers near location
// Login zaroori — bina login ke koi bhi online drivers ki jagah scrape kar sakta tha
router.get('/available', protect, getAvailableProviders);

// ─── PROTECTED ROUTES — token required ───────────────────────────────────────

// Profile
router.get('/me',             protect, getProviderProfile);
router.get('/profile/me',     protect, getProviderProfile);
router.put('/profile/update', protect, updateProviderProfile);
router.post('/profile/photo', protect, photoUpload.single('photo'), uploadProfilePhoto);

// Status & Duty
router.put('/status',      protect, updateProviderStatus);
router.put('/duty-toggle', protect, toggleDuty);

// Location
router.put('/location', protect, updateProviderLocation);

// Stats & Earnings
router.get('/stats/me',        protect, getProviderStats);

// ─── Demand heatmap (Rapido Captain jaisa) ───────────────────────────────────
// "Kahan zyada booking aa rahi hai" — pichhle 60 minute ki bookings driver ke
// aas-paas (~30 km) ~1.5 km ke khaano mein gini jaati hain, sirf us gaadi ki
// jo driver chalata hai. Jo booking bina driver ke cancel hui (customer ko
// koi mila hi nahi) wo dugni ginti — wahi asli chhooti hui kamai hai. Aur
// agle 24 ghante ki khuli pre-bookings alag. Customer ka naam/pata nahi
// jaata — sirf khaane ka beech aur ginti.
router.get('/demand', protect, async (req, res) => {
  try {
    const Provider = require('../models/Provider');
    const Ride     = require('../models/Ride');
    const { rideTypesFor } = require('../utils/vehicleMatch');
    const provider = await Provider.findOne({ user: req.user.id }).select('currentLocation activeVehicle').populate('activeVehicle');
    if (!provider) return res.status(403).json({ success: false, message: 'Driver nahi mila' });

    const [pLng, pLat] = provider.currentLocation?.coordinates || [];
    const lat = Number(req.query.lat) || pLat;
    const lng = Number(req.query.lng) || pLng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return res.json({ success: true, data: { cells: [], scheduled: [], total: 0, windowMinutes: 60, center: null } });
    }

    const types = provider.activeVehicle ? rideTypesFor(provider.activeVehicle) : [];
    const BOX = 0.28;             // ~30 km
    const CELL = 0.014;           // ~1.5 km
    const box = {
      'pickup.coordinates.latitude':  { $gte: lat - BOX, $lte: lat + BOX },
      'pickup.coordinates.longitude': { $gte: lng - BOX, $lte: lng + BOX },
      ...(types.length ? { vehicleType: { $in: types } } : {}),
    };
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recent, scheduled] = await Promise.all([
      Ride.find({ ...box, createdAt: { $gte: since }, bookingType: { $ne: 'scheduled' } })
        .select('pickup.coordinates status provider').lean(),
      Ride.find({ ...box, status: 'scheduled', provider: null, scheduledAt: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 3600 * 1000) } })
        .select('pickup.coordinates').lean(),
    ]);

    const bucket = (rows, weightOf) => {
      const cells = new Map();
      rows.forEach((r) => {
        const la = Number(r.pickup?.coordinates?.latitude);
        const lo = Number(r.pickup?.coordinates?.longitude);
        if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
        const key = `${Math.floor(la / CELL)}:${Math.floor(lo / CELL)}`;
        const c = cells.get(key) || { lat: 0, lng: 0, n: 0, missed: 0, score: 0 };
        const w = weightOf(r);
        c.lat += la; c.lng += lo; c.n += 1; c.missed += w.missed; c.score += w.score;
        cells.set(key, c);
      });
      return [...cells.values()].map((c) => ({
        lat: +(c.lat / c.n).toFixed(4), lng: +(c.lng / c.n).toFixed(4),
        count: c.n, missed: c.missed, score: c.score,
      }));
    };
    const toRad = (d) => (d * Math.PI) / 180;
    const kmFrom = (c) => {
      const dLa = toRad(c.lat - lat); const dLo = toRad(c.lng - lng);
      const a = Math.sin(dLa / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLo / 2) ** 2;
      return +(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
    };

    // Customer ko driver mila hi nahi — chhooti hui demand, dugni ginti
    const missedOf = (r) => (r.status === 'cancelled' && !r.provider) || r.status === 'searching';
    const cells = bucket(recent, (r) => (missedOf(r) ? { missed: 1, score: 2 } : { missed: 0, score: 1 }))
      .map((c) => ({ ...c, km: kmFrom(c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    const sched = bucket(scheduled, () => ({ missed: 0, score: 1 }))
      .map((c) => ({ ...c, km: kmFrom(c) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({
      success: true,
      data: { cells, scheduled: sched, total: recent.length, windowMinutes: 60, center: { lat, lng } },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Aaj ka incentive target + progress (Rapido-style daily bonus).
router.get('/incentive/today', protect, async (req, res) => {
  try {
    const Provider = require('../models/Provider');
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) return res.status(403).json({ success: false, message: 'Driver nahi mila' });

    const { getDriverIncentiveStatus } = require('../utils/incentive');
    const data = await getDriverIncentiveStatus(provider._id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// Driver ke chalu offers — aaj ke har target ke saath kitna ho chuka.
// Driver app ki "Mere offer" screen isi se banti hai. Pehle yeh path tha hi
// nahi, to request neeche wale `/:id` mein gir jaati thi ("offers" ko driver
// ka id samajh kar).
router.get('/offers', protect, async (req, res) => {
  try {
    const Provider = require('../models/Provider');
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) return res.status(403).json({ success: false, message: 'Driver nahi mila' });

    const { getDriverIncentiveStatus } = require('../utils/incentive');
    const inc   = await getDriverIncentiveStatus(provider._id);
    // Incentive band ho to khaali list — jo bonus milega hi nahi use dikhana
    // driver se jhooth bolna hai.
    const tiers = inc?.enabled ? (inc.tiers || []) : [];

    const data = tiers.map((tier, i) => ({
      _id:       `daily-${i}`,
      rides:     Number(tier.rides) || 0,
      ridesDone: Number(inc?.ridesToday) || 0,
      bonus:     Number(tier.bonus) || 0,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
// ─── Refer & Earn (driver app → Profile → Refer & Earn) ──────────────────────
router.get('/referral', protect, async (req, res) => {
  try {
    const { getDriverReferralSummary } = require('../utils/referral');
    res.json({ success: true, data: await getDriverReferralSummary(req.user.id) });
  } catch (err) {
    console.error('driver referral error:', err.message);
    res.status(500).json({ success: false, message: 'Referral info laane mein error' });
  }
});

router.post('/referral/apply', protect, async (req, res) => {
  try {
    const { applyDriverReferralCode } = require('../utils/referral');
    const result = await applyDriverReferralCode(req.user.id, req.body?.code);
    res.status(result.ok ? 200 : 400).json({ success: result.ok, message: result.message });
  } catch (err) {
    console.error('driver referral apply error:', err.message);
    res.status(500).json({ success: false, message: 'Referral code lagane mein error' });
  }
});

// ─── Rewards — saare bonus ka hisaab (daily target + referral) ───────────────
// Purane customer-wallet wale referral bonus bhi (jab driver ka bonus User
// wallet mein jaata tha) — taaki driver ko apni poori kamai dikhe.
router.get('/rewards', protect, async (req, res) => {
  try {
    const Provider    = require('../models/Provider');
    const Transaction = require('../models/Transaction');
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const match = {
      type: 'credit',
      status: 'completed',
      $or: [
        { provider: provider._id, category: { $in: ['incentive', 'referral_bonus'] } },
        { user: req.user._id, category: 'referral_bonus' },
      ],
    };
    const IST = 5.5 * 60 * 60 * 1000;
    const ist = new Date(Date.now() + IST);
    const monthStart = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST);

    const [items, totals] = await Promise.all([
      Transaction.find(match).select('category amount description createdAt').sort({ createdAt: -1 }).limit(100).lean(),
      Transaction.aggregate([
        { $match: match },
        { $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, '$amount', 0] } },
          count: { $sum: 1 },
        } },
      ]),
    ]);

    const by = Object.fromEntries(totals.map((t) => [t._id, t]));
    res.json({
      success: true,
      data: {
        totalEarned: totals.reduce((a, t) => a + t.total, 0),
        thisMonth:   totals.reduce((a, t) => a + t.thisMonth, 0),
        incentive:   by.incentive?.total || 0,
        referral:    by.referral_bonus?.total || 0,
        items,
      },
    });
  } catch (err) {
    console.error('driver rewards error:', err.message);
    res.status(500).json({ success: false, message: 'Rewards laane mein error' });
  }
});

router.get('/earnings/today',  protect, getTodayEarnings);
router.get('/earnings/weekly', protect, getWeeklyEarnings);
router.get('/earnings/daily',  protect, require('../controllers/providerController').getDailyEarnings);

// Bank & Preferences
router.put('/bank-details', protect, updateBankDetails);
router.put('/preferences',  protect, updatePreferences);

// Document upload (Provider-level KYC — aadhaar)
router.post('/documents/upload', protect, docUpload.single('document'), uploadProviderDocument);

// FCM token (push notifications)
router.post('/fcm-token', protect, updateFCMToken);

// ─── Vehicles (Step 3 — repeatable) ───────────────────────────────────────────
router.post('/vehicles',                       protect, addVehicle);
router.get('/vehicles',                        protect, getMyVehicles);
router.get('/vehicles/:vehicleId',             protect, getVehicleById);
router.put('/vehicles/:vehicleId',             protect, updateVehicle);
router.put('/vehicles/:vehicleId/equipment',   protect, updateVehicleEquipment);
router.delete('/vehicles/:vehicleId',          protect, deleteVehicle);
router.post('/vehicles/:vehicleId/documents',  protect, docUpload.single('document'), uploadVehicleDocument);
router.post('/vehicles/:vehicleId/request-change', protect, requestVehicleChange);

// ⚠️  Dynamic :id route MUST be last — warna /me, /stats, /vehicles sab catch ho jaate hain
router.get('/:id', protect, getProviderById);

module.exports = router;
