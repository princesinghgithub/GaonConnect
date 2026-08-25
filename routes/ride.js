const express = require('express');
const router  = express.Router();
const { protect }  = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { calculateDistance, calculateDuration } = require('../utils/fareCalculator');
const { getAllDynamicFares, getDynamicFare, getCurrentSurgeInfo, getDynamicServices,
        getDynamicVehicleTypes, getDynamicWeddingPackages, getRateCard } = require('../utils/dynamicFare');

const {
  createRide,
  getRideById,
  getRideInvoice,
  getRideMessages,
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

// ─── Wedding Car Packages ────────────────────────────────────────────────────
// Wedding car ka kiraya per-km nahi banta — "8 ghante / 80 km" jaisa package
// hota hai. Public rakha hai taaki website ka pricing page bhi dikha sake.
router.get('/wedding-packages', async (req, res) => {
  try {
    const packages = await getDynamicWeddingPackages();
    return res.json({ success: true, data: packages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Rate Card (bina trip ke) ────────────────────────────────────────────────
// Customer booking se pehle hi dekh le ki kis cheez ka kitna lagta hai —
// isi se "No Hidden Charges" ka dawa sach hota hai.
router.get('/rate-card/:vehicleType', async (req, res) => {
  try {
    const card = await getRateCard(req.params.vehicleType);
    if (!card) return res.status(404).json({ success: false, message: 'Is vehicle ka rate card nahi mila' });
    return res.json({ success: true, data: card });
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
      const {
        pickupLat, pickupLng, dropLat, dropLng, vehicleType,
        pickupKm, waitMinutes, loading, unloading, helper,
      } = req.query;

      const distance = calculateDistance(
        Number(pickupLat), Number(pickupLng),
        Number(dropLat),   Number(dropLng),
      );
      const duration = calculateDuration(distance);

      const bookingDate = new Date();
      const fareOptions = {
        bookingDate,
        pickupKm:    Number(pickupKm)    || 0,
        waitMinutes: Number(waitMinutes) || 0,
        extras: { loading: !!loading, unloading: !!unloading, helper: !!helper },
      };

      // Specific vehicle — detailed breakdown
      if (vehicleType) {
        const breakdown = await getDynamicFare(distance, vehicleType, fareOptions);
        return res.json({
          success: true,
          data: { distance, duration, ...breakdown },
        });
      }

      // Sab vehicles — comparison ke liye
      const allFares = await getAllDynamicFares(distance, fareOptions);

      // App ke liye simplified list bhi bhejo
      const fareList = Object.entries(allFares).map(([type, data]) => ({
        vehicleType:  type,
        label:        data.label,
        icon:         data.icon,
        image:        data.image,
        totalFare:    data.totalFare,
        surgeActive:  data.surgeActive,
        surgeType:    data.surgeType,
        breakdown:    data.breakdown,
        driverEarnings: data.driverEarnings,
        commissionPercent:  data.commissionPercent,
        nightChargeApplied: data.nightChargeApplied,
        pricingType:  data.pricingType,
        currency:     data.currency,
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

// ─── Chat ─────────────────────────────────────────────────────────────────────
// Messages bhejne ka kaam socket karta hai; yeh sirf history ke liye hai.
router.get('/:id/messages', protect, getRideMessages);

// ─── Invoice ──────────────────────────────────────────────────────────────────
router.get('/:id/invoice', protect, getRideInvoice);

// ⚠️  Dynamic :id — SABSE LAST
router.get('/:id', protect, getRideById);

module.exports = router;
