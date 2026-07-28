const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Ride         = require('../models/Ride');
const Provider     = require('../models/Provider');
const Vehicle      = require('../models/Vehicle');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const Transaction  = require('../models/Transaction');
const { getDynamicFare, getDynamicHourlyFare } = require('../utils/dynamicFare');
const { getIO }                     = require('../socket');
const { notify }                    = require('../utils/notifications');
const { applyPromoToRide }          = require('./promoController');
const { buildInvoiceHTML, sendInvoice } = require('../utils/invoiceGenerator');

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
const DISPATCH_STAGES_M       = [3000, 8000, 15000, null]; // meters; null = no distance limit
const DISPATCH_STAGE_DELAY_MS = 30 * 1000;

// Ek stage ke liye matching + abhi-tak-notify-na-hue drivers dhoondo aur unhe
// notify karo. Sirf NAYE drivers ko bhejte hain — jinko pichhle wave mein
// already bheja ja chuka hai unko dobara spam nahi karte (unke paas already
// apni 30s wali request timer chal rahi hai driver-app ki taraf).
const dispatchRideStage = async (rideId, radiusMeters) => {
  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== 'searching') return 0; // already accepted/cancelled — chain yahin ruk jaaye

  const matchingVehicles = await Vehicle.find({ type: ride.vehicleType, isVerified: true, isActive: true }).select('_id');
  const matchingVehicleIds = matchingVehicles.map((v) => v._id);

  const REACHABLE_WINDOW_MS = 10 * 60 * 1000; // 10 minute
  const reachableSince = new Date(Date.now() - REACHABLE_WINDOW_MS);
  const reachabilityFilter = {
    $or: [
      { locationUpdatedAt: { $gte: reachableSince } },
      { locationUpdatedAt: { $exists: false } },
    ],
  };

  const baseQuery = {
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
    const customerUser = await User.findById(ride.customer).select('name phone');
    const ridePayload = {
      rideId:        ride._id,
      customerName:  customerUser?.name  || 'Customer',
      customerPhone: customerUser?.phone || '',
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
      paymentMethod:  ride.paymentMethod,
      bookingMode:    ride.bookingMode,
      serviceCategory: ride.serviceCategory,
      serviceType:    ride.serviceType,
      estimatedHours: ride.estimatedHours,
      hourlyRate:     ride.hourlyRate,
      workNote:       ride.workNote,
    };

    newDrivers.forEach((driver) => {
      io.to(`driver_${driver._id}`).emit('newRideRequest', ridePayload);
      const fcm = driver.deviceInfo?.fcmToken;
      if (fcm) notify.newRideRequest(fcm, ridePayload).catch(() => {});
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
const markNextDispatch = async (rideId, stageIndex) => {
  const nextDispatchAt = stageIndex + 1 < DISPATCH_STAGES_M.length
    ? new Date(Date.now() + DISPATCH_STAGE_DELAY_MS)
    : null; // last stage ho chuka — ab aur koi wave due nahi
  await Ride.findOneAndUpdate(
    { _id: rideId, status: 'searching' },
    { dispatchStageIndex: stageIndex, nextDispatchAt },
  );
};

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
      status: 'searching',
      nextDispatchAt: { $ne: null, $lte: new Date() },
    }).select('_id dispatchStageIndex');

    for (const ride of due) {
      const nextIndex = ride.dispatchStageIndex + 1;
      if (nextIndex >= DISPATCH_STAGES_M.length) continue;
      try {
        await dispatchRideStage(ride._id, DISPATCH_STAGES_M[nextIndex]);
        await markNextDispatch(ride._id, nextIndex);
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

    const dropLocation = drop || dropoff;

    if (!pickup || !dropLocation || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Pickup, drop aur vehicle type required hai' });
    }

    const otp          = crypto.randomInt(1000, 9999).toString();
    const finalDist    = typeof distance === 'object' ? distance.value : (distance || 0);
    const finalDur     = estimatedDuration || 30;

    // Fare — client jo bhi bheje usse IGNORE karo, hamesha server-side calculate karo.
    // (client-supplied fare/estimatedFare trust karna price tampering allow karta tha)
    let finalFare = 0;
    if (serviceCategory && serviceType) {
      const hourlyResult = await getDynamicHourlyFare(vehicleType, serviceCategory, serviceType, estimatedHours, finalDist);
      finalFare = hourlyResult.fare || 0;
    }
    if (!finalFare) {
      const fareBreakdown = await getDynamicFare(finalDist, vehicleType);
      finalFare = fareBreakdown.totalFare;
    }

    // Promo code apply karo
    let promoDiscount = 0;
    if (promoCode) {
      const promoResult = await applyPromoToRide(promoCode, req.user.id, finalFare, vehicleType, null);
      promoDiscount = promoResult.discount || 0;
      finalFare     = promoResult.finalFare;
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
      bookingMode,
      serviceCategory,
      serviceType,
      estimatedHours,
      hourlyRate,
      workNote,
    });

    // Scheduled ride — bas save karo, cron job notify karega
    if (bookingType === 'scheduled') {
      return res.status(201).json({
        success: true,
        message: 'Pre-booking ho gayi! Driver ko time pe notify kiya jayega.',
        data: { ride, providerCount: 0 },
      });
    }

    // Instant ride — pehla (najdeek 3km) wave turant, baaki waves progressively
    // cron ke through chalenge (dekho dispatchDueRides + jobs/scheduledRideJob.js) —
    // in-memory timer nahi, isliye server restart hone par bhi wave-chain zinda rehti hai.
    const firstWaveCount = await dispatchRideStage(ride._id, DISPATCH_STAGES_M[0]);
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
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name phone profilePhoto')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone profilePhoto' } });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

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
      status:   { $in: ['searching', 'accepted', 'arrived', 'started'] },
    })
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone profilePhoto' } })
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
      ride = await Ride.findOne({
        status:      'searching',
        provider:    null,
        vehicleType: provider.activeVehicle.type,
      })
        .populate('customer', 'name phone profilePhoto')
        .sort({ createdAt: 1 });
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
    const requestedRide = await Ride.findById(rideId).select('vehicleType status');
    if (requestedRide && requestedRide.status === 'searching' && provider.activeVehicle && requestedRide.vehicleType !== provider.activeVehicle.type) {
      return res.status(400).json({
        success: false,
        message: 'Aapne vehicle switch kar li hai — yeh request aapke pichhle vehicle type ke liye thi, ab valid nahi hai',
      });
    }

    // Atomic check-and-set — jab ek saath kai drivers (jaise scheduled
    // tractor/JCB request) accept karne ki koshish karein, sirf pehla
    // hi jeete; baki ko turant "Ride not available" mile.
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'searching' },
      { provider: provider._id, vehicle: provider.activeVehicle?._id || null, status: 'accepted', acceptedAt: new Date() },
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
    if (!ride || ride.status !== 'searching') {
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

    ride.status = status;
    if (status === 'arrived')   ride.arrivedAt    = new Date();
    if (status === 'started')   ride.startedAt    = new Date();
    if (status === 'working')   ride.workStartedAt = new Date();
    if (status === 'completed') {
      ride.completedAt = new Date();
      // For hourly bookings — compute actualHours from workStartedAt
      if (ride.workStartedAt) {
        ride.workEndedAt  = ride.completedAt;
        ride.actualHours  = parseFloat(
          ((ride.completedAt - ride.workStartedAt) / 3_600_000).toFixed(2)
        );
      }
    }

    await ride.save();

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

      // Driver earnings update
      const commission    = Math.round(ride.fare * 0.15);
      const driverEarning = ride.fare - commission;

      provider.stats.completedTrips  += 1;
      provider.stats.totalTrips      += 1;
      provider.stats.totalEarnings   += driverEarning;
      provider.stats.todayEarnings   += driverEarning;
      provider.wallet.balance        += driverEarning;
      provider.status = 'available';
      await provider.save();

      // Wallet screen ki "Recent Transactions" ke liye ledger entry
      Transaction.create({
        provider:     provider._id,
        ride:         ride._id,
        type:         'credit',
        amount:       driverEarning,
        description:  `Ride fare — ₹${ride.fare} (commission ₹${commission} kaatke)`,
        status:       'completed',
        balanceAfter: provider.wallet.balance,
      }).catch((err) => console.error('Transaction.create (ride credit) error:', err));

      // Driver ko wallet credit notification
      const driverFcm = provider.deviceInfo?.fcmToken;
      if (driverFcm) {
        notify.walletCredited(driverFcm, {
          amount:       driverEarning,
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
        provider.stats.cancelledTrips += 1;
        provider.status = 'available';
        await provider.save();
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

    const isCustomer = ride.customer?._id.toString() === req.user.id;
    let isDriver = false;
    let provider = null;

    if (ride.provider) {
      provider = await Provider.findById(ride.provider).populate('user', 'name').select('deviceInfo user');
      isDriver = provider?.user?._id?.toString() === req.user.id;
    }

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Yeh ride cancel nahi ho sakti' });
    }

    ride.status             = 'cancelled';
    ride.cancelledBy        = isCustomer ? 'customer' : 'driver';
    ride.cancellationReason = reason || 'Not specified';
    ride.cancelledAt        = new Date();
    await ride.save();

    if (provider) {
      provider.status = 'available';
      provider.stats  = provider.stats || {};
      provider.stats.cancelledTrips = (provider.stats.cancelledTrips || 0) + 1;
      await provider.save();
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
    } else {
      // Driver ne cancel kiya → customer ko batao
      io.to(`user_${ride.customer?._id}`).emit('rideCancelled', { rideId: ride._id });
      const customerFcm = await getCustomerFcm(ride.customer?._id);
      if (customerFcm) {
        notify.rideCancelledForCustomer(customerFcm, { reason: 'Driver ne ride cancel kar di' }).catch(() => {});
      }
      notifyCustomerInApp(ride.customer?._id, {
        title: '❌ Ride Cancel Ho Gayi', message: 'Driver ne ride cancel kar di. Dobara try karein.',
        type: 'warning', data: { rideId: ride._id.toString(), event: 'RIDE_CANCELLED' },
      });
    }

    return res.status(200).json({ success: true, message: 'Ride cancel ho gayi', data: ride });
  } catch (error) {
    console.error('Cancel Ride Error:', error);
    return res.status(500).json({ success: false, message: 'Ride cancel karne mein error' });
  }
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
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Ride.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true, data: rides,
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
      success: true, data: rides,
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
    return res.status(500).json({ success: false, message: err.message });
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

    const rides = await Ride.find({
      bookingType:  'scheduled',
      status:       'scheduled',
      vehicleType:  provider.activeVehicle.type,
      scheduledAt:  { $gte: new Date() },
    })
      .populate('customer', 'name phone')
      .sort({ scheduledAt: 1 })
      .limit(20);

    return res.status(200).json({ success: true, data: rides });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
    return res.status(500).json({ success: false, message: err.message });
  }
};
