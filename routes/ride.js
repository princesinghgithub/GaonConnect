const express = require('express');
const router  = express.Router();
const { protect }  = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { calculateDistance, calculateDuration } = require('../utils/fareCalculator');
const { getAllDynamicFares, getDynamicFare, getCurrentSurgeInfo, getDynamicServices,
        getDynamicVehicleTypes, getDynamicWeddingPackages, getDynamicWeddingFare, getRateCard } = require('../utils/dynamicFare');

const { getNearbyDrivers, etaFor, pickupKmFor } = require('../utils/driverEta');
const { saveQuote, optionKey } = require('../utils/fareQuote');
const { getCustomerDues } = require('../utils/dues');
const { measureTrip, measureLegs } = require('../utils/routing');

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
  getCancelPreview,
  adjustFare,
  uploadWorkProof,
  requestDropChange,
  respondDropChange,
} = require('../controllers/rideController');
const { createPhotoUpload } = require('../middleware/upload');

const workProofUpload = createPhotoUpload('gaonconnect/work-proof');

// Safar ka OTP driver app ko kisi jawab mein na jaaye (customer batata hai)
router.use(require('../middleware/hideOtpFromDriver'));

// ─── Customer ─────────────────────────────────────────────────────────────────
router.post('/create',          protect, validate(schemas.createRide), createRide);
router.get('/current/customer', protect, getCurrentRideCustomer);
router.get('/history/customer', protect, getRideHistoryCustomer);

// ─── Driver ───────────────────────────────────────────────────────────────────
router.get('/current/driver',   protect, getCurrentRideDriver);
router.post('/accept',          protect, acceptRide);
router.post('/reject',          protect, rejectRide);
router.put('/status',           protect, updateRideStatus);
// Kaam tay se zyada nikla — customer ki haan ke baad extra raashi.
router.put('/fare-adjustment',  protect, adjustFare);
// Customer ne drop badalne ko kaha — driver ka haan / na.
router.put('/drop-change',      protect, respondDropChange);
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
// ?for=driver — driver registration ki list: har chalu gaadi, chahe uska rate
// abhi bhara ho ya nahi (driver pehle se jud jaaye to rate bharte hi booking
// shuru). Bina iske customer ki list: sirf wo gaadi jo abhi book ho sakti hai.
router.get('/vehicle-types', async (req, res) => {
  try {
    const types = await getDynamicVehicleTypes({ forDriver: req.query.for === 'driver' });
    return res.json({ success: true, data: types });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Upkaran / attachment ki suchi (customer booking wizard) ────────────────
// Tractor: kaunse upkaran chahiye, trolley ka prakar. JCB: model, attachment.
// `serviceEquipment` — kaunse kaam ke saath kaunsa upkaran apne aap chuna
// jaaye (hal chalana → hal), taaki customer ko ek tap kam karna pade.
// Public — website bhi dikha sakti hai.
// Auzaar admin dashboard se bhi aate hain (naam, Hindi naam, photo URL) —
// code ki list unki neev hai. `icon` = app ki bundled photo ka id, `image` =
// admin ki photo (URL); app pehle image, phir icon dikhati hai.
const equipmentPayload = async (type) => {
  const EQUIPMENT_DEFAULTS = require('../config/equipmentDefaults');
  const { getEquipmentCatalog, getServiceEquipment } = require('../utils/dynamicFare');
  const conf = EQUIPMENT_DEFAULTS[type] || {};
  const equipment = await getEquipmentCatalog(type, { activeOnly: true });
  if (!equipment.length && !(conf.variants || []).length) return null;
  return {
    equipment,
    variants:         conf.variants || [],
    followUps:        conf.followUps || {},
    serviceEquipment: await getServiceEquipment(type),
  };
};

// Sab gaadiyon ke auzaar ek saath — driver app registration/"औज़ार बदलें"
// isi se banti hai (naya auzaar admin jode to app update nahi chahiye).
router.get('/equipment', async (req, res) => {
  try {
    const { getEquipmentVehicleTypes } = require('../utils/dynamicFare');
    const types = await getEquipmentVehicleTypes();
    const data = {};
    for (const t of types) {
      if (t === 'car') continue;
      const p = await equipmentPayload(t);
      if (p) data[t] = p;
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/equipment/:vehicleType', async (req, res) => {
  try {
    const type = String(req.params.vehicleType || '').toLowerCase();
    if (type === 'car') return res.json({ success: true, data: null });
    return res.json({ success: true, data: await equipmentPayload(type) });
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

// ─── Wedding package ka estimate ─────────────────────────────────────────────
// Booking se pehle customer dekh le ki package ke bahar jaane par kya lagega.
router.get('/wedding-estimate', protect, async (req, res) => {
  try {
    const { packageId, hours, distance, decoration } = req.query;
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'packageId dena zaroori hai' });
    }

    const result = await getDynamicWeddingFare(packageId, {
      hours:      Number(hours) || 0,
      distance:   Number(distance) || 0,
      decoration: decoration === 'true' || decoration === true,
    });

    if (!result.found) {
      return res.status(404).json({ success: false, message: 'Ye package nahi mila' });
    }
    return res.json({ success: true, data: result });
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
        variant, ac, stopLat, stopLng,
      } = req.query;

      // Doori sadak ke hisaab se — seedhi lakeer se nahi. Routing na chale to
      // measureTrip khud seedhi doori lauta deta hai, fare rukta nahi.
      const hasStop = stopLat !== undefined && stopLng !== undefined && stopLat !== '' && stopLng !== '';
      const trip = hasStop
        ? await measureLegs([[pickupLat, pickupLng], [stopLat, stopLng], [dropLat, dropLng]])
        : await measureTrip(pickupLat, pickupLng, dropLat, dropLng);
      const distance = trip.distance;
      // Sadak ka asli samay (OSRM, +30%); na mile to andaaza. createRide bhi
      // yahi leta hai — dikha aur laga "safar ke samay" ka charge ek jaisa.
      const duration = trip.durationMinutes || calculateDuration(distance);

      const bookingDate = new Date();
      const fareOptions = {
        bookingDate,
        pickupKm:    Number(pickupKm)    || 0,
        waitMinutes: Number(waitMinutes) || 0,
        // Waqt ka charge (agar admin ne chaalu kiya ho) isi andaaze par
        // lagta hai — wahi jo customer ko booking se pehle dikhta hai.
        durationMinutes: duration,
        extras: { loading: !!loading, unloading: !!unloading, helper: !!helper },
        // Car ki category aur AC — sirf ek vehicle ka breakdown maangne par
        // kaam aate hain. Sab vehicles wali list mein har category aati hi hai.
        variant: variant || '',
        ac:      ac === true || ac === 'true',
      };

      // Specific vehicle — detailed breakdown
      if (vehicleType) {
        const breakdown = await getDynamicFare(distance, vehicleType, fareOptions);
        const maxTripKm = await require('../utils/dynamicFare').getMaxTripKm(vehicleType);
        return res.json({
          success: true,
          data: {
            distance, duration, route: trip.points, distanceIsRoad: trip.isRoad, ...breakdown,
            traffic: trip.traffic || [], trafficDelayMin: trip.trafficDelayMin || 0, routeProvider: trip.provider,
            maxTripKm,
            tooFar: (breakdown.pricingType || 'distance') === 'distance' && distance > maxTripKm,
          },
        });
      }

      // Paas ke khaali drivers — do kaam ke liye: "kitni der mein aayega", aur
      // driver door se aa raha ho to uska long-pickup charge. Iske fail hone
      // par fare rukna nahi chahiye, isliye apna try/catch.
      let nearby = [];
      try {
        nearby = await getNearbyDrivers(Number(pickupLat), Number(pickupLng));
      } catch (etaErr) {
        console.error('fare-estimate ETA error:', etaErr.message);
      }

      // Jo doori yahan maani gayi wahi booking par lage — isliye yaad rakhte hain.
      const quoted = {};
      const kmFor = (type, variant = '', isAc = false) => {
        const km = pickupKmFor(nearby, type, { variant, ac: isAc });
        quoted[optionKey(type, variant, isAc)] = km;
        return km;
      };

      // Sab vehicles — comparison ke liye
      const allFares = await getAllDynamicFares(distance, { ...fareOptions, pickupKmFor: kmFor });

      saveQuote(req.user.id, [pickupLat, pickupLng, dropLat, dropLng], quoted);

      // Customer par pichhla baaki (cancel charge / bina bhari online ride).
      // Fare screen ise alag line mein dikhati hai aur total mein jodti hai.
      let dues = { total: 0, cancellation: 0, rides: 0 };
      try {
        const owed = await getCustomerDues(req.user.id);
        dues = { total: owed.total, cancellation: owed.cancellation, rides: owed.rides };
      } catch (duesErr) {
        console.error('fare-estimate dues error:', duesErr.message);
      }

      // Har gaadi ki lambi-trip ki had (auto 40 km...) — booking par createRide
      // isse lambi trip mana karta hai. Pehle ye sirf "Confirm" dabane par pata
      // chalta tha; ab list hi bata de ki ye gaadi is doori ke liye nahi.
      const { getMaxTripKm } = require('../utils/dynamicFare');
      const limits = Object.fromEntries(await Promise.all(Object.keys(allFares).map(async (t) => [t, await getMaxTripKm(t)])));
      const tripLimit = (type) => limits[type];

      // App ke liye simplified list bhi bhejo
      const fareList = Object.entries(allFares).map(([type, data]) => ({
        vehicleType:  type,
        maxTripKm:    tripLimit(type),
        tooFar:       (data.pricingType || 'distance') === 'distance' && distance > tripLimit(type),
        // Sabse paas wali khaali gaadi kitne minute door. null = aas-paas koi nahi.
        etaMinutes:   etaFor(nearby, type),
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
        variants:     (data.variants || []).map((v) => ({
          ...v,
          options: v.options.map((o) => ({
            ...o,
            etaMinutes: etaFor(nearby, type, { variant: v.id, ac: o.ac }),
          })),
        })),
      }));

      return res.json({
        success: true,
        data: {
          distance,
          duration,
          // Map par raasta kheenchne ke liye. Khaali ho to app seedhi lakeer banati hai.
          route: trip.points,
          distanceIsRoad: trip.isRoad,
          // Raaste par jaam wale tukde (Google) + jaam se kitni der zyada
          traffic: trip.traffic || [],
          trafficDelayMin: trip.trafficDelayMin || 0,
          routeProvider: trip.provider,
          dues,
          fares: fareList,
          surgeActive: fareList.some((f) => f.surgeActive),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── Do jagahon ke beech sadak ka raasta ─────────────────────────────────────
// Home aur tracking screen map par raasta isi se kheenchte hain.
// GET /api/ride/route?fromLat=&fromLng=&toLat=&toLng=
router.get('/route', protect, async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;
    const nums = [fromLat, fromLng, toLat, toLng].map(Number);
    if (!nums.every(Number.isFinite)) {
      return res.status(400).json({ success: false, message: 'fromLat, fromLng, toLat, toLng chahiye' });
    }
    const trip = await measureTrip(...nums);
    return res.json({
      success: true,
      data: {
        distance: trip.distance, isRoad: trip.isRoad, points: trip.points,
        durationMinutes: trip.durationMinutes, traffic: trip.traffic || [], trafficDelayMin: trip.trafficDelayMin || 0,
        provider: trip.provider,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
// Messages bhejne ka kaam socket karta hai; yeh sirf history ke liye hai.
router.get('/:id/messages', protect, getRideMessages);

// ─── Kaam se pehle / baad ki photo (driver) ──────────────────────────────────
router.post('/:id/work-proof', protect, workProofUpload.single('photo'), uploadWorkProof);

// ─── Cancel karne se pehle: kitna lagega ─────────────────────────────────────
router.get('/:id/cancel-preview', protect, getCancelPreview);

// ─── Ride ke dauraan drop badalna (customer) ─────────────────────────────────
router.post('/:id/drop-change-request', protect, requestDropChange);

// ─── Invoice ──────────────────────────────────────────────────────────────────
router.get('/:id/invoice', protect, getRideInvoice);

// ─── Trip share (Rapido/Uber jaisa) ──────────────────────────────────────────
// Customer family ko link bhejta hai; family bina login ride live dekhti hai.
// Link par sirf utna jo dekhne ke liye chahiye — driver ka phone, safar ka OTP,
// customer ka phone kabhi nahi. Ride khatam hone ke ek ghante baad link band.
const SHARE_SITE = (process.env.PUBLIC_SITE_URL || 'https://www.gaonconnect.in').replace(/\/+$/, '');
const SHARE_LIVE = ['scheduled', 'searching', 'accepted', 'arrived', 'started', 'working'];
const SHARE_GRACE_MS = 60 * 60 * 1000;

router.post('/:id/share', protect, async (req, res) => {
  try {
    const Ride = require('../models/Ride');
    const ride = await Ride.findById(req.params.id).select('customer status shareToken');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    if (String(ride.customer) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Ye ride aapki nahi hai' });
    }
    if (!ride.shareToken) {
      ride.shareToken = require('crypto').randomBytes(16).toString('hex');
      await ride.save();
    }
    return res.json({ success: true, data: { token: ride.shareToken, url: `${SHARE_SITE}/track/${ride.shareToken}` } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Share link nahi ban paya' });
  }
});

router.get('/track/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    if (!/^[a-f0-9]{32}$/.test(token)) return res.status(404).json({ success: false, message: 'Link sahi nahi hai' });
    const Ride = require('../models/Ride');
    const ride = await Ride.findOne({ shareToken: token })
      .select('status vehicleType vehicleVariantLabel ac pickup drop workAtPickup scheduledAt completedAt updatedAt cancelledAt provider vehicle')
      .populate({ path: 'provider', select: 'user rating currentLocation', populate: { path: 'user', select: 'name' } })
      .populate('vehicle', 'number model color type')
      .lean();
    if (!ride) return res.status(404).json({ success: false, message: 'Link sahi nahi hai' });
    const endedAt = ride.completedAt || ride.cancelledAt || (!SHARE_LIVE.includes(ride.status) ? ride.updatedAt : null);
    if (endedAt && Date.now() - new Date(endedAt).getTime() > SHARE_GRACE_MS) {
      return res.status(410).json({ success: false, message: 'Ye safar khatam ho chuka hai' });
    }
    const c = ride.provider?.currentLocation?.coordinates;
    return res.json({
      success: true,
      data: {
        status:      ride.status,
        vehicleType: ride.vehicleType,
        vehicleLabel: ride.vehicleVariantLabel || '',
        ac:          ride.ac,
        workAtPickup: !!ride.workAtPickup,
        scheduledAt: ride.scheduledAt,
        pickup: { address: ride.pickup?.address, latitude: ride.pickup?.coordinates?.latitude, longitude: ride.pickup?.coordinates?.longitude },
        drop:   { address: ride.drop?.address,   latitude: ride.drop?.coordinates?.latitude,   longitude: ride.drop?.coordinates?.longitude },
        driver: ride.provider ? {
          // Sirf pehla naam — poora naam/phone share link par nahi
          name:   String(ride.provider.user?.name || 'Driver').split(' ')[0],
          rating: ride.provider.rating?.count ? Number(ride.provider.rating.average).toFixed(1) : null,
          location: Array.isArray(c) && (c[0] || c[1]) ? { latitude: c[1], longitude: c[0] } : null,
        } : null,
        vehicle: ride.vehicle ? { number: ride.vehicle.number, model: ride.vehicle.model, color: ride.vehicle.color } : null,
        updatedAt: ride.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Safar ki jaankari nahi mili' });
  }
});

// ⚠️  Dynamic :id — SABSE LAST
router.get('/:id', protect, getRideById);

module.exports = router;
