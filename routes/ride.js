const express = require('express');
const router  = express.Router();
const { protect }  = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { calculateDistance, calculateDuration } = require('../utils/fareCalculator');
const { getAllDynamicFares, getDynamicFare, getCurrentSurgeInfo, getDynamicServices, getDynamicVehicleTypes } = require('../utils/dynamicFare');

const {
  createRide,
  getRideById,
  getRideInvoice,
  getCurrentRideCustomer,
  getCurrentRideDriver,
  acceptRide,
  rejectRide,
  updateRideStatus,
  verifyOTPAndStart,
  cancelRide,
  getRideHistoryCustomer,
  getRideHistoryDriver,
  getSearchingRides,
  getScheduledRidesDriver,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPaymentQrCode,
  getPaymentQrStatus,
} = require('../controllers/rideController');

// ─── Customer ─────────────────────────────────────────────────────────────────
router.post('/create',          protect, validate(schemas.createRide), createRide);
router.get('/current/customer', protect, getCurrentRideCustomer);
router.get('/history/customer', protect, getRideHistoryCustomer);

// ─── Driver ───────────────────────────────────────────────────────────────────
router.get('/current/driver',   protect, getCurrentRideDriver);
router.post('/accept',          protect, acceptRide);
router.post('/reject',          protect, rejectRide);
router.put('/status',           protect, updateRideStatus);
router.post('/verify-otp',      protect, verifyOTPAndStart);
router.get('/history/driver',   protect, getRideHistoryDriver);
router.get('/searching',        protect, getSearchingRides);
router.get('/scheduled/driver', protect, getScheduledRidesDriver);

// ─── Common ───────────────────────────────────────────────────────────────────
router.post('/cancel', protect, cancelRide);

// ─── Razorpay (Online Fare Payment) ───────────────────────────────────────────
router.post('/:id/razorpay-order', protect, createRazorpayOrder);
router.post('/razorpay-verify',    protect, verifyRazorpayPayment);

// ─── Razorpay (Cash Ride QR Collection — Driver App) ──────────────────────────
router.post('/payment/qr-code',        protect, createPaymentQrCode);
router.get('/payment/qr-code/status',  protect, getPaymentQrStatus);

// ─── Tractor/JCB Services List (rates admin panel se editable) ───────────────
// Public rakha hai — website ka anonymous landing page (pre-login) bhi isse
// pricing preview dikhata hai, waha auth token nahi hota.
router.get('/services/:vehicleType', async (req, res) => {
  try {
    const services = await getDynamicServices(req.params.vehicleType);
    if (!services) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    return res.json({ success: true, data: services });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Vehicle-type catalog (icon/label/hourly-support) ────────────────────────
// Public rakha hai — landing page ka pricing preview aur booking screens dono
// isse fetch kar sakte hain (naya type admin add kare toh yahin se aa jaayega).
router.get('/vehicle-types', async (req, res) => {
  try {
    const types = await getDynamicVehicleTypes();
    return res.json({ success: true, data: types });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Current Surge Status (App home screen pe badge dikhao) ──────────────────
// GET /api/ride/surge-status
router.get('/surge-status', protect, async (req, res) => {
  try {
    const surge = await getCurrentSurgeInfo();
    return res.json({ success: true, data: surge });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Fare Estimate — Full Breakdown ──────────────────────────────────────────
// GET /api/ride/fare-estimate?pickupLat=&pickupLng=&dropLat=&dropLng=&vehicleType=
router.get('/fare-estimate',
  protect,
  validate(schemas.fareEstimate, 'query'),
  async (req, res) => {
    try {
      const { pickupLat, pickupLng, dropLat, dropLng, vehicleType } = req.query;

      const distance = calculateDistance(
        Number(pickupLat), Number(pickupLng),
        Number(dropLat),   Number(dropLng),
      );
      const duration = calculateDuration(distance);

      const bookingDate = new Date();

      // Specific vehicle — detailed breakdown
      if (vehicleType) {
        const breakdown = await getDynamicFare(distance, vehicleType, { bookingDate });
        return res.json({
          success: true,
          data: { distance, duration, ...breakdown },
        });
      }

      // Sab vehicles — comparison ke liye
      const allFares = await getAllDynamicFares(distance, { bookingDate });

      // App ke liye simplified list bhi bhejo
      const fareList = Object.entries(allFares).map(([type, data]) => ({
        vehicleType:  type,
        totalFare:    data.totalFare,
        surgeActive:  data.surgeActive,
        surgeType:    data.surgeType,
        breakdown:    data.breakdown,
        driverEarnings: data.driverEarnings,
        rateCard:     data.rateCard,
      }));

      return res.json({
        success: true,
        data: {
          distance,
          duration,
          fares: fareList,
          surgeActive: fareList.some((f) => f.surgeActive),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── Invoice ──────────────────────────────────────────────────────────────────
router.get('/:id/invoice', protect, getRideInvoice);

// ⚠️  Dynamic :id — SABSE LAST
router.get('/:id', protect, getRideById);

module.exports = router;
