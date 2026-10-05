const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Ride         = require('../models/Ride');
const Provider     = require('../models/Provider');
const Vehicle      = require('../models/Vehicle');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const Transaction  = require('../models/Transaction');
const Message      = require('../models/Message');
const {
  getDynamicFare, getDynamicHourlyFare, getDynamicWeddingFare, getSettings, getVariantOrder,
  getEquipmentCatalog, getServiceEquipment,
} = require('../utils/dynamicFare');
const { vehicleFilterForRide, vehicleFitsRide, rideTypesFor, sanitizeEquipment, sanitizeVariant } = require('../utils/vehicleMatch');
const EQUIPMENT_DEFAULTS = require('../config/equipmentDefaults');
const RETIRED_VEHICLE_TYPES = require('../config/retiredVehicleTypes');
const { measureTrip, measureLegs } = require('../utils/routing');
const Complaint = require('../models/Complaint');
const { getNearbyDrivers, pickupKmFor } = require('../utils/driverEta');
const { readQuotedPickupKm } = require('../utils/fareQuote');
const { calculateRideWaitingCharge, calculateDuration, calculateDistance, pricingTypeOf } = require('../utils/fareCalculator');
const { computeSettlement, cancellationTerms, PREBOOK_DRIVER_LATE_RELEASE_MIN } = require('../utils/settlement');
const { adjustProviderWallet } = require('../utils/walletOps');
const { getCustomerDues, settleCustomerDues, isRideCarriedAsDue } = require('../utils/dues');
const { rewardReferralIfFirstRide } = require('../utils/referral');
const { creditDriverIncentive } = require('../utils/incentive');
const { getIO }                     = require('../socket');
const { notify }                    = require('../utils/notifications');
const { applyPromoToRide, releasePromo } = require('./promoController');
const { buildInvoiceHTML, sendInvoice } = require('../utils/invoiceGenerator');
const DISPATCH_RADIUS_STAGES = require('../config/dispatchRadiusConfig');
const MAX_TRIP_DISTANCE_KM   = require('../config/maxTripDistanceConfig');

const isDev = process.env.NODE_ENV !== 'production';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ─── Helper: provider ka FCM token lo ────────────────────────────────────────
const getProviderFcm = async (providerId) => {
  const p = await Provider.findById(providerId).select('deviceInfo');
  return p?.deviceInfo?.fcmToken || null;
};

// ─── Helper: customer ka FCM token lo ────────────────────────────────────────
const getCustomerFcm = async (userId) => {
  try {
    const u = await User.findById(userId).select('fcmToken');
    return u?.fcmToken || null;
  } catch {
    return null;
  }
};

// ─── Helper: customer ke liye in-app notification persist karo ──────────────
// Push (FCM) sirf device pe jaata hai jab token ho; yeh website/app ke
// notification bell ke liye DB mein record rakhta hai.
const notifyCustomerInApp = async (customerId, { title, message, type = 'info', data = {} }) => {
  try {
    await Notification.create({
      recipient: customerId, recipientType: 'User', title, message, type, data,
    });
  } catch (err) {
    console.error('In-app notification create error:', err.message);
  }
};

// ─── PROGRESSIVE RADIUS DISPATCH ──────────────────────────────────────────────
// Uber/Ola/Rapido jaisa hi — sabse pehle sirf najdeek (3km) drivers ko poochte
// hain, na mile/accept na ho to dheere-dheere daayra badhate jaate hain (8km →
// 15km → phir bilkul unlimited). Har stage 30s ka mauka deta hai — poori tarah
// khulne mein worst-case ~90s lagte hain, uske baad jab tak koi accept na kare.
const DISPATCH_STAGE_DELAY_MS = 30 * 1000;
const DISPATCH_STAGE_COUNT    = DISPATCH_RADIUS_STAGES.auto.length; // sab vehicle types ka stage-count same hai

const getRadiusStages = (vehicleType) => DISPATCH_RADIUS_STAGES[vehicleType] || DISPATCH_RADIUS_STAGES.auto;

// Pre-booking ki waves dheere — driver ke paas ghante hain, 30s nahi. Har
// wave 3 minute baad agla daayra. Aakhri wave ke baad bhi booking driver ki
// "Upcoming" suchi mein khuli rehti hai.
const ADVANCE_STAGE_DELAY_MS = 3 * 60 * 1000;

// "कल, सुबह 7:00" jaisa — driver/customer ko samajh aane wala
const scheduleLabel = (when) => {
  const d = new Date(when);
  const opts = { timeZone: 'Asia/Kolkata' };
  const day = d.toLocaleDateString('en-IN', { ...opts, day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { ...opts, hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};

// Pre-booking kitni der pehle chalu ho (driver ko "nikalo" aur customer ko
// live tracking). Tractor/JCB door se aate hain.
const activationLeadMs = (vehicleType) =>
  (['tractor', 'jcb', 'harvester'].includes(vehicleType) ? 60 : 30) * 60 * 1000;
exports.activationLeadMs = activationLeadMs;
exports.scheduleLabel = scheduleLabel;

// Ek stage ke liye matching + abhi-tak-notify-na-hue drivers dhoondo aur unhe
// notify karo. Sirf NAYE drivers ko bhejte hain — jinko pichhle wave mein
// already bheja ja chuka hai unko dobara spam nahi karte (unke paas already
// apni 30s wali request timer chal rahi hai driver-app ki taraf).
const dispatchRideStage = async (rideId, stageIndex) => {
  const ride = await Ride.findById(rideId);
  // Pre-booking jiska driver abhi tay nahi — use bhi bhejte hain (driver
  // pehle se accept kare, customer ko pata rahe kal kaun aayega).
  const isAdvance = !!ride && ride.status === 'scheduled' && !ride.provider;
  if (!ride || !(ride.status === 'searching' || isAdvance)) return 0; // already accepted/cancelled — chain yahin ruk jaaye

  const radiusMeters = getRadiusStages(ride.vehicleType)[stageIndex];

  // Category chuni ho (car → sedan) to sirf usi category ki gaadiyan, aur AC
  // maanga ho to bina-AC wali nahi — niyam utils/vehicleMatch.js mein hain.
  // Pehla wave sirf usi category ko; usme koi na mile to agle wave se upar
  // wali category (Mini ki booking Sedan/SUV ko) — Uber/Rapido jaisa. Pehle
  // hi wave mein bhejte to Sedan wale Mini ki sasti booking le jaate aur
  // Mini wale khaali baithe rehte.
  const variantOrder = stageIndex >= 1 && ride.vehicleVariant ? await getVariantOrder(ride.vehicleType) : [];
  const matchingVehicles = await Vehicle.find({
    ...vehicleFilterForRide(ride, { variantOrder }), isVerified: true, isActive: true,
  }).select('_id');
  const matchingVehicleIds = matchingVehicles.map((v) => v._id);

  const REACHABLE_WINDOW_MS = 10 * 60 * 1000; // 10 minute
  const reachableSince = new Date(Date.now() - REACHABLE_WINDOW_MS);
  const reachabilityFilter = {
    $or: [
      { locationUpdatedAt: { $gte: reachableSince } },
      { locationUpdatedAt: { $exists: false } },
    ],
  };

  // Pre-booking: driver abhi online/khaali ho, zaroori nahi — kal ka kaam hai.
  // Tractor wale aksar app khole nahi baithte; push notification se pahunchta
  // hai. Jagah unki aakhri jaani hui location se.
  const baseQuery = isAdvance
    ? {
      isApproved:    true,
      isBlocked:     { $ne: true },
      activeVehicle: { $in: matchingVehicleIds },
      _id:           { $nin: ride.notifiedDrivers || [] },
    }
    : {
      isOnline:       true,
      isApproved:     true,
      isBlocked:      { $ne: true },
      status:         'available',
      activeVehicle:  { $in: matchingVehicleIds },
      _id:            { $nin: ride.notifiedDrivers || [] },
      ...reachabilityFilter,
    };

  const pickupLng = ride.pickup.coordinates.longitude;
  const pickupLat = ride.pickup.coordinates.latitude;

  let newDrivers = [];
  if (radiusMeters && pickupLat && pickupLng) {
    newDrivers = await Provider.find({
      ...baseQuery,
      currentLocation: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [pickupLng, pickupLat] },
          $maxDistance: radiusMeters,
        },
      },
    }).select('_id deviceInfo').limit(5).lean();
  } else {
    // Final "unlimited" stage — jitne bhi bache hain sab ko bhej do, koi cap nahi.
    newDrivers = await Provider.find(baseQuery).select('_id deviceInfo').lean();
  }

  if (newDrivers.length) {
    ride.notifiedDrivers = [...(ride.notifiedDrivers || []), ...newDrivers.map((d) => d._id)];
    await ride.save();

    const io = getIO();
    const customerUser = await User.findById(ride.customer).select('name phone rating');
    const ridePayload = {
      rideId:        ride._id,
      customerName:  customerUser?.name  || 'Customer',
      customerPhone: customerUser?.phone || '',
      // Rapido jaisa — driver ko pata ho customer kaisa hai. count 0 = naya
      customerRating:      customerUser?.rating?.count ? customerUser.rating.average : 0,
      customerRatingCount: customerUser?.rating?.count || 0,
      pickup: {
        address:   ride.pickup.address,
        latitude:  pickupLat,
        longitude: pickupLng,
      },
      drop: {
        address:   ride.drop.address,
        latitude:  ride.drop.coordinates.latitude,
        longitude: ride.drop.coordinates.longitude,
      },
      fare:           ride.fare,
      distance:       ride.distance,
      vehicleType:    ride.vehicleType,
      vehicleVariant:      ride.vehicleVariant,
      vehicleVariantLabel: ride.vehicleVariantLabel,
      ac:                  ride.ac,
      // Site par kaam — driver app drop nahi dikhati.
      workAtPickup:        Boolean(ride.workAtPickup),
      // Raaste ka stop — driver ko accept karne se pehle pata hona chahiye.
      stops:               ride.stops || [],
      paymentMethod:  ride.paymentMethod,
      bookingMode:    ride.bookingMode,
      serviceCategory: ride.serviceCategory,
      serviceType:    ride.serviceType,
      estimatedHours: ride.estimatedHours,
      hourlyRate:     ride.hourlyRate,
      workNote:       ride.workNote,
      // Kya leke aana hai — accept karne se pehle driver ko dikhna chahiye
      equipment:      ride.equipment || [],
      minHorsepower:  ride.minHorsepower || 0,
      trolleyType:    ride.trolleyType || '',
      serviceQuantity: ride.serviceQuantity || 0,
      chosenUnit:     ride.chosenUnit || '',
      // Pre-booking — driver app "kal 7 baje" dikhati hai aur accept par
      // ride screen nahi kholti, sirf pakka karti hai.
      isScheduled:    isAdvance,
      scheduledAt:    ride.scheduledAt || null,
      scheduledTime:  ride.scheduledAt ? scheduleLabel(ride.scheduledAt) : '',
      scheduledNote:  ride.scheduledNote || '',
    };

    newDrivers.forEach((driver) => {
      io.to(`driver_${driver._id}`).emit('newRideRequest', ridePayload);
      const fcm = driver.deviceInfo?.fcmToken;
      if (fcm) {
        (isAdvance
          ? notify.custom(fcm, {
            title: '📅 Nayi Pre-Booking',
            body:  `${ridePayload.customerName} — ${ridePayload.scheduledTime}. ${ride.pickup.address}. Fare: ₹${ride.fare}`,
            data:  { type: 'NEW_RIDE_REQUEST', payload: JSON.stringify(ridePayload) },
          })
          : notify.newRideRequest(fcm, ridePayload)).catch(() => {});
      }
    });
  }

  return newDrivers.length;
};

// Agla wave kab due hai — DB mein persist karte hain (setTimeout se NAHI),
// taaki server restart/redeploy (Render jaisi hosting pe deploy ke dauran
// aam baat hai) ke beech mein bhi koi ride "stuck" na reh jaaye kisi chhote
// radius pe hamesha ke liye. Ek cron job (jobs/scheduledRideJob.js) har 15s
// mein dispatchDueRides ko call karta hai jo yahan se due rides dhoond ke
// agla wave khud chala deta hai — server kabhi bhi restart ho, agli cron
// tick pe wahin se resume ho jaata hai jahan chhoda tha.
//
// findOneAndUpdate (poore document ko load-then-save karne ke bajaye) — status
// 'searching' filter ke saath atomic hai (agar ride beech mein accept ho chuki
// ho to yeh no-op ho jaata hai), aur ismein Mongoose ke partial-select
// document pe .save() karne wale risk (required-field validation fail ho
// sakti hai) se bhi bacha jaata hai.
const markNextDispatch = async (rideId, stageIndex, advance = false) => {
  const nextDispatchAt = stageIndex + 1 < DISPATCH_STAGE_COUNT
    ? new Date(Date.now() + (advance ? ADVANCE_STAGE_DELAY_MS : DISPATCH_STAGE_DELAY_MS))
    : null; // last stage ho chuka — ab aur koi wave due nahi
  await Ride.findOneAndUpdate(
    advance
      ? { _id: rideId, status: 'scheduled', provider: null }
      : { _id: rideId, status: 'searching' },
    { dispatchStageIndex: stageIndex, nextDispatchAt },
  );
};
exports.dispatchRideStage = dispatchRideStage;
exports.markNextDispatch  = markNextDispatch;

// Cron job isko call karta hai (har ~15s) — jitni bhi 'searching' rides ka
// agla wave due hai (nextDispatchAt <= abhi), unko ek-ek stage aage badhao.
//
// isDispatchingDueRides guard: agar kabhi ek run 15s se zyada le le (bahut
// saari due rides ek saath hon), to node-cron agli tick ko overlap-run kar
// sakta hai — bina is guard ke, dono runs ek hi ride ko ek saath dispatch
// karne ki koshish karte (markNextDispatch save hone se pehle), jisse driver
// ko duplicate notification chali jaati. Single-process deployment ke liye
// yeh in-memory flag kaafi hai; agar kabhi multiple server instances (PM2
// cluster / horizontal scaling) chalane lagen, isko Redis-lock jaisi cheez se
// replace karna padega.
let isDispatchingDueRides = false;
exports.dispatchDueRides = async () => {
  if (isDispatchingDueRides) return;
  isDispatchingDueRides = true;
  try {
    const due = await Ride.find({
      $or: [
        { status: 'searching' },
        // Pre-booking jiska driver abhi tay nahi
        { status: 'scheduled', provider: null },
      ],
      nextDispatchAt: { $ne: null, $lte: new Date() },
    }).select('_id dispatchStageIndex status');

    for (const ride of due) {
      const nextIndex = ride.dispatchStageIndex + 1;
      if (nextIndex >= DISPATCH_STAGE_COUNT) continue;
      try {
        await dispatchRideStage(ride._id, nextIndex);
        await markNextDispatch(ride._id, nextIndex, ride.status === 'scheduled');
      } catch (err) {
        console.error('dispatchDueRides error for ride', ride._id, ':', err.message);
      }
    }
  } finally {
    isDispatchingDueRides = false;
  }
};

// ─── CREATE RIDE ──────────────────────────────────────────────────────────────
exports.createRide = async (req, res) => {
  try {
    const {
      pickup, drop, dropoff,
      vehicleType,
      distance, estimatedDuration,
      paymentMethod  = 'cash',
      bookingType    = 'instant',
      scheduledAt    = null,
      scheduledNote  = '',
      bookingMode    = 'distance',
      serviceCategory = '',
      serviceType     = '',
      estimatedHours  = 0,
      hourlyRate      = 0,
      workNote        = '',
      promoCode       = null,
    } = req.body;

    let dropLocation = drop || dropoff;

    // Khet ya site par hone wala kaam (jutai, katai, khudai) — gaadi wahin
    // kaam karti hai jahan bulayi gayi, kahin "drop" nahi karti. App aisi
    // booking mein drop bhejti hi nahi; purani app pickup ko hi drop bana kar
    // bhejti thi. Dono soorat mein ride par nishaan lag jaata hai ki iska drop
    // nahi hai. (Fasal/saamaan dhona per-km kaam hai — uska drop hota hai.)
    const isServiceBooking = Boolean(serviceCategory && serviceType);
    const sameSpot = (a, b) => !!a && !!b
      && Math.abs(Number(a.latitude)  - Number(b.latitude))  < 0.0001
      && Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.0001;
    const workAtPickup = isServiceBooking && !!pickup && (!dropLocation || sameSpot(pickup, dropLocation));
    if (workAtPickup) dropLocation = pickup;

    if (!pickup || !dropLocation || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Pickup, drop aur vehicle type required hai' });
    }
    // Pre-booking ka samay — bina samay ya beete samay ki booking cron kabhi
    // chalu nahi karta (scheduledAt null/purana) aur wo hamesha atki rehti.
    if (bookingType === 'scheduled') {
      const at = scheduledAt ? new Date(scheduledAt).getTime() : NaN;
      if (!Number.isFinite(at) || at - Date.now() < 25 * 60 * 1000) {
        return res.status(400).json({ success: false, message: 'Pre-booking kam se kam 30 minute baad ki honi chahiye' });
      }
      if (at - Date.now() > 8 * 24 * 60 * 60 * 1000) {
        return res.status(400).json({ success: false, message: 'Pre-booking 7 din se aage ki nahi ho sakti' });
      }
    }
    // Band ki gayi seva (truck, ambulance, wedding car) — purani app se bhi
    // nayi booking na bane.
    if (RETIRED_VEHICLE_TYPES.includes(String(vehicleType).toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Yeh seva abhi uplabdh nahi hai. Doosri gaadi chunein.' });
    }
    // Admin ne dashboard se gaadi band/hata di — purani app ya khula tab ab
    // bhi wo gaadi bhej sakta hai; booking yahin rukni chahiye
    {
      const rates = (await getSettings())?.vehicleRates || {};
      const r = rates[String(vehicleType).toLowerCase()];
      if (Object.keys(rates).length && (!r || r.isActive === false)) {
        return res.status(400).json({ success: false, message: 'Yeh seva abhi band hai. Doosri gaadi chunein.' });
      }
    }

    const otp          = crypto.randomInt(1000, 9999).toString();
    let   finalDist    = typeof distance === 'object' ? distance.value : (distance || 0);

    // Per-km wali ride ki doori server khud naapta hai — sadak ke hisaab se,
    // wahi jo fare screen par dikhi thi (cache se wahi number aata hai).
    // Client ki bheji doori par kiraya banana galat tha: app se chhoti doori
    // bhej kar sasta kiraya banwaya ja sakta tha.
    //
    // Kaam wali booking (tractor/JCB) aur wedding package isme nahi aate —
    // unka kiraya ghante/acre/package se banta hai, aur wahan "doori" ka
    // matlab alag hai.
    const isDistanceRide = !req.body.packageId && !(serviceCategory && serviceType);
    if (isDistanceRide && pickup && dropLocation) {
      const pLat = pickup.latitude  ?? pickup.location?.latitude;
      const pLng = pickup.longitude ?? pickup.location?.longitude;
      const dLat = dropLocation.latitude  ?? dropLocation.location?.latitude;
      const dLng = dropLocation.longitude ?? dropLocation.location?.longitude;

      if ([pLat, pLng, dLat, dLng].every((n) => Number.isFinite(Number(n)))) {
        // Raaste mein stop ho to doori dono tukdon ki judti hai.
        const via = req.body.stop;
        const trip = via
          ? await measureLegs([[pLat, pLng], [via.latitude, via.longitude], [dLat, dLng]])
          : await measureTrip(pLat, pLng, dLat, dLng);
        if (trip.isRoad) {
          finalDist = trip.distance;
        } else {
          // Routing abhi nahi chali. Client ki doori tabhi maano jab wo
          // samajh mein aane wali ho: seedhi doori se kam nahi, aur usse
          // dhai guna se zyada nahi.
          const claimed = Number(finalDist) || 0;
          finalDist = Math.min(Math.max(claimed, trip.straight), trip.straight * 2.5 + 1);
        }
      }
    }
    const finalDur     = estimatedDuration || 30;

    // Trip (pickup→drop) distance cap — vehicle type ke hisaab se. Dispatch
    // radius (upar DISPATCH_RADIUS_STAGES) alag cheez hai — wo driver-to-pickup
    // distance control karta hai, ye actual ride ki lambai control karta hai.
    const maxTripKm = MAX_TRIP_DISTANCE_KM[vehicleType] ?? MAX_TRIP_DISTANCE_KM.auto;
    if (finalDist > maxTripKm) {
      return res.status(400).json({
        success: false,
        message: `Ye trip (${finalDist.toFixed(1)} km) ${vehicleType} ke liye allowed maximum (${maxTripKm} km) se zyada hai`,
      });
    }

    // Fare — client jo bhi bheje usse IGNORE karo, hamesha server-side calculate karo.
    // (client-supplied fare/estimatedFare trust karna price tampering allow karta tha)
    let finalFare = 0;
    let serverHourlyRate = 0;
    // Car ki kaunsi category aur mode ka daam laga — fare calculator batata hai.
    let fareVariant = { id: '', label: '', ac: false };

    // Wedding car — package ka daam. Per-km hisaab isme lagta hi nahi.
    if (req.body.packageId) {
      const weddingResult = await getDynamicWeddingFare(req.body.packageId, {
        hours:       req.body.packageHours || 0,
        distance:    finalDist,
        decoration:  Boolean(req.body.decoration),
        bookingDate: scheduledAt ? new Date(scheduledAt) : new Date(),
      });

      if (!weddingResult.found) {
        return res.status(400).json({
          success: false,
          message: 'Ye package ab uplabdh nahi hai. Doosra package chunein.',
        });
      }
      finalFare = weddingResult.fare;
      req.weddingResult = weddingResult;
    }
    if (!finalFare && serviceCategory && serviceType) {
      const hourlyResult = await getDynamicHourlyFare(
        vehicleType, serviceCategory, serviceType, estimatedHours, finalDist,
        {
          quantity:    req.body.serviceQuantity || 0,
          chosenUnit:  req.body.chosenUnit || null,
          // Gaadi ko site tak aana bhi padta hai — pickup se drop ki doori
          // hi uska andaaza hai jab tak driver assign na ho.
          arrivalKm:   0,
          bookingDate: scheduledAt ? new Date(scheduledAt) : new Date(),
        },
      );
      finalFare = hourlyResult.fare || 0;
      // Ghante ka rate admin ki setting se — app ka bheja hua nahi. Customer
      // aur driver ki ghadi "ab tak ₹…" isi se dikhati hain.
      serverHourlyRate = Number(hourlyResult.rate) || 0;

      // Rate 0 ya service band ho to fare 0 aata hai — aisi booking banne
      // dena galat hoga, customer aur driver dono ko baad mein pata chalega.
      if (!finalFare) {
        return res.status(400).json({
          success: false,
          message: 'Is service ka rate abhi set nahi hai. Thodi der baad koshish karein ya doosri service chunein.',
        });
      }
    }
    if (!finalFare) {
      // Kaam wali gaadi (tractor/JCB/wedding) bina kaam ya package chune yahan
      // pahunch gayi — per-km ka daam laga kar book kar dena galat hoga.
      const rideSettings = await getSettings();
      const pricing = pricingTypeOf(vehicleType, rideSettings?.vehicleRates?.[vehicleType], rideSettings?.hourlyRates);
      if (pricing !== 'distance') {
        return res.status(400).json({
          success: false,
          message: 'Is gaadi ki booking ke liye kaam (service) chunna zaroori hai. App mein gaadi chun kar kaam chuniye.',
        });
      }

      // Extras client se aate hain par unka daam settings se — isliye customer
      // ko wahi total dikhta hai jo yahan bhi banta hai.
      // Driver kitni door se aayega (long-pickup charge ke liye). Fare screen
      // par jo doori maani gayi thi wahi — taaki dikha hua aur laga hua daam
      // ek rahe. Wo yaad na ho to abhi ki asli doori. Pre-booking par nahi:
      // us waqt kaun sa driver kahan hoga, abhi pata hi nahi.
      let pickupKm = 0;
      if (bookingType !== 'scheduled') {
        const coords = [
          pickup.latitude  ?? pickup.location?.latitude,
          pickup.longitude ?? pickup.location?.longitude,
          dropLocation.latitude  ?? dropLocation.location?.latitude,
          dropLocation.longitude ?? dropLocation.location?.longitude,
        ];
        const wantVariant = req.body.vehicleVariant || '';
        const wantAc      = Boolean(req.body.ac);

        const remembered = await readQuotedPickupKm(req.user.id, coords, vehicleType, wantVariant, wantAc);
        if (remembered !== null) {
          pickupKm = remembered;
        } else {
          try {
            const nearby = await getNearbyDrivers(Number(coords[0]), Number(coords[1]));
            pickupKm = pickupKmFor(nearby, vehicleType, { variant: wantVariant, ac: wantAc });
          } catch {
            pickupKm = 0;
          }
        }
      }

      const fareBreakdown = await getDynamicFare(finalDist, vehicleType, {
        pickupKm,
        extras: req.body.extras || {},
        // Ride ke waqt ka charge booking ke andaaze par — ride ke baad ke
        // asli time par nahi. Customer ko jo daam dikha wahi lagega, chahe
        // raste mein jaam mile.
        durationMinutes: Number(req.body.estimatedDuration) || calculateDuration(finalDist),
        bookingDate: scheduledAt ? new Date(scheduledAt) : new Date(),
        variant: req.body.vehicleVariant || '',
        ac:      Boolean(req.body.ac),
      });
      finalFare = fareBreakdown.totalFare;
      // Rate bhara hi na ho to kiraya 0 banta hai — ₹0 ki booking banne dena
      // customer aur driver dono ke saath dhokha hai.
      if (!(finalFare > 0)) {
        return res.status(400).json({
          success: false,
          message: 'Is gaadi ka rate abhi set nahi hai. Thodi der baad koshish karein ya doosri gaadi chunein.',
        });
      }
      // Client ki bheji category nahi, calculator ne jo asal mein lagayi wahi
      // save karo — band ho chuki category bhejne par daam kisi aur ka banta
      // aur ride pe naam kisi aur ka reh jaata.
      fareVariant = {
        id:    fareBreakdown.variant || '',
        label: fareBreakdown.variantLabel || '',
        ac:    Boolean(fareBreakdown.ac),
      };
    }

    // Promo code apply karo
    let promoDiscount = 0;
    if (promoCode) {
      const promoResult = await applyPromoToRide(promoCode, req.user.id, finalFare, vehicleType, null);
      promoDiscount = promoResult.discount || 0;
      finalFare     = promoResult.finalFare;
    }

    // Customer ka pichhla baaki — promo ke BAAD judta hai (baaki par discount
    // nahi milta). Sirf tab jab app ne customer ko ye dikha diya ho
    // (`includeDues`): bina dikhaye kiraye mein kuch jodna chhupa charge hota.
    let rideDues = { amount: 0, txnIds: [], rideIds: [] };
    if (req.body.includeDues === true) {
      const owed = await getCustomerDues(req.user.id);
      if (owed.total > 0) {
        rideDues  = { amount: owed.total, txnIds: owed.txnIds, rideIds: owed.rideIds };
        finalFare += owed.total;
      }
    }

    // Admin ke niyam (Rate Card): is kaam ke liye kaunsa auzaar zaroori, aur
    // admin ke jode naye auzaar bhi maanya. Ride par likh dete hain — dispatch
    // inhi se chalta hai.
    let allowedEquipmentIds;
    let serviceEquipment = [];
    if (isServiceBooking) {
      allowedEquipmentIds = (await getEquipmentCatalog(vehicleType, { activeOnly: true })).map((e) => e.id);
      serviceEquipment = (await getServiceEquipment(vehicleType))[serviceType] || [];
    }

    const ride = await Ride.create({
      customer: req.user.id,
      pickup: {
        address:     pickup.address || pickup.addressLine2,
        coordinates: {
          latitude:  pickup.latitude  || pickup.location?.latitude,
          longitude: pickup.longitude || pickup.location?.longitude,
        },
      },
      drop: {
        address:     dropLocation.address || dropLocation.addressLine2,
        coordinates: {
          latitude:  dropLocation.latitude  || dropLocation.location?.latitude,
          longitude: dropLocation.longitude || dropLocation.location?.longitude,
        },
      },
      vehicleType,
      vehicleVariant:      fareVariant.id,
      vehicleVariantLabel: fareVariant.label,
      ac:                  fareVariant.ac,
      // Promo ride par likha rehta hai — ride poori hone par driver ki kamai
      // isi se poori ki jaati hai.
      promoCode:           promoDiscount > 0 ? String(promoCode || '') : '',
      promoDiscount,
      dues:                rideDues,
      workAtPickup,
      stops: (isDistanceRide && req.body.stop) ? [{
        address:   req.body.stop.address,
        latitude:  req.body.stop.latitude,
        longitude: req.body.stop.longitude,
      }] : [],
      distance:          finalDist,
      estimatedDuration: finalDur,
      fare:              finalFare,
      paymentMethod,
      otp,
      status:        bookingType === 'scheduled' ? 'scheduled' : 'searching',
      // Instant ride turant 'searching' mein jaati hai — cutoff yahin se shuru.
      // Scheduled ride ke liye yeh cron job set karega jab activate hogi.
      searchingSince: bookingType === 'scheduled' ? null : new Date(),
      bookingType,
      scheduledAt:   scheduledAt ? new Date(scheduledAt) : null,
      scheduledNote: scheduledNote || '',
      // Package chuna hai to mode server hi tay karta hai — client se aaya
      // hua mode aur asli hisaab alag nahi hone chahiye.
      bookingMode: req.body.packageId ? 'package' : bookingMode,
      serviceCategory,
      serviceType,
      estimatedHours,
      serviceQuantity: req.body.serviceQuantity || 0,
      chosenUnit:      req.body.chosenUnit || '',
      packageId:   req.body.packageId || '',
      packageName: req.weddingResult?.packageName || '',
      decoration:  Boolean(req.body.decoration),
      extras: {
        loading:   Boolean(req.body.extras?.loading),
        unloading: Boolean(req.body.extras?.unloading),
        helper:    Boolean(req.body.extras?.helper),
      },
      hourlyRate: serverHourlyRate || 0,
      workNote,
      // Tractor/JCB — customer ki maang. Anjaan auzaar id hata dete hain,
      // warna aisi booking kisi bhi driver se kabhi match nahi hoti.
      ...(isServiceBooking ? (() => {
        const eq = sanitizeEquipment(vehicleType, req.body.equipment, allowedEquipmentIds) || [];
        const hp = Math.round(Number(req.body.minHorsepower) || 0);
        const jcbType = vehicleType === 'jcb' ? sanitizeVariant('jcb', req.body.vehicleVariant) : '';
        const jcbLabel = jcbType ? (EQUIPMENT_DEFAULTS.jcb.variants.find((v) => v.id === jcbType)?.label || '') : '';
        return {
          ...(eq.length ? { equipment: eq } : {}),
          ...(serviceEquipment.length ? { serviceEquipment } : {}),
          minHorsepower: vehicleType === 'tractor' && hp >= 10 && hp <= 150 ? hp : 0,
          trolleyType: String(req.body.trolleyType || '').slice(0, 40),
          ...(jcbType ? { vehicleVariant: jcbType, vehicleVariantLabel: jcbLabel } : {}),
        };
      })() : {}),
    });

    // Pre-booking — abhi se paas ke drivers ko bhejo, taaki koi pehle se
    // pakka ho jaaye aur customer ko pata rahe ki kal kaun aayega (Rapido
    // jaisa). Pehle yahan bas save hota tha aur driver samay se 15 minute
    // pehle dhoondha jaata — na mile to booking wahin cancel.
    if (bookingType === 'scheduled') {
      let providerCount = 0;
      try {
        providerCount = await dispatchRideStage(ride._id, 0);
        await markNextDispatch(ride._id, 0, true);
      } catch (e) {
        console.error('Pre-booking dispatch error:', e.message);
      }
      return res.status(201).json({
        success: true,
        message: 'Pre-booking ho gayi! Driver pakka hote hi aapko bataya jaayega.',
        data: { ride, providerCount },
      });
    }

    // Instant ride — pehla (najdeek 3km) wave turant, baaki waves progressively
    // cron ke through chalenge (dekho dispatchDueRides + jobs/scheduledRideJob.js) —
    // in-memory timer nahi, isliye server restart hone par bhi wave-chain zinda rehti hai.
    const firstWaveCount = await dispatchRideStage(ride._id, 0);
    await markNextDispatch(ride._id, 0);

    return res.status(201).json({
      success: true,
      message: firstWaveCount
        ? `${firstWaveCount} najdeek drivers ko request bheji`
        : 'Najdeek koi driver nahi mila, daayra badhaya ja raha hai',
      data: {
        ride,
        providerCount: firstWaveCount,
        ...(promoDiscount > 0 && { promoDiscount, message: `🎉 ₹${promoDiscount} ki discount mili!` }),
      },
    });
  } catch (error) {
    console.error('Create Ride Error:', error);
    return res.status(500).json({ success: false, message: 'Ride create karne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── GET RIDE BY ID ───────────────────────────────────────────────────────────
exports.getRideById = async (req, res) => {
  try {
    // Vehicle bhi populate karo — rider ko gaadi ka number chahiye hota hai
    // yeh pehchanne ke liye ki kaunsi gaadi uski hai, aur baithne se pehle
    // plate milaane ke liye. Uber/Rapido dono yeh hamesha dikhate hain.
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name phone profilePhoto')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone profilePhoto' } })
      .populate('vehicle', 'number model color type');

    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

    // Sirf ride ke log — customer, uska driver, admin. Pehle koi bhi login
    // wala ride id se customer ka phone, ghar ka pata aur safar ka OTP dekh
    // sakta tha; website par ye id URL mein hoti hai (/ride/:id) aur share ho
    // jaati hai.
    const uid = String(req.user?._id || req.user?.id || '');
    const isCustomer = String(ride.customer?._id || ride.customer || '') === uid;
    const isDriver   = !!ride.provider?.user && String(ride.provider.user._id || ride.provider.user) === uid;
    const isAdmin    = req.user?.role === 'admin';
    if (!isCustomer && !isDriver && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Ye ride aapki nahi hai' });
    }

    return res.status(200).json({ success: true, data: ride });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ride fetch karne mein error' });
  }
};

// ─── CURRENT RIDE — CUSTOMER ──────────────────────────────────────────────────
exports.getCurrentRideCustomer = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      customer: req.user.id,
      // 'working' bhi — tractor/JCB ka kaam chal raha ho tab customer ki app
      // ko ride milni chahiye. Pehle ye nahi tha, to kaam shuru hote hi
      // customer ke liye ride "gayab" ho jaati thi.
      status:   { $in: ['searching', 'accepted', 'arrived', 'started', 'working'] },
    })
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone profilePhoto' } })
      .populate('vehicle', 'number model color type')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: ride, message: ride ? 'Active ride found' : 'No active ride' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching current ride' });
  }
};

// ─── CURRENT RIDE — DRIVER ────────────────────────────────────────────────────
exports.getCurrentRideDriver = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).populate('activeVehicle');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    let ride = await Ride.findOne({
      provider: provider._id,
      status:   { $in: ['accepted', 'arrived', 'started', 'working'] },
    })
      .populate('customer', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    if (!ride && provider.isOnline && provider.activeVehicle) {
      // Thresher wala tractor thresher ki booking bhi le sakta hai, wedding
      // wali car shaadi ki — sirf apne type ki nahi (utils/vehicleMatch.js).
      // Aur auzaar/category na mile to wo booking yahan bhi na dikhe.
      const candidates = await Ride.find({
        status:      'searching',
        provider:    null,
        vehicleType: { $in: rideTypesFor(provider.activeVehicle) },
      })
        .populate('customer', 'name phone profilePhoto')
        .sort({ createdAt: 1 })
        .limit(20);
      ride = candidates.find((r) => vehicleFitsRide(provider.activeVehicle, r)) || null;
    }

    return res.status(200).json({ success: true, data: ride, message: ride ? 'Ride available' : 'No active ride' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching current ride' });
  }
};

// ─── ACCEPT RIDE ──────────────────────────────────────────────────────────────
exports.acceptRide = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).populate('user', 'name').populate('activeVehicle');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });
    if (!provider.isApproved) return res.status(403).json({ success: false, message: 'Aapka account abhi admin se approve nahi hua' });
    if (provider.isBlocked) return res.status(403).json({ success: false, message: 'Aapka account block hai' });

    const { rideId } = req.body;

    // Driver ko request tab notify hui thi jab uski activeVehicle X thi. Agar
    // accept dabane se pehle usne "Switch Vehicle" se Y pe badal li (online
    // rehte hue vehicle switch karne ka feature), to yeh ride ab uske current
    // vehicle type se match nahi karti — customer ne X maanga tha, Y nahi.
    // provider.activeVehicle null hone wala edge case yahan check nahi karte
    // (data-integrity issue, alag hi baat hai) — sirf tab reject karo jab
    // activeVehicle genuinely set hai par uska type ride se mismatch karta hai.
    const requestedRide = await Ride.findById(rideId).select('vehicleType vehicleVariant vehicleVariantLabel ac serviceType equipment minHorsepower status pickup provider scheduledAt estimatedHours customer notifiedDrivers');
    // Pre-booking jiska driver abhi tay nahi
    const isAdvance = requestedRide?.status === 'scheduled' && !requestedRide.provider;
    const openForAccept = requestedRide && (requestedRide.status === 'searching' || isAdvance);
    // Upar wali category (Sedan wala Mini ki booking) — jab booking use bheji
    // gayi ho (dispatch ka agla wave), ya khuli pre-booking ho
    const wasSentToMe = (requestedRide?.notifiedDrivers || []).some((id) => String(id) === String(provider._id));
    const variantOrder = requestedRide?.vehicleVariant && (wasSentToMe || isAdvance)
      ? await getVariantOrder(requestedRide.vehicleType) : [];
    if (openForAccept && provider.activeVehicle
        && !rideTypesFor(provider.activeVehicle).includes(requestedRide.vehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Aapne vehicle switch kar li hai — yeh request aapke pichhle vehicle type ke liye thi, ab valid nahi hai',
      });
    }

    // Type wahi hai par category ya AC nahi milta — jaise customer ne SUV
    // maangi aur driver ki active gaadi Mini hai. Dispatch aisi request bhejta
    // hi nahi; yeh us haal ke liye hai jab request aane ke baad gaadi badli ho.
    if (openForAccept && provider.activeVehicle
        && !vehicleFitsRide(provider.activeVehicle, requestedRide, { variantOrder })) {
      return res.status(400).json({
        success: false,
        message: `Yeh request ${requestedRide.vehicleVariantLabel || requestedRide.vehicleVariant || 'doosri category'}${requestedRide.ac ? ' (AC)' : ''} ke liye hai — aapki active gaadi isse match nahi karti`,
      });
    }

    // ─── Pre-booking pakki karna ──────────────────────────────────────────
    // Driver abhi pakka ho jaata hai par ride abhi chalu nahi hoti — status
    // 'scheduled' hi rehta hai, driver 'busy' nahi hota (aaj ka kaam karta
    // rahe). Samay se pehle cron ise chalu karta hai (jobs/scheduledRideJob.js).
    if (isAdvance) {
      // Ek hi samay par do pre-bookings nahi — kaam ke ghante + 1 ghanta ka faasla
      const at = new Date(requestedRide.scheduledAt).getTime();
      const spanMs = (Math.max(1, Number(requestedRide.estimatedHours) || 1) + 1) * 3_600_000;
      const clash = await Ride.findOne({
        provider: provider._id,
        status: { $in: ['scheduled', 'accepted', 'arrived', 'started', 'working'] },
        scheduledAt: { $gte: new Date(at - spanMs), $lte: new Date(at + spanMs) },
      }).select('_id');
      if (clash) {
        return res.status(400).json({ success: false, message: 'Is samay aapki pehle se ek booking hai' });
      }

      const booked = await Ride.findOneAndUpdate(
        { _id: rideId, status: 'scheduled', provider: null },
        { provider: provider._id, vehicle: provider.activeVehicle?._id || null, scheduledAcceptedAt: new Date(), nextDispatchAt: null },
        { new: true },
      );
      if (!booked) return res.status(404).json({ success: false, message: 'Yeh pre-booking kisi aur ne le li' });

      const io = getIO();
      (booked.notifiedDrivers || []).forEach((driverId) => {
        if (String(driverId) === String(provider._id)) return;
        io.to(`driver_${driverId}`).emit('rideNoLongerAvailable', { rideId: booked._id.toString() });
      });

      // Customer ko — kaun aayega, kab
      const when = scheduleLabel(booked.scheduledAt);
      const vehicleNo = provider.activeVehicle?.number || '';
      io.to(`user_${booked.customer}`).emit('scheduledDriverAssigned', { rideId: booked._id, driverName: provider.user?.name || 'Driver' });
      const customerFcm = await getCustomerFcm(booked.customer);
      if (customerFcm) {
        notify.custom(customerFcm, {
          title: '✅ Pre-Booking Pakki!',
          body:  `${provider.user?.name || 'Driver'} (${vehicleNo}) ${when} ko aayenge. App mein call kar sakte hain.`,
          data:  { type: 'SCHEDULED_DRIVER_ASSIGNED', rideId: booked._id.toString() },
        }).catch(() => {});
      }
      notifyCustomerInApp(booked.customer, {
        title:   '✅ Pre-Booking Pakki!',
        message: `${provider.user?.name || 'Driver'} (${vehicleNo}) ${when} ko aayenge.`,
        type:    'success',
        data:    { rideId: booked._id.toString(), event: 'SCHEDULED_DRIVER_ASSIGNED' },
      }).catch(() => {});

      return res.json({ success: true, message: 'Pre-booking pakki', data: { ride: booked, scheduled: true, when } });
    }

    // Atomic check-and-set — jab ek saath kai drivers (jaise scheduled
    // tractor/JCB request) accept karne ki koshish karein, sirf pehla
    // hi jeete; baki ko turant "Ride not available" mile.
    // Driver abhi pickup se kitna door hai aur kitni der mein pahunchega —
    // baad mein isi se pata chalta hai ki wo der kar raha hai ya nahi.
    let pickupKmAtAccept = 0;
    let pickupEtaMinutes = 0;
    const [drvLng, drvLat] = provider.currentLocation?.coordinates || [];
    const pkLat = requestedRide?.pickup?.coordinates?.latitude;
    const pkLng = requestedRide?.pickup?.coordinates?.longitude;
    if ([drvLat, drvLng, pkLat, pkLng].every((n) => Number.isFinite(Number(n)))) {
      // Sadak seedhi nahi hoti — 1.3 guna; gaon ki sadak par 25 km/h.
      pickupKmAtAccept = Math.round(calculateDistance(drvLat, drvLng, pkLat, pkLng) * 1.3 * 10) / 10;
      pickupEtaMinutes = Math.max(1, Math.ceil((pickupKmAtAccept / 25) * 60));
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'searching' },
      {
        provider: provider._id, vehicle: provider.activeVehicle?._id || null,
        status: 'accepted', acceptedAt: new Date(),
        pickupKmAtAccept, pickupEtaMinutes,
      },
      { new: true },
    );
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not available' });

    provider.status = 'busy';
    await provider.save();

    // Socket notify
    const io = getIO();

    // Baaki jitne bhi drivers ko yeh request bheji gayi thi, unko turant
    // batao ki ride ja chuki hai — unki screen se request hat jaani chahiye
    // (chahe wo abhi socket se connected ho ya sirf FCM se pending pada ho).
    if (ride.notifiedDrivers?.length) {
      ride.notifiedDrivers.forEach((driverId) => {
        if (String(driverId) === String(provider._id)) return;
        io.to(`driver_${driverId}`).emit('rideNoLongerAvailable', {
          rideId: ride._id.toString(),
        });
      });
    }

    io.to(`user_${ride.customer}`).emit('rideAccepted', {
      rideId:   ride._id,
      driverId: provider._id,
      otp:      ride.otp,
    });

    // Push notification — customer ko
    const customerFcm = await getCustomerFcm(ride.customer);
    if (customerFcm) {
      notify.rideAccepted(customerFcm, {
        driverName:  provider.user?.name || 'Driver',
        vehicleType: provider.activeVehicle?.type,
        otp:         ride.otp,
      }).catch(() => {});
    }

    notifyCustomerInApp(ride.customer, {
      title:   '🚗 Driver Mil Gaya!',
      message: `${provider.user?.name || 'Driver'} aapki ride accept kar liya. OTP: ${ride.otp}`,
      type:    'success',
      data:    { rideId: ride._id.toString(), event: 'RIDE_ACCEPTED' },
    }).catch(() => {});

    return res.status(200).json({ success: true, message: 'Ride accepted', data: ride });
  } catch (err) {
    console.error('Accept Ride Error:', err);
    return res.status(500).json({ success: false, message: 'Ride accept karne mein error' });
  }
};

// ─── REJECT RIDE ──────────────────────────────────────────────────────────────
exports.rejectRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const ride = await Ride.findById(rideId);
    // Khuli pre-booking ko bhi "mana" kiya ja sakta hai — pehle yahan 400 aata
    // tha aur driver ko galat error dikhta.
    const open = ride && (ride.status === 'searching' || (ride.status === 'scheduled' && !ride.provider));
    if (!open) {
      return res.status(400).json({ success: false, message: 'Ride not available' });
    }

    provider.rejectionReasons.push({ rideId: ride._id, reason: reason || 'Driver rejected' });
    await provider.save();

    return res.json({ success: true, message: 'Ride rejected' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ride reject karne mein error' });
  }
};

// ─── UPDATE RIDE STATUS ───────────────────────────────────────────────────────
exports.updateRideStatus = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).populate('user', 'name');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const { rideId, status } = req.body;
    const ride = await Ride.findById(rideId).populate('customer', 'name phone');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: `Ride already ${ride.status}` });
    }

    // ─── Pakki pre-booking chhodna (driver) ─────────────────────────────────
    // Driver ne kal ki booking li thi par ab nahi aa sakta. Booking cancel nahi
    // hoti — wapas khul jaati hai, naya driver dhoondha jaata hai, aur
    // customer ko bataya jaata hai. Is driver ko dobara nahi bhejte.
    if (ride.status === 'scheduled' && status === 'cancelled') {
      const reopened = await Ride.findOneAndUpdate(
        { _id: ride._id, status: 'scheduled', provider: provider._id },
        {
          $set: { provider: null, vehicle: null, scheduledAcceptedAt: null },
          $addToSet: { notifiedDrivers: provider._id },
        },
        { new: true },
      );
      if (!reopened) return res.status(409).json({ success: false, message: 'Booking pehle hi badal chuki hai' });

      // Samay se 2 ghante ke andar chhoda — customer ke paas naya driver
      // dhoondhne ka waqt kam hai. Driver ke record mein gina jaata hai
      // (Uber Reserve jaisa). Pehle chhode to koi asar nahi.
      const minsLeft = (new Date(reopened.scheduledAt).getTime() - Date.now()) / 60000;
      if (minsLeft < PREBOOK_DRIVER_LATE_RELEASE_MIN) {
        await Provider.updateOne({ _id: provider._id }, { $inc: { 'stats.cancelledTrips': 1 } });
      }

      dispatchRideStage(reopened._id, 0)
        .then(() => markNextDispatch(reopened._id, 0, true))
        .catch(() => {});

      const msg = `${provider.user?.name || 'Driver'} ${scheduleLabel(reopened.scheduledAt)} ko nahi aa paayenge — hum naya driver dhoond rahe hain.`;
      getIO().to(`user_${ride.customer?._id || ride.customer}`).emit('scheduledDriverReleased', { rideId: ride._id });
      const fcm = await getCustomerFcm(ride.customer?._id || ride.customer);
      if (fcm) notify.custom(fcm, { title: 'Driver badla ja raha hai', body: msg, data: { type: 'SCHEDULED_DRIVER_RELEASED', rideId: String(ride._id) } }).catch(() => {});
      notifyCustomerInApp(ride.customer?._id || ride.customer, {
        title: 'Driver badla ja raha hai', message: msg, type: 'warning',
        data: { rideId: String(ride._id), event: 'SCHEDULED_DRIVER_RELEASED' },
      }).catch(() => {});

      return res.json({ success: true, message: 'Pre-booking chhod di — naya driver dhoonda ja raha hai' });
    }

    // ─── Kaam rokna / phir chalu karna (ghante wala kaam) ───────────────────
    // Pehle driver app 'paused' bhejti thi par yahan uski ijaazat hi nahi thi
    // — 400 aata, app chup rehti. Nateeja: ruka hua waqt sirf driver ke phone
    // mein yaad rehta, customer ko ghadi dikh hi nahi sakti thi, aur app band
    // hokar khulne par break bhi chala hua gin jaata.
    //
    // Status 'working' hi rehta hai (chalu ride ki saari queries usi ko
    // dekhti hain) — sirf pausedAt / pausedSeconds badalte hain.
    if (status === 'paused' || (status === 'working' && ride.status === 'working')) {
      if (ride.status !== 'working') {
        return res.status(400).json({ success: false, message: `${ride.status} → ${status} allowed nahi` });
      }
      const now = new Date();
      let update = null;
      if (status === 'paused' && !ride.pausedAt) {
        update = { $set: { pausedAt: now } };
      } else if (status === 'working' && ride.pausedAt) {
        const sec = Math.max(0, Math.round((now - new Date(ride.pausedAt)) / 1000));
        update = { $set: { pausedAt: null }, $inc: { pausedSeconds: sec } };
      }
      const updated = update
        ? await Ride.findOneAndUpdate({ _id: ride._id, status: 'working' }, update, { new: true })
        : ride;
      getIO().to(`user_${ride.customer?._id || ride.customer}`).emit('rideStatusUpdate', {
        rideId: ride._id, status: 'working', paused: !!updated?.pausedAt,
      });
      return res.json({
        success: true,
        data: {
          status: 'working',
          workStartedAt: updated?.workStartedAt,
          pausedAt: updated?.pausedAt || null,
          pausedSeconds: updated?.pausedSeconds || 0,
        },
      });
    }

    const allowedTransitions = {
      searching: ['accepted', 'cancelled'],
      accepted:  ['arrived', 'cancelled'],
      arrived:   ['started', 'cancelled'],
      started:   ['completed', 'working'],
      working:   ['completed'],
    };

    if (!allowedTransitions[ride.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `${ride.status} → ${status} allowed nahi` });
    }

    // Driver app cancel isi raaste (PUT /ride/status) se bhejti hai. Pehle
    // yahan ride bas 'cancelled' ho jaati thi: customer ke liye naya driver
    // nahi dhoondha jaata tha, customer na aaya ho tab bhi driver ko kuch nahi
    // milta tha, aur cancel ke niyam lagte hi nahi the. Ab wahi ek raasta
    // chalta hai jo POST /ride/cancel ka hai.
    if (status === 'cancelled') {
      req.body.reason = [req.body.cancelReason, req.body.cancelNote].filter(Boolean).join(' — ')
        || req.body.reason;
      return exports.cancelRide(req, res);
    }

    // Atomic transition — filter includes the status we just read, so agar
    // koi doosri (parallel/retry) request pehle hi flip kar chuki ho to
    // yahan match nahi hoga aur hum double-processing (jaise double wallet
    // credit) se bach jaate hain.
    const updateFields = { status };
    if (status === 'arrived') updateFields.arrivedAt    = new Date();
    if (status === 'started') updateFields.startedAt    = new Date();

    // ─── Waiting charge ──────────────────────────────────────────────────────
    // calculateWaitingCharge() pehle se likha tha par waitMinutes kabhi
    // calculate hi nahi hota tha — hamesha 0 jaata tha, isliye driver ko wait
    // ka ek rupaya nahi milta tha. arrivedAt se start tak ka time yahan naapa
    // jaata hai. Charge abhi sirf store hota hai; fare mein completion pe joda
    // jaata hai, taaki hourly recalculation use mita na de.
    if (status === 'started' && ride.arrivedAt) {
      const waitedMs  = updateFields.startedAt - new Date(ride.arrivedAt);
      const waitMins  = Math.max(0, Math.floor(waitedMs / 60000));
      const settings  = await getSettings();
      // Us gaadi ke rate card se — wahi jo customer ko fare screen par dikha tha.
      const charge    = calculateRideWaitingCharge(
        waitMins, settings?.vehicleRates?.[ride.vehicleType], settings?.waiting,
      );

      updateFields.waitMinutes   = waitMins;
      updateFields.waitingCharge = charge;
    }

    if (status === 'working') {
      updateFields.workStartedAt = new Date();
      updateFields.pausedAt      = null;
      updateFields.pausedSeconds = 0;
    }
    if (status === 'completed') {
      updateFields.completedAt = new Date();
      let hourlyOwnsWaiting = false;
      if (ride.workStartedAt) {
        updateFields.workEndedAt = updateFields.completedAt;
        // Ruka hua waqt — server ne khud gina (pause/resume yahin aate hain).
        // Abhi ruka hua ho to woh daur bhi jodo.
        let pausedSec = Number(ride.pausedSeconds) || 0;
        if (ride.pausedAt) {
          pausedSec += Math.max(0, Math.round((updateFields.completedAt - new Date(ride.pausedAt)) / 1000));
          updateFields.pausedAt = null;
          updateFields.pausedSeconds = pausedSec;
        }
        // Driver app kaam ke beech "pause" (khaana, diesel) ka waqt ghata kar
        // asal mein chale hue second bhejti hai. Pehle yahan sirf ghadi ka
        // farak liya jaata tha — yaani driver ke ruke hue ghante ka paisa bhi
        // customer se lagta tha. Ab chala hua waqt lagta hai; par ghadi ke
        // farak (ruka hua waqt ghata kar) se zyada kabhi nahi, taaki app se
        // badha kar na bheja ja sake.
        const wallHours = Math.max(0, (updateFields.completedAt - ride.workStartedAt) / 1000 - pausedSec) / 3600;
        const workedSec = Number(req.body.workedSeconds);
        const hours     = Number.isFinite(workedSec) && workedSec > 0
          ? Math.min(workedSec / 3600, wallHours)
          : wallHours;
        updateFields.actualHours = parseFloat(hours.toFixed(2));

        // Hourly (tractor/JCB) booking — bill actual worked time, not the
        // original estimate. calculateHourlyFare applies the service's
        // minimumHours floor, so kaam jaldi khatam ho jaaye to bhi minimum
        // charge lagta hai, lekin estimate se kam kaam hua to poora estimate
        // charge nahi hota — sirf actual (ya minimum, jo bhi zyada ho).
        if (ride.bookingMode === 'hourly' && ride.serviceCategory && ride.serviceType) {
          const recalculated = await getDynamicHourlyFare(
            ride.vehicleType, ride.serviceCategory, ride.serviceType,
            updateFields.actualHours, ride.distance,
            {
              quantity:    ride.serviceQuantity || 0,
              chosenUnit:  ride.chosenUnit || null,
              waitMinutes: ride.waitMinutes || 0,
              bookingDate: ride.acceptedAt || ride.createdAt || new Date(),
            },
          );
          if (recalculated.fare) {
            // Naya kiraya asli ghanton se bana hai — par booking ke waqt ka
            // promo aur juda hua pichhla baaki usme nahi hota. Pehle yahan
            // seedha `recalculated.fare` rakh diya jaata tha: customer ka
            // promo chup-chaap gayab ho jaata tha.
            updateFields.fare = Math.max(0, recalculated.fare - (Number(ride.promoDiscount) || 0))
              + (Number(ride.dues?.amount) || 0)
              // Mauke par customer ki haan se judi extra raashi (fare-adjustment).
              + (Number(ride.fareAdjustment) || 0);
            // Hourly ka hisaab apna waiting khud jodta hai (category ki apni
            // per-ghanta setting se). Neeche wala global waiting charge iske
            // upar dobara nahi lagna chahiye, warna ek hi intezaar ka paisa
            // do baar kat jaata.
            hourlyOwnsWaiting = true;
          }
        }
      }

      // Waiting charge ab fare mein jodo — hourly recalculation ke BAAD, warna
      // recalculated fare use overwrite kar deta. ride.fare completion tak base
      // fare hi rehta hai, isliye yeh ek hi baar judta hai; aur status
      // transition atomic hai to retry pe dobara nahi judega.
      const waitCharge = ride.waitingCharge || 0;
      if (waitCharge > 0 && !hourlyOwnsWaiting) {
        updateFields.fare = (updateFields.fare ?? ride.fare) + waitCharge;
      }
    }

    const previousStatus = ride.status;
    const updatedRide = await Ride.findOneAndUpdate(
      { _id: ride._id, status: previousStatus },
      { $set: updateFields },
      { new: true },
    ).populate('customer', 'name phone');

    if (!updatedRide) {
      return res.status(409).json({ success: false, message: 'Ride status already updated by another request' });
    }
    ride.status       = updatedRide.status;
    ride.arrivedAt     = updatedRide.arrivedAt;
    ride.startedAt     = updatedRide.startedAt;
    ride.workStartedAt = updatedRide.workStartedAt;
    ride.completedAt   = updatedRide.completedAt;
    ride.workEndedAt   = updatedRide.workEndedAt;
    ride.actualHours   = updatedRide.actualHours;
    ride.fare          = updatedRide.fare;
    ride.waitMinutes   = updatedRide.waitMinutes;
    ride.waitingCharge = updatedRide.waitingCharge;

    // Socket
    const io = getIO();
    io.to(`user_${ride.customer}`).emit('rideStatusUpdate', { rideId: ride._id, status });

    // ─── Per-status notifications ─────────────────────────────────────────────
    const customerFcm  = await getCustomerFcm(ride.customer?._id);
    const driverName   = provider.user?.name || 'Driver';
    const customerName = ride.customer?.name || 'Customer';

    if (status === 'arrived') {
      if (customerFcm) notify.driverArrived(customerFcm, { driverName }).catch(() => {});
      notifyCustomerInApp(ride.customer?._id, {
        title: '📍 Driver Pahunch Gaya!', message: `${driverName} aapke pickup location pe aa gaya hai.`,
        type: 'info', data: { rideId: ride._id.toString(), event: 'DRIVER_ARRIVED' },
      });
    }

    if (status === 'started') {
      if (customerFcm) notify.rideStarted(customerFcm, { driverName, destination: ride.drop.address }).catch(() => {});
      notifyCustomerInApp(ride.customer?._id, {
        title: '🚀 Ride Shuru Ho Gayi!', message: `Aap ${ride.drop.address} ja rahe hain. Safe journey!`,
        type: 'info', data: { rideId: ride._id.toString(), event: 'RIDE_STARTED' },
      });
    }

    if (status === 'completed') {
      // Customer ko — ride complete
      if (customerFcm) {
        notify.rideCompleted(customerFcm, { fare: ride.fare, destination: ride.drop.address }).catch(() => {});
      }
      notifyCustomerInApp(ride.customer?._id, {
        title: '✅ Ride Complete!', message: `${ride.drop.address} pahunch gaye. Fare: ₹${ride.fare}. Rating dijiye!`,
        type: 'success', data: { rideId: ride._id.toString(), event: 'RIDE_COMPLETED' },
      });

      // Referral reward — agar yeh customer ki pehli poori hui ride hai to
      // usse aur usse laane wale, dono ko bonus. Await nahi kar rahe: reward
      // fail ho jaaye to bhi ride complete honi chahiye.
      rewardReferralIfFirstRide(ride.customer?._id).catch(() => {});

      // Is ride ke saath customer ka pichhla baaki bhi wasool hua — use bhara
      // hua likho, aur jis driver ka nuksan hua tha use uska hissa do.
      settleCustomerDues(ride).catch((err) => console.error('settleCustomerDues error:', err.message));

      // Daily incentive — aaj ka target pura hua to bonus. Yeh bhi ride
      // completion ko block nahi karta.
      creditDriverIncentive(provider._id).catch(() => {});

      // Driver earnings update
      // Commission ki value pehle yahan `ride.fare * 0` likhi thi — yaani
      // admin dashboard mein commission kuch bhi set kare, katta hamesha 0 hi
      // tha. Ab settings se aata hai: gaadi ke rate card mein alag commission
      // ho to wo, warna platform ka global. Launch pe dono 0 hain, isliye
      // driver ko poora kiraya milta hai — par ab ye chalu bhi ho sakta hai.
      const completionSettings = await getSettings();
      const vehicleRate   = completionSettings?.vehicleRates?.[ride.vehicleType] || {};
      const perVehiclePct = vehicleRate.commissionPercent;
      const commissionPct = (perVehiclePct !== null && perVehiclePct !== undefined && perVehiclePct !== '')
        ? Number(perVehiclePct)
        : Number(completionSettings?.commission?.percentage ?? 0);

      // Paisa kahan gaya? Online ride ka (aur QR se pehle hi bhari ja chuki
      // ride ka) paisa platform ke paas hai; cash ka driver ke haath mein.
      // Wallet mein sirf wahi judta hai jo platform par driver ka sach mein
      // baaki hai — poora hisaab utils/settlement.js mein.
      const collectedByPlatform = ride.paymentMethod === 'online' || ride.paymentStatus === 'paid';
      const { commission, driverEarning, walletDelta } = computeSettlement({
        fare:          ride.fare,
        promoDiscount: ride.promoDiscount,
        commissionPct: Number.isFinite(commissionPct) ? commissionPct : 0,
        collectedByPlatform,
        dues:          ride.dues?.amount,
      });
      const promo   = Number(ride.promoDiscount) || 0;
      const carried = Number(ride.dues?.amount) || 0;

      // Driver app ko dikhane ke liye ride pe hi rakh do — baad mein history
      // kholne par bhi wahi hisaab dikhega jo us waqt laga tha.
      ride.commissionPercent = commissionPct;
      ride.platformFee       = commission;
      ride.driverEarning     = driverEarning;
      ride.walletSettled     = collectedByPlatform ? 'platform' : 'cash';
      await ride.save();

      // Atomic $inc — do parallel ride-completions (alag rides) ek hi provider
      // ke wallet ko simultaneously credit karein to bhi lost update na ho.
      // Kamai (stats) hamesha poori judti hai; wallet sirf walletDelta se.
      const updatedProvider = await Provider.findByIdAndUpdate(
        provider._id,
        {
          $inc: {
            'stats.completedTrips': 1,
            'stats.totalTrips':     1,
            'stats.totalEarnings':  driverEarning,
            'stats.todayEarnings':  driverEarning,
            'wallet.balance':       walletDelta,
          },
          $set: { status: 'available' },
        },
        { new: true },
      );
      provider.stats  = updatedProvider.stats;
      provider.wallet = updatedProvider.wallet;
      provider.status = updatedProvider.status;

      // Wallet screen ki "Recent Transactions" ke liye ledger entry — sirf tab
      // jab wallet sach mein badla ho.
      if (walletDelta !== 0) {
        const why = collectedByPlatform
          ? `Ride ki kamai ₹${driverEarning}${commission ? ` (commission ₹${commission} kaatke)` : ''}`
          : [
              promo > 0      ? `promo ki bharpai +₹${promo}` : '',
              commission > 0 ? `commission −₹${commission}`   : '',
              carried > 0    ? `customer ka pichhla baaki −₹${carried} (platform ka)` : '',
            ].filter(Boolean).join(', ') + ` — ₹${ride.fare} aapne cash mein liye`;

        Transaction.create({
          provider:     provider._id,
          ride:         ride._id,
          type:         walletDelta > 0 ? 'credit' : 'debit',
          category:     'ride_earning',
          amount:       Math.abs(walletDelta),
          description:  why,
          status:       'completed',
          balanceAfter: provider.wallet.balance,
        }).catch((err) => console.error('Transaction.create (ride settlement) error:', err));
      }

      // Driver ko wallet credit notification — sirf tab jab wallet mein kuch aaya ho.
      // Cash ride par "wallet mein ₹200 aaye" kehna jhooth hota.
      const driverFcm = provider.deviceInfo?.fcmToken;
      if (driverFcm && walletDelta > 0) {
        notify.walletCredited(driverFcm, {
          amount:       walletDelta,
          totalBalance: provider.wallet.balance,
        }).catch(() => {});
      }

      // Invoice generate + email bhejo (background mein)
      const populatedRide = await Ride.findById(ride._id)
        .populate('customer', 'name phone email')
        .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });
      sendInvoice(populatedRide).catch(() => {});
    }

    if (status === 'cancelled') {
      if (ride.provider) {
        await Provider.findByIdAndUpdate(provider._id, {
          $inc: { 'stats.cancelledTrips': 1 },
          $set: { status: 'available' },
        });
      }
      // Customer ko cancel notification
      if (customerFcm) {
        notify.rideCancelledForCustomer(customerFcm, { reason: 'Driver ne ride cancel kar di' }).catch(() => {});
      }
      notifyCustomerInApp(ride.customer?._id, {
        title: '❌ Ride Cancel Ho Gayi', message: 'Driver ne ride cancel kar di. Dobara try karein.',
        type: 'warning', data: { rideId: ride._id.toString(), event: 'RIDE_CANCELLED' },
      });
    }

    return res.status(200).json({ success: true, message: 'Ride status updated', data: ride });
  } catch (error) {
    console.error('Update Ride Status Error:', error);
    return res.status(500).json({ success: false, message: 'Status update mein error' });
  }
};

// ─── VERIFY OTP AND START ─────────────────────────────────────────────────────
exports.verifyOTPAndStart = async (req, res) => {
  try {
    const { rideId, otp } = req.body;
    if (!rideId || !otp) return res.status(400).json({ success: false, message: 'rideId aur OTP required hai' });

    const ride = await Ride.findById(rideId).populate('customer', 'name phone');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

    if (ride.status !== 'arrived') {
      return res.status(400).json({ success: false, message: "Pehle 'Pickup Pe Pahunch Gaya' dabao" });
    }

    if (ride.otp !== String(otp)) {
      return res.status(401).json({ success: false, message: 'OTP galat hai' });
    }

    ride.status    = 'started';
    ride.startedAt = new Date();
    await ride.save();

    // Socket
    const io = getIO();
    io.to(`user_${ride.customer?._id}`).emit('rideStatusUpdate', { rideId: ride._id, status: 'started' });

    // Push notification
    const customerFcm = await getCustomerFcm(ride.customer?._id);
    if (customerFcm) {
      notify.rideStarted(customerFcm, { driverName: 'Driver', destination: ride.drop.address }).catch(() => {});
    }

    return res.status(200).json({ success: true, message: 'Ride shuru ho gayi!', data: ride });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'OTP verify karne mein error' });
  }
};

// ─── CANCEL RIDE ──────────────────────────────────────────────────────────────
exports.cancelRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;
    const ride = await Ride.findById(rideId).populate('customer', 'name');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    const statusBeforeCancel = ride.status;

    const isCustomer = ride.customer?._id.toString() === req.user.id;
    let isDriver = false;
    let provider = null;

    if (ride.provider) {
      provider = await Provider.findById(ride.provider).populate('user', 'name').select('deviceInfo user currentLocation');
      isDriver = provider?.user?._id?.toString() === req.user.id;
    }

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Yeh ride cancel nahi ho sakti' });
    }

    // ─── Cancellation ke niyam ───────────────────────────────────────────────
    // Kaun bharega, kitna, aur kise milega — sab utils/settlement.js mein.
    // Chhote mein: customer ka charge driver ko milta hai; driver der kare to
    // customer par kuch nahi; customer aaye hi nahi to driver par penalty nahi.
    let terms = await resolveCancellation(ride, isCustomer, provider);

    // Customer keh raha hai ki cancel driver ki wajah se ho rahi hai — "driver
    // ne cancel karne ko kaha" ya "driver zyada paise maang raha hai". Ye sach
    // ho to customer se charge lena naainsaafi hai; jhooth ho to har koi yahi
    // kaaran chun kar charge se bach jaayega. Beech ka raasta:
    //   • charge maaf — par ek customer ko 30 din mein sirf ek baar
    //   • har aise daawe ki shikayat apne aap admin ke paas jaati hai, driver
    //     ke naam ke saath — baar-baar aisa karne wala driver pakda jaata hai
    const reasonCode  = String(reason || '').split(' — ')[0].trim();
    const driverFault = isCustomer && !!provider
      && ['driver_asked_to_cancel', 'driver_asked_extra'].includes(reasonCode);

    if (driverFault) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const earlier = await Complaint.countDocuments({
        complainant: ride.customer?._id,
        description: /^\[auto-cancel\]/,
        createdAt:   { $gte: since },
      });

      if (earlier === 0 && terms.payer === 'customer' && terms.code !== 'customer_mid_ride') {
        terms = { ...terms, fee: 0, payer: null, toDriver: false, code: 'driver_fault_claim' };
      }

      ride.flaggedForReview = true;
      Complaint.create({
        type:            'customer_vs_driver',
        complainant:     ride.customer?._id,
        complainantName: ride.customer?.name || '',
        against:         provider.user?._id,
        againstName:     provider.user?.name || '',
        ride:            ride._id,
        category:        reasonCode === 'driver_asked_extra' ? 'fare' : 'behavior',
        priority:        'high',
        description:     `[auto-cancel] Customer ne ride cancel karte waqt bataya: ${
          reasonCode === 'driver_asked_extra' ? 'driver zyada paise maang raha tha' : 'driver ne cancel karne ko kaha'
        }.${terms.code === 'driver_fault_claim' ? ' Customer ka cancel charge maaf kiya gaya.' : ''}`,
      }).catch((err) => console.error('auto complaint error:', err.message));
    }

    const cancellationFee = terms.fee;

    // ─── Driver cancel kare to ride dobara driver dhoondhe ───────────────────
    // Pehle driver ke cancel karne par ride bas 'cancelled' ho jaati thi aur
    // customer ko poori booking dobara karni padti thi — jabki uski galti kuch
    // bhi nahi thi. Uber/Rapido dono aise mein khud dusra driver dhoondte hain.
    //
    // Sirf accepted/arrived pe — ride start ho chuki ho to beech raste mein
    // naya driver dhoondna bemaani hai. Customer ke na aane (no-show) par bhi
    // nahi — customer hai hi nahi. notifiedDrivers list waisi hi rehti hai
    // taaki cancel karne wale driver ko wahi ride dobara offer na ho.
    const canRequeue = terms.requeue;
    const noShow     = terms.code === 'customer_no_show';

    if (canRequeue) {
      ride.status             = 'searching';
      ride.provider           = null;
      ride.vehicle            = null;
      ride.acceptedAt         = null;
      // searchingSince naya — warna 10-minute wala auto-cancel job ise turant
      // stale maan kar band kar deta.
      ride.searchingSince     = new Date();
      ride.dispatchStageIndex = 0;
      ride.cancellationReason = reason || 'Driver cancelled';
      ride.cancellationFee    = cancellationFee;
      await ride.save();
    } else {
      ride.status             = 'cancelled';
      ride.cancelledBy        = isCustomer ? 'customer' : 'driver';
      ride.cancellationReason = noShow ? 'Customer pickup par nahi aaya' : (reason || 'Not specified');
      ride.cancelledAt        = new Date();
      ride.cancellationFee    = cancellationFee;
      await ride.save();

      // Ride hui hi nahi — customer ka promo wapas. (Driver ke chhodne par
      // ride dobara search mein jaati hai; tab promo usi ride par bana rehta hai.)
      if (ride.promoCode) {
        await releasePromo(ride.promoCode, ride.customer?._id || ride.customer);
      }
    }

    let feeCollected = true;
    if (cancellationFee > 0) {
      feeCollected = await chargeCancellationFee({
        ride,
        amount:   cancellationFee,
        onDriver: terms.payer === 'driver',
        provider,
        userId:   ride.customer?._id,
        // Customer ka charge driver ko — uska petrol aur waqt gaya hai.
        creditProvider: terms.toDriver,
      });
    }

    if (provider) {
      // Atomic update — `provider` upar sirf deviceInfo/user ke saath load hua
      // hai. Pehle yahan `provider.stats = provider.stats || {}` karke save
      // hota tha, aur stats select mein tha hi nahi: database mein poora
      // `stats` object mit kar sirf { cancelledTrips: 1 } reh jaata tha. Yaani
      // ek cancel par driver ki total trips aur total kamai ka record saaf.
      //
      // Ginti bhi sirf tab jab driver ne khud chhoda ho. Customer ke cancel
      // karne ya uske na aane par driver ka record kharab nahi hona chahiye.
      const driverLeft = !isCustomer && !noShow;
      // Pakki pre-booking (abhi chalu nahi) ke cancel par driver 'available'
      // nahi karte — wo us waqt kisi aur kaam par ho sakta hai.
      const wasActive = statusBeforeCancel !== 'scheduled';
      await Provider.findByIdAndUpdate(provider._id, {
        ...(wasActive ? { $set: { status: 'available' } } : {}),
        ...(driverLeft ? { $inc: { 'stats.cancelledTrips': 1 } } : {}),
      });
    }

    // Socket + Push notifications
    const io = getIO();

    if (isCustomer) {
      // Customer ne cancel kiya → driver ko batao
      if (provider) {
        io.to(`driver_${provider._id}`).emit('rideCancelled', { rideId: ride._id });
        const driverFcm = provider.deviceInfo?.fcmToken;
        if (driverFcm) {
          notify.rideCancelledForDriver(driverFcm, { customerName: ride.customer?.name || 'Customer' }).catch(() => {});
        }
      }
    } else if (canRequeue) {
      // Driver ne cancel kiya, par ride ab dobara search mein hai — customer ko
      // "cancel ho gayi" mat bolo, warna wo dobara book karne lagega jabki
      // hum uske liye pehle hi naya driver dhoond rahe hain.
      io.to(`user_${ride.customer?._id}`).emit('rideRequeued', { rideId: ride._id });

      const customerFcm = await getCustomerFcm(ride.customer?._id);
      if (customerFcm) {
        notify.custom(customerFcm, {
          title: '🔄 Naya Driver Dhoond Rahe Hain',
          body:  'Pehle wale driver ne cancel kar diya. Aapki booking chaalu hai.',
          data:  { type: 'RIDE_REQUEUED', rideId: String(ride._id) },
        }).catch(() => {});
      }
      notifyCustomerInApp(ride.customer?._id, {
        title: '🔄 Naya Driver Dhoond Rahe Hain',
        message: 'Pehle wale driver ne cancel kar diya. Aapki booking chaalu hai, naya driver dhoonda ja raha hai.',
        type: 'info', data: { rideId: ride._id.toString(), event: 'RIDE_REQUEUED' },
      });

      // Turant pehla wave (3km) chalao; aage ke waves cron sambhal lega.
      try {
        await dispatchRideStage(ride._id, 0);
        await markNextDispatch(ride._id, 0);
      } catch (err) {
        console.error('Re-dispatch after driver cancel failed:', err.message);
      }
    } else {
      // Driver ne cancel kiya aur ride requeue nahi ho sakti → customer ko batao
      io.to(`user_${ride.customer?._id}`).emit('rideCancelled', { rideId: ride._id });
      const customerFcm = await getCustomerFcm(ride.customer?._id);
      if (customerFcm) {
        notify.rideCancelledForCustomer(customerFcm, { reason: 'Driver ne ride cancel kar di' }).catch(() => {});
      }
      notifyCustomerInApp(ride.customer?._id, {
        title: '❌ Ride Cancel Ho Gayi',
        message: noShow
          ? `Driver pickup par intezaar karta raha par aap nahi mile, isliye ride cancel hui. ₹${cancellationFee} charge laga hai.`
          : 'Driver ne ride cancel kar di. Dobara try karein.',
        type: 'warning', data: { rideId: ride._id.toString(), event: 'RIDE_CANCELLED' },
      });
    }

    const cancelMessage = (() => {
      // Customer ke wallet mein paisa nahi tha — charge uski agli ride mein judega.
      const later = feeCollected ? '' : ' Ye aapki agli ride ke kiraye mein jud jaayega.';

      if (noShow) {
        return feeCollected
          ? `Ride cancel. Customer nahi aaya — ₹${cancellationFee} aapke wallet mein jode gaye.`
          : `Ride cancel. Customer nahi aaya — ₹${cancellationFee} customer par baaki hai; uske bharte hi aapke wallet mein aayenge.`;
      }
      if (terms.code === 'driver_late') return 'Ride cancel ho gayi. Driver der kar raha tha, isliye koi charge nahi laga.';
      if (terms.code === 'driver_fault_claim') return 'Ride cancel ho gayi. Aapne bataya ki driver ki wajah se cancel karni padi, isliye koi charge nahi laga. Hum iski jaanch karenge.';
      if (terms.code === 'customer_mid_ride') {
        return `Ride beech mein cancel hui. Ab tak chale ${terms.travelledKm} km ka ₹${cancellationFee} laga hai.${later}`;
      }
      if (canRequeue) {
        return cancellationFee > 0
          ? `Ride chhod di. ₹${cancellationFee} charge laga hai. Customer ke liye naya driver dhoonda ja raha hai.`
          : 'Ride chhod di. Customer ke liye naya driver dhoonda ja raha hai.';
      }
      return cancellationFee > 0
        ? `Ride cancel ho gayi. ₹${cancellationFee} cancellation charge laga hai.${isCustomer ? later : ''}`
        : 'Ride cancel ho gayi';
    })();

    return res.status(200).json({
      success: true,
      message: cancelMessage,
      requeued: canRequeue,
      cancellationFee,
      data: ride,
    });
  } catch (error) {
    console.error('Cancel Ride Error:', error);
    return res.status(500).json({ success: false, message: 'Ride cancel karne mein error' });
  }
};

// ─── Kaam tay se zyada nikla: extra raashi ───────────────────────────────────
// PUT /api/ride/fare-adjustment  { rideId, extraAmount, extraHours, reason, approved }
//
// Tractor/JCB ke kaam mein roz hota hai: ek ghante ka bola tha, do lag gaye.
// Driver naya hisaab banata hai, phone customer ko dikhata hai, aur customer
// ke haan kehne par "approved" bhejta hai. Mana kare to bhi record rehta hai.
//
// Customer ki suraksha:
//   • use turant app mein aur push se nayi rakam aur wajah dikhti hai
//   • ek ride par zyada se zyada 3 baar
//   • extra kul mila kar ride ke asal kiraye ke dugne se zyada nahi
exports.adjustFare = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).populate('user', 'name');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const { rideId, reason, approved } = req.body;
    const extraAmount = Math.round(Number(req.body.extraAmount));
    const extraHours  = Number(req.body.extraHours) || 0;

    if (!Number.isFinite(extraAmount) || extraAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Extra raashi sahi nahi hai' });
    }
    if (!String(reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'Wajah likhna zaroori hai' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }
    if (!['arrived', 'started', 'working'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Kiraya sirf chalte kaam ke dauraan badla ja sakta hai' });
    }

    const entry = { amount: extraAmount, hours: extraHours, reason: String(reason).trim().slice(0, 300), approved: approved === true, at: new Date() };

    // Customer ne mana kiya — sirf record, kiraya wahi.
    if (!entry.approved) {
      await Ride.updateOne({ _id: ride._id }, { $push: { fareAdjustments: entry } });
      return res.json({ success: true, message: 'Customer ne mana kiya — kiraya wahi rahega', data: { fare: ride.fare, fareAdjustment: ride.fareAdjustment || 0 } });
    }

    const already  = Number(ride.fareAdjustment) || 0;
    const approvedCount = (ride.fareAdjustments || []).filter((a) => a.approved).length;
    // Asal kiraya = abhi ka kiraya − pehle ke extra − pichhla baaki.
    const original = Math.max(0, (Number(ride.fare) || 0) - already - (Number(ride.dues?.amount) || 0));

    if (approvedCount >= 3) {
      return res.status(400).json({ success: false, message: 'Ek kaam mein kiraya 3 baar se zyada nahi badla ja sakta' });
    }
    if (already + extraAmount > original * 2) {
      return res.status(400).json({
        success: false,
        message: `Extra raashi asal kiraye (₹${original}) ke dugne se zyada nahi ho sakti. Zyada ka maamla ho to support se baat karein.`,
      });
    }

    // Atomic — filter mein purana fareAdjustment, taaki do request ek saath
    // aayein to extra do baar na jud jaaye.
    const updated = await Ride.findOneAndUpdate(
      { _id: ride._id, status: ride.status, fareAdjustment: ride.fareAdjustment || 0 },
      {
        $inc:  { fare: extraAmount, fareAdjustment: extraAmount },
        $push: { fareAdjustments: entry },
      },
      { new: true },
    );
    if (!updated) {
      return res.status(409).json({ success: false, message: 'Ride is beech badal gayi — dobara koshish karein' });
    }

    // Customer ko turant batao — uske phone par bhi nayi rakam dikhe.
    getIO().to(`user_${updated.customer}`).emit('rideStatusUpdate', { rideId: updated._id, status: updated.status });
    notifyCustomerInApp(updated.customer, {
      title: '💰 Kiraya Badha',
      message: `Driver ne ₹${extraAmount} extra joda: ${entry.reason}. Naya kiraya ₹${updated.fare}. Aapne haan nahi kahi thi to turant support ko batayein.`,
      type: 'warning', data: { rideId: updated._id.toString(), event: 'FARE_ADJUSTED' },
    });
    const customerFcm = await getCustomerFcm(updated.customer);
    if (customerFcm) {
      notify.custom(customerFcm, {
        title: '💰 Kiraya Badha',
        body:  `₹${extraAmount} extra — ${entry.reason}. Naya kiraya ₹${updated.fare}.`,
        data:  { type: 'FARE_ADJUSTED', rideId: String(updated._id) },
      }).catch(() => {});
    }

    return res.json({
      success: true,
      message: `Naya kiraya ₹${updated.fare}`,
      data: { fare: updated.fare, fareAdjustment: updated.fareAdjustment },
    });
  } catch (err) {
    console.error('adjustFare Error:', err);
    return res.status(500).json({ success: false, message: 'Kiraya badalne mein error' });
  }
};

// ─── Ride ke dauraan drop badalna ────────────────────────────────────────────
// Gaon mein ye aam hai: "bhaiya mandi nahi, ghar chalo". Pehle app ko iski
// khabar hi nahi hoti thi — driver naye pate par le jaata tha aur kiraya
// purane pate ka banta tha. Ya to driver ka nuksan, ya mauke par jhagda.
//
// Do kadam, taaki dono ko pata rahe kya ho raha hai:
//   1. Customer naya drop bhejta hai → use naya kiraya dikhta hai. Wo `confirm`
//      bheje tabhi request driver tak jaati hai.
//   2. Driver haan kahe tabhi ride ka drop aur kiraya badalta hai. Na kahe to
//      sab pehle jaisa.
//
// Naya kiraya: ride shuru ho chuki ho to (ab tak chala raasta + yahan se naye
// drop tak), warna (pickup se naye drop tak). Usi rate card se. Promo, pichhla
// baaki aur pehle se juda extra waise hi rehte hain.
const quoteDropChange = async (ride, provider, target) => {
  const pLat = ride.pickup?.coordinates?.latitude;
  const pLng = ride.pickup?.coordinates?.longitude;
  const [curLng, curLat] = provider?.currentLocation?.coordinates || [];
  const started = ['started'].includes(ride.status)
    && [curLat, curLng].every((n) => Number.isFinite(Number(n)));

  const via = (ride.stops || []).map((st) => [st.latitude, st.longitude]);
  const legs = started
    ? [[pLat, pLng], [curLat, curLng], [target.latitude, target.longitude]]
    : [[pLat, pLng], ...via, [target.latitude, target.longitude]];

  const trip = await measureLegs(legs);
  const base = await getDynamicFare(trip.distance, ride.vehicleType, {
    variant:         ride.vehicleVariant || '',
    ac:              Boolean(ride.ac),
    extras:          ride.extras || {},
    durationMinutes: calculateDuration(trip.distance),
    bookingDate:     ride.createdAt || new Date(),
  });

  const fare = Math.max(0, base.totalFare - (Number(ride.promoDiscount) || 0))
    + (Number(ride.dues?.amount) || 0)
    + (Number(ride.fareAdjustment) || 0);

  return { distance: trip.distance, fare };
};

// POST /api/ride/:id/drop-change-request  { address, latitude, longitude, confirm }
exports.requestDropChange = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    if (ride.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });
    }
    if (!['accepted', 'arrived', 'started'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Drop sirf chalti ride mein badla ja sakta hai' });
    }
    if (ride.workAtPickup || ride.packageId || ride.bookingMode === 'hourly') {
      return res.status(400).json({ success: false, message: 'Is booking mein drop nahi badla ja sakta' });
    }

    const { address } = req.body;
    const latitude  = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Naya drop sahi nahi hai' });
    }

    const provider = ride.provider
      ? await Provider.findById(ride.provider).select('currentLocation deviceInfo')
      : null;

    const quote = await quoteDropChange(ride, provider, { latitude, longitude });

    const maxTripKm = MAX_TRIP_DISTANCE_KM[ride.vehicleType] ?? MAX_TRIP_DISTANCE_KM.auto;
    if (quote.distance > maxTripKm) {
      return res.status(400).json({
        success: false,
        message: `Naya raasta (${quote.distance.toFixed(1)} km) is gaadi ke liye bahut lamba hai`,
      });
    }

    // Pehle sirf daam dikhao — customer haan kahe tabhi driver tak jaaye.
    if (req.body.confirm !== true) {
      return res.json({
        success: true,
        data: { newFare: quote.fare, oldFare: ride.fare, newDistance: quote.distance, pending: false },
      });
    }

    ride.pendingDropChange = {
      address, latitude, longitude,
      distance: quote.distance, fare: quote.fare, requestedAt: new Date(),
    };
    await ride.save();

    const payload = {
      rideId:      ride._id.toString(),
      newDrop:     { address, latitude, longitude },
      newFare:     quote.fare,
      oldFare:     ride.fare,
      newDistance: quote.distance,
    };
    if (provider) {
      getIO().to(`driver_${provider._id}`).emit('dropLocationChanged', payload);
      const fcm = provider.deviceInfo?.fcmToken;
      if (fcm) {
        notify.custom(fcm, {
          title: '📍 Customer drop badalna chahta hai',
          body:  `Naya drop: ${address}. Naya kiraya ₹${quote.fare}.`,
          data:  { type: 'DROP_CHANGE', rideId: String(ride._id) },
        }).catch(() => {});
      }
    }

    return res.json({
      success: true,
      message: 'Driver se poochha ja raha hai',
      data: { newFare: quote.fare, oldFare: ride.fare, newDistance: quote.distance, pending: true },
    });
  } catch (err) {
    console.error('requestDropChange Error:', err);
    return res.status(500).json({ success: false, message: 'Drop badalne mein error' });
  }
};

// PUT /api/ride/drop-change  { rideId, accepted }   (driver)
exports.respondDropChange = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const ride = await Ride.findById(req.body.rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }

    const pending = ride.pendingDropChange;
    if (!pending?.address) {
      return res.status(400).json({ success: false, message: 'Drop badalne ki koi request nahi hai' });
    }

    const accepted = req.body.accepted === true;
    if (accepted) {
      ride.drop = {
        address:     pending.address,
        coordinates: { latitude: pending.latitude, longitude: pending.longitude },
      };
      ride.distance          = pending.distance;
      ride.estimatedDuration = calculateDuration(pending.distance);
      ride.fare              = pending.fare;
    }
    ride.pendingDropChange = undefined;
    await ride.save();

    // Customer ki screen turant taaza ho.
    getIO().to(`user_${ride.customer}`).emit('rideStatusUpdate', { rideId: ride._id, status: ride.status });
    notifyCustomerInApp(ride.customer, accepted
      ? {
          title: '📍 Drop badal gaya',
          message: `Naya drop: ${ride.drop.address}. Naya kiraya ₹${ride.fare}.`,
          type: 'info', data: { rideId: ride._id.toString(), event: 'DROP_CHANGED' },
        }
      : {
          title: '📍 Drop nahi badla',
          message: 'Driver naye drop par nahi ja sakta. Ride pehle wale drop tak hi jaayegi.',
          type: 'warning', data: { rideId: ride._id.toString(), event: 'DROP_CHANGE_DECLINED' },
        });

    return res.json({
      success: true,
      message: accepted ? `Naya drop lag gaya. Kiraya ₹${ride.fare}` : 'Drop nahi badla',
      data: { accepted, fare: ride.fare, drop: ride.drop },
    });
  } catch (err) {
    console.error('respondDropChange Error:', err);
    return res.status(500).json({ success: false, message: 'Drop badalne mein error' });
  }
};

// ─── Kaam se pehle / baad ki photo ───────────────────────────────────────────
// POST /api/ride/:id/work-proof   (multipart: photo, phase = before | after)
exports.uploadWorkProof = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const ride = await Ride.findById(req.params.id).select('provider');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }

    const url = req.file?.path;
    if (!url) return res.status(400).json({ success: false, message: 'Photo nahi mili' });

    const phase = req.body.phase === 'after' ? 'after' : 'before';
    await Ride.updateOne({ _id: ride._id }, { $set: { [`workProof.${phase}`]: { url, at: new Date() } } });

    return res.json({ success: true, message: 'Photo save ho gayi', data: { phase, url } });
  } catch (err) {
    console.error('uploadWorkProof Error:', err);
    return res.status(500).json({ success: false, message: 'Photo save nahi ho paayi' });
  }
};

// ─── Is ride par cancel ke niyam (settings ke saath) ─────────────────────────
const cancellationTermsFor = async (ride, byCustomer) => {
  const settings   = await getSettings();
  const cancelConf = settings?.cancellation || {};

  // Har vehicle ka cancellation fee alag hai — bike chhodne ka nuksan aur JCB
  // chhodne ka nuksan ek jaisa nahi hota. Rate card mein value ho to wahi
  // chalti hai, warna platform ki global setting.
  const rate          = settings?.vehicleRates?.[ride.vehicleType] || {};
  const perVehicleFee = Number(rate.cancellationFee);

  return cancellationTerms({
    ride,
    byCustomer,
    freeWindowMinutes:  cancelConf.freeWindowMinutes ?? 2,
    customerFee:        Number.isFinite(perVehicleFee) && perVehicleFee > 0 ? perVehicleFee : (cancelConf.customerFee ?? 20),
    driverFee:          cancelConf.driverFee ?? 30,
    freeWaitingMinutes: rate.freeWaitingMinutes ?? settings?.waiting?.freeMinutes ?? 5,
  });
};

// ─── Niyam + beech-raaste cancel ka asli hisaab ──────────────────────────────
// Ride shuru ho chuki ho aur customer beech mein chhod de to driver ko sirf
// ₹20 dena nainsaafi hai — wo 8 km chala chuka ho sakta hai. Tab jitna raasta
// chala gaya uska kiraya lagta hai (usi rate card se), kam se kam minimum
// fare aur zyada se zyada poori ride ka kiraya.
const resolveCancellation = async (ride, byCustomer, provider) => {
  const terms = await cancellationTermsFor(ride, byCustomer);
  if (terms.code !== 'customer_mid_ride') return terms;

  const [curLng, curLat] = provider?.currentLocation?.coordinates || [];
  const pLat = ride.pickup?.coordinates?.latitude;
  const pLng = ride.pickup?.coordinates?.longitude;

  let travelledKm = 0;
  if ([curLat, curLng, pLat, pLng].every((n) => Number.isFinite(Number(n)))) {
    // Seedhi doori × 1.3 — aur booked doori se zyada kabhi nahi.
    travelledKm = Math.min(calculateDistance(pLat, pLng, curLat, curLng) * 1.3, Number(ride.distance) || Infinity);
    travelledKm = Math.round(travelledKm * 10) / 10;
  }

  let partFare = terms.fee;
  try {
    const part = await getDynamicFare(travelledKm, ride.vehicleType, {
      variant:     ride.vehicleVariant || '',
      ac:          Boolean(ride.ac),
      bookingDate: ride.startedAt || ride.createdAt || new Date(),
    });
    partFare = part.totalFare;
  } catch {
    // Rate na mile to aam cancel charge hi.
  }

  // Poori ride ke kiraye se zyada nahi (pichhla baaki isme nahi ginte — wo
  // alag se customer par bana rehta hai).
  const rideOnly = Math.max(0, (Number(ride.fare) || 0) - (Number(ride.dues?.amount) || 0));
  return {
    ...terms,
    fee: Math.round(Math.min(Math.max(partFare, terms.fee), rideOnly || partFare)),
    travelledKm,
  };
};

// ─── Cancel karne se pehle: kya lagega? ──────────────────────────────────────
// App cancel ka sheet kholte waqt yahi poochhti hai, taaki customer / driver
// ko button dabane se PEHLE sahi rakam dikhe — wahi jo cancelRide lagayega.
// GET /api/ride/:id/cancel-preview
exports.getCancelPreview = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

    const isCustomer = ride.customer?.toString() === req.user.id;
    const provider = ride.provider
      ? await Provider.findById(ride.provider).select('user currentLocation')
      : null;
    const isDriver = !isCustomer && provider?.user?.toString() === req.user.id;
    if (!isCustomer && !isDriver) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const terms = await resolveCancellation(ride, isCustomer, provider);
    const me    = isCustomer ? 'customer' : 'driver';

    return res.json({
      success: true,
      data: {
        // Mujhe kitna dena hoga
        fee:      terms.payer === me ? terms.fee : 0,
        // Driver ko kitna milega (no-show par)
        credit:   !isCustomer && terms.toDriver ? terms.fee : 0,
        code:     terms.code,
        requeue:  terms.requeue,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Cancel ki jaankari nahi mil paayi' });
  }
};

// ─── Cancellation fee wasoolo ────────────────────────────────────────────────
// Driver ke paas wallet balance hota hai (kamai isi mein aati hai), isliye
// uski fee turant kaat li jaati hai. Customer ka wallet abhi khaali ho sakta
// hai — uspe fee zabardasti nahi thopte: balance ho to kaat lo, warna
// transaction 'pending' chhod do taaki wallet mein paisa aane par ya admin
// ke through settle ho sake. Ride cancel hona kabhi fail nahi hona chahiye
// sirf isliye ki fee nahi kat payi, isliye poora block try/catch mein hai.
const chargeCancellationFee = async ({ ride, amount, onDriver, provider, userId, creditProvider = false }) => {
  try {
    if (onDriver && provider) {
      const updated = await Provider.findByIdAndUpdate(
        provider._id,
        { $inc: { 'wallet.balance': -amount } },
        { new: true },
      ).select('wallet');

      await Transaction.create({
        provider:     provider._id,
        ride:         ride._id,
        type:         'debit',
        category:     'cancellation_fee',
        amount,
        description:  'Ride cancel karne ka charge',
        status:       'completed',
        balanceAfter: updated?.wallet?.balance,
      });
      return true;
    }

    if (!userId) return false;

    // Atomic — balance check aur katna ek hi update mein, taaki do cancel ek
    // saath aayein to wallet minus mein na chala jaaye.
    const debited = await User.findOneAndUpdate(
      { _id: userId, wallet: { $gte: amount } },
      { $inc: { wallet: -amount } },
      { new: true },
    ).select('wallet');

    if (debited) {
      await Transaction.create({
        user:         userId,
        ride:         ride._id,
        type:         'debit',
        category:     'cancellation_fee',
        amount,
        description:  'Ride cancel karne ka charge',
        status:       'completed',
        balanceAfter: debited.wallet,
      });

      // Paisa aa gaya — driver ko turant uska hissa.
      if (creditProvider && provider) {
        await adjustProviderWallet({
          providerId:  provider._id,
          rideId:      ride._id,
          amount,
          category:    'cancellation_fee',
          description: 'Customer ne ride cancel ki — aapke aane ka charge',
          earning:     amount,
        });
      }
      return true;
    }

    // Wallet mein paisa nahi. Charge customer par baaki rehta hai aur uski
    // agli ride ke kiraye mein judta hai (utils/dues.js). Driver ko paisa
    // tabhi milta hai jab customer bharta hai — platform apni jeb se nahi
    // deta. Deta to driver aur customer mil kar baar-baar cancel karke
    // platform se paisa nikaal sakte the.
    await Transaction.create({
      user:        userId,
      ride:        ride._id,
      type:        'debit',
      category:    'cancellation_fee',
      amount,
      description: 'Ride cancel karne ka charge (baaki hai — agli ride mein judega)',
      status:      'pending',
      ...(creditProvider && provider ? { payoutProvider: provider._id } : {}),
    });
    return false;
  } catch (err) {
    console.error('Cancellation fee charge error:', err.message);
    return false;
  }
};

// ─── GET /api/ride/:id/messages ──────────────────────────────────────────────
// Chat history. Messages live socket se aate hain, par app dobara khulne par
// (ya driver ke phone lock hone ke baad) purani baat-cheet chahiye hoti hai.
exports.getRideMessages = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).select('customer provider');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

    const isCustomer = ride.customer?.toString() === req.user.id;
    let isDriver = false;
    if (ride.provider) {
      const provider = await Provider.findById(ride.provider).select('user');
      isDriver = provider?.user?.toString() === req.user.id;
    }
    if (!isCustomer && !isDriver) {
      return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });
    }

    const messages = await Message.find({ ride: ride._id })
      .select('text senderRole createdAt')
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      data: messages.map((m) => ({
        _id:        String(m._id),
        text:       m.text,
        senderRole: m.senderRole,
        createdAt:  m.createdAt,
      })),
    });
  } catch (error) {
    console.error('getRideMessages Error:', error.message);
    return res.status(500).json({ success: false, message: 'Messages laane mein error' });
  }
};

// ─── Phone number sirf zaroorat ke waqt ────────────────────────────────────────
// Number chhupane (masked calling — Exotel jaise) ka kharcha hai. Uske bina
// sabse badi privacy ki baat yeh hai ki ride khatam hone ke baad driver ke
// paas customer ka (aur customer ke paas driver ka) number na pada rahe.
// Isliye number sirf pakki pre-booking aur chalti ride mein; poori / radd
// ride ki history mein nahi.
const PHONE_VISIBLE_STATUSES = ['scheduled', 'accepted', 'arrived', 'started', 'working'];
const hidePhoneUnlessActive = (ride, path) => {
  const r = typeof ride.toObject === 'function' ? ride.toObject() : ride;
  if (PHONE_VISIBLE_STATUSES.includes(r.status)) return r;
  const parts = path.split('.');
  let obj = r;
  for (let i = 0; i < parts.length - 1; i++) obj = obj?.[parts[i]];
  if (obj && typeof obj === 'object') delete obj[parts[parts.length - 1]];
  return r;
};

// ─── RIDE HISTORY — CUSTOMER ──────────────────────────────────────────────────
exports.getRideHistoryCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { customer: req.user.id };
    if (status) query.status = status;

    const [rides, count] = await Promise.all([
      Ride.find(query)
        .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } })
        // Pakki pre-booking mein customer ko gaadi ka number bhi dikhna chahiye
        .populate('vehicle', 'number model color type')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Ride.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true, data: rides.map((r) => hidePhoneUnlessActive(r, 'provider.user.phone')),
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page), total: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ride history fetch karne mein error' });
  }
};

// ─── RIDE HISTORY — DRIVER ────────────────────────────────────────────────────
exports.getRideHistoryDriver = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const query = { provider: provider._id };
    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Ride.countDocuments(query),
    ]);

    return res.json({
      success: true, data: rides.map((r) => hidePhoneUnlessActive(r, 'customer.phone')),
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit), total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Ride history fetch karne mein error' });
  }
};

// ─── GET INVOICE ─────────────────────────────────────────────────────────────
exports.getRideInvoice = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    if (ride.status !== 'completed') return res.status(400).json({ success: false, message: 'Sirf completed ride ka invoice hota hai' });

    const isCustomer = ride.customer?._id.toString() === req.user.id;
    const isAdmin    = req.user.role === 'admin';
    let   isDriver   = false;
    if (ride.provider) {
      isDriver = ride.provider.user?._id?.toString() === req.user.id;
    }
    if (!isCustomer && !isDriver && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await buildInvoiceHTML(ride);
    if (!result) return res.status(500).json({ success: false, message: 'Invoice generate nahi ho paya' });

    // HTML as response (browser mein render hoga ya frontend iframe mein show kar sakta hai)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.html);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Invoice fetch karne mein error' });
  }
};

// ─── SEARCHING RIDES ──────────────────────────────────────────────────────────
exports.getSearchingRides = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, message: 'Only drivers allowed' });
    }

    const rides = await Ride.find({ status: 'searching', provider: null }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: rides });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Rides fetch karne mein error', ...(isDev && { error: err.message }) });
  }
};

// ─── SCHEDULED RIDES — DRIVER ─────────────────────────────────────────────────
exports.getScheduledRidesDriver = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id }).populate('activeVehicle');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    if (!provider.activeVehicle) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Do tarah ki: (1) meri pakki pre-bookings — customer ka naam/phone ke
    // saath, taaki pehle baat ho sake; (2) khuli pre-bookings jo main le
    // sakta hoon (kisi ne abhi li nahi).
    const [mine, open] = await Promise.all([
      Ride.find({ provider: provider._id, status: 'scheduled' })
        .populate('customer', 'name phone')
        .sort({ scheduledAt: 1 })
        .limit(30),
      Ride.find({
        bookingType:  'scheduled',
        status:       'scheduled',
        provider:     null,
        vehicleType:  { $in: rideTypesFor(provider.activeVehicle) },
        scheduledAt:  { $gte: new Date() },
      })
        .populate('customer', 'name')
        .sort({ scheduledAt: 1 })
        .limit(20),
    ]);

    // Jo ride is gaadi ki category / AC / auzaar se match nahi karti wo nahi.
    // Door ki bhi nahi — gaadi ke sabse bade dispatch daayre (tractor 35 km)
    // se bahar wali booking le kar driver samay par pahunch hi nahi paata.
    // Khuli booking mein customer ka phone nahi — pakki hone ke baad hi.
    const [dLng, dLat] = provider.currentLocation?.coordinates || [];
    const near = (r) => {
      const pLat = r.pickup?.coordinates?.latitude;
      const pLng = r.pickup?.coordinates?.longitude;
      if (![dLat, dLng, pLat, pLng].every((n) => Number.isFinite(Number(n))) || (dLat === 0 && dLng === 0)) return true;
      const stages = getRadiusStages(r.vehicleType);
      return calculateDistance(dLat, dLng, pLat, pLng) * 1000 <= stages[stages.length - 1];
    };
    // Khuli pre-booking mein upar wali category bhi (Sedan wala Mini ki) —
    // samay hai, aur driver ne "choti category bhi lunga" band na kiya ho
    const variantOrder = provider.activeVehicle.type === 'car' ? await getVariantOrder('car') : [];
    const fitting = open
      .filter((r) => vehicleFitsRide(provider.activeVehicle, r, { variantOrder }))
      .filter(near)
      .map((r) => ({ ...r.toObject(), mine: false }));
    const mineOut = mine.map((r) => ({ ...r.toObject(), mine: true, scheduledLabel: scheduleLabel(r.scheduledAt) }));

    return res.status(200).json({ success: true, data: [...mineOut, ...fitting] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Scheduled rides fetch karne mein error', ...(isDev && { error: err.message }) });
  }
};

// ─── RAZORPAY: CREATE ORDER FOR FARE ──────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.customer.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });

    if (ride.paymentMethod !== 'online')
      return res.status(400).json({ success: false, message: 'Payment method online nahi hai' });

    if (ride.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Fare already paid' });

    // Is ride ka baaki agar customer ki chalti ride ke kiraye mein jud chuka
    // hai to yahan dobara mat bharwao — warna ek hi paisa do baar jaata.
    if (await isRideCarriedAsDue(ride._id, req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Ye rakam aapki abhi wali ride ke kiraye mein jud chuki hai — wahin bhar dein.',
      });
    }

    const amount = Math.round((ride.finalFare || ride.fare) * 100); // paise mein

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt:  `ride_${ride._id}`,
    });

    ride.razorpayOrderId = order.id;
    await ride.save();

    return res.json({ success: true, order, key: process.env.RAZORPAY_KEY });
  } catch (err) {
    console.error('createRazorpayOrder Error:', err);
    return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
  }
};

// ─── RAZORPAY: VERIFY PAYMENT FOR FARE ────────────────────────────────────────
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { rideId, razorpayPaymentId, razorpaySignature } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.customer.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${ride.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      ride.paymentStatus = 'failed';
      await ride.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    ride.paymentStatus     = 'paid';
    ride.razorpayPaymentId = razorpayPaymentId;
    await ride.save();

    return res.json({ success: true, message: 'Payment verified', ride });
  } catch (err) {
    console.error('verifyRazorpayPayment Error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ─── RAZORPAY: QR CODE FOR CASH RIDE COLLECTION ───────────────────────────────
// Ride complete hone ke baad driver app yeh call karta hai — cash ride ko bhi
// UPI QR se collect karne ke liye (Ola/Uber jaisa). Koi bhi UPI app (GPay/PhonePe/
// Paytm) se scan ho sakta hai, kyunki yeh Razorpay ke "QR Codes" product se bana
// raw UPI QR hai, Checkout order jaisa nahi.
exports.createPaymentQrCode = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }

    if (ride.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Fare already paid' });
    }

    // Pehle se bana QR ho aur abhi tak active ho to wahi reuse karo
    if (ride.razorpayQrCodeId) {
      const existing = await razorpay.qrCode.fetch(ride.razorpayQrCodeId);
      if (existing.status === 'active') {
        return res.json({ success: true, data: { imageUrl: existing.image_url } });
      }
    }

    const amount = Math.round((ride.finalFare || ride.fare) * 100); // paise mein

    const qrCode = await razorpay.qrCode.create({
      type: 'upi_qr',
      name: `Ride ${ride._id}`,
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amount,
      description: `GaonConnect ride fare`,
      close_by: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min mein expire
      notes: { rideId: ride._id.toString() },
    });

    ride.razorpayQrCodeId = qrCode.id;
    await ride.save();

    return res.json({ success: true, data: { imageUrl: qrCode.image_url } });
  } catch (err) {
    console.error('createPaymentQrCode Error:', err);
    return res.status(500).json({ success: false, message: 'QR code creation failed' });
  }
};

// ─── RAZORPAY: QR PAYMENT STATUS POLL ─────────────────────────────────────────
// Driver app har 3s isko poll karta hai — DB se hi padhta hai, Razorpay ko direct
// hit nahi karta. Webhook (webhookController.js) hi asli status update karta hai.
exports.getPaymentQrStatus = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });

    const { rideId } = req.query;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (!ride.provider || ride.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized driver for this ride' });
    }

    return res.json({
      success: true,
      data: { status: ride.paymentStatus === 'paid' ? 'paid' : 'pending' },
    });
  } catch (err) {
    console.error('getPaymentQrStatus Error:', err);
    return res.status(500).json({ success: false, message: 'Payment status check karne mein error', ...(isDev && { error: err.message }) });
  }
};
