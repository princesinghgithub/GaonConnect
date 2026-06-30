const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Ride         = require('../models/Ride');
const Provider     = require('../models/Provider');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { calculateFare }             = require('../utils/fareCalculator');
const { getIO }                     = require('../socket');
const { notify }                    = require('../utils/notifications');
const { applyPromoToRide }          = require('./promoController');
const { buildAndSendInvoice }       = require('../utils/invoiceGenerator');

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
  // User model mein fcmToken field nahi hai abhi, future ke liye placeholder
  return null;
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

// ─── CREATE RIDE ──────────────────────────────────────────────────────────────
exports.createRide = async (req, res) => {
  try {
    const {
      pickup, drop, dropoff,
      vehicleType,
      distance, estimatedFare, fare, estimatedDuration,
      paymentMethod  = 'cash',
      bookingType    = 'instant',
      scheduledAt    = null,
      scheduledNote  = '',
      bookingMode    = 'distance',
      serviceCategory = '',
      serviceType     = '',
      estimatedHours  = 0,
      workNote        = '',
      promoCode       = null,
    } = req.body;

    const dropLocation = drop || dropoff;

    if (!pickup || !dropLocation || !vehicleType) {
      return res.status(400).json({ success: false, message: 'Pickup, drop aur vehicle type required hai' });
    }

    const otp          = crypto.randomInt(1000, 9999).toString();
    let   finalFare    = fare || estimatedFare || 0;
    const finalDist    = typeof distance === 'object' ? distance.value : (distance || 0);
    const finalDur     = estimatedDuration || 30;

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
      bookingType,
      scheduledAt:   scheduledAt ? new Date(scheduledAt) : null,
      scheduledNote: scheduledNote || '',
      bookingMode,
      serviceCategory,
      serviceType,
      estimatedHours,
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

    // Instant ride — nearest 5 drivers ko socket + push notification
    const io = getIO();
    const customerUser = await User.findById(req.user.id).select('name phone');

    const pickupLng = pickup.longitude || pickup.location?.longitude;
    const pickupLat = pickup.latitude  || pickup.location?.latitude;

    // MongoDB $near — location se sort karke 5 closest drivers
    let availableDrivers = [];
    if (pickupLat && pickupLng) {
      availableDrivers = await Provider.find({
        isOnline:        true,
        isApproved:      true,
        isBlocked:       { $ne: true },
        status:          'available',
        'vehicle.type':  vehicleType,
        currentLocation: {
          $near: {
            $geometry:    { type: 'Point', coordinates: [pickupLng, pickupLat] },
            $maxDistance: 15000, // 15 km radius
          },
        },
      }).select('_id deviceInfo').limit(5).lean();
    }

    // Fallback — location nahi hai toh saare available drivers
    if (!availableDrivers.length) {
      availableDrivers = await Provider.find({
        isOnline:       true,
        isApproved:     true,
        isBlocked:      { $ne: true },
        status:         'available',
        'vehicle.type': vehicleType,
      }).select('_id deviceInfo').lean();
    }

    const ridePayload = {
      rideId:        ride._id,
      customerName:  customerUser?.name  || 'Customer',
      customerPhone: customerUser?.phone || '',
      pickup: {
        address:   ride.pickup.address,
        latitude:  ride.pickup.coordinates.latitude,
        longitude: ride.pickup.coordinates.longitude,
      },
      drop: {
        address:   ride.drop.address,
        latitude:  ride.drop.coordinates.latitude,
        longitude: ride.drop.coordinates.longitude,
      },
      fare:          finalFare,
      distance:      finalDist,
      vehicleType,
      paymentMethod,
    };

    // Socket (online drivers) + FCM push (offline drivers)
    availableDrivers.forEach((driver) => {
      io.to(`driver_${driver._id}`).emit('newRideRequest', ridePayload);

      // Push notification — driver offline ho toh bhi mile
      const fcm = driver.deviceInfo?.fcmToken;
      if (fcm) {
        notify.newRideRequest(fcm, ridePayload).catch(() => {});
      }
    });

    return res.status(201).json({
      success: true,
      message: availableDrivers.length
        ? `${availableDrivers.length} drivers ko request bheji`
        : 'Koi driver available nahi',
      data: {
        ride,
        providerCount: availableDrivers.length,
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
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    let ride = await Ride.findOne({
      provider: provider._id,
      status:   { $in: ['accepted', 'arrived', 'started', 'working'] },
    })
      .populate('customer', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    if (!ride && provider.isOnline) {
      ride = await Ride.findOne({
        status:      'searching',
        provider:    null,
        vehicleType: provider.vehicle.type,
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
    const provider = await Provider.findOne({ user: req.user.id }).populate('user', 'name');
    if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized driver' });
    if (!provider.isApproved) return res.status(403).json({ success: false, message: 'Aapka account abhi admin se approve nahi hua' });
    if (provider.isBlocked) return res.status(403).json({ success: false, message: 'Aapka account block hai' });

    const { rideId } = req.body;
    // Atomic check-and-set — jab ek saath kai drivers (jaise scheduled
    // tractor/JCB request) accept karne ki koshish karein, sirf pehla
    // hi jeete; baki ko turant "Ride not available" mile.
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'searching' },
      { provider: provider._id, status: 'accepted', acceptedAt: new Date() },
      { new: true },
    );
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not available' });

    provider.status = 'busy';
    await provider.save();

    // Socket notify
    const io = getIO();
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
        vehicleType: provider.vehicle?.type,
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
      provider.wallet.balance        += driverEarning;
      provider.status = 'available';
      await provider.save();

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
      buildAndSendInvoice(populatedRide).catch(() => {});
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

    const result = await buildAndSendInvoice(ride);
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
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const rides = await Ride.find({
      bookingType:  'scheduled',
      status:       'scheduled',
      vehicleType:  provider.vehicle.type,
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
