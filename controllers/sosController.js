const SosAlert = require('../models/SosAlert');
const Ride     = require('../models/Ride');
const Provider = require('../models/Provider');
const User     = require('../models/User');
const { getIO }  = require('../socket');
const { notify } = require('../utils/notifications');

const isDev = process.env.NODE_ENV !== 'production';

// ─── POST /api/sos/trigger ────────────────────────────────────────────────────
// Customer ya driver — ride ke dauran emergency button dabaye
exports.triggerSOS = async (req, res) => {
  try {
    const { rideId, latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location (lat/lng) required hai' });
    }

    // Ride check (optional — bina ride ke bhi SOS ho sakta hai)
    let ride = null;
    if (rideId) {
      ride = await Ride.findById(rideId)
        .populate('customer', 'name phone')
        .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });
    }

    const triggeredByRole = req.user.role === 'provider' ? 'driver' : 'customer';

    // SOS record save karo
    const alert = await SosAlert.create({
      ride:            ride?._id,
      triggeredBy:     req.user.id,
      triggeredByRole,
      location:        { latitude, longitude, address: address || '' },
      status:          'active',
    });

    // ─── Socket: Admin panel ko real-time alert ─────────────────────────────
    const io = getIO();
    const sosPayload = {
      alertId:   alert._id,
      triggeredBy: {
        id:   req.user.id,
        name: req.user.name,
        role: triggeredByRole,
        phone: req.user.phone,
      },
      location:  { latitude, longitude, address: address || '' },
      rideId:    ride?._id || null,
      createdAt: alert.createdAt,
    };

    // Admin room ko bhejo
    io.to('admin_room').emit('sos_alert', sosPayload);

    // Dusre party ko bhi notify karo
    if (ride) {
      if (triggeredByRole === 'customer' && ride.provider) {
        // Customer ne press kiya → driver ko alert
        io.to(`driver_${ride.provider._id}`).emit('sos_alert', sosPayload);

        const driverFcm = ride.provider.deviceInfo?.fcmToken;
        if (driverFcm) {
          await notify.custom(driverFcm, {
            title: '🚨 EMERGENCY ALERT!',
            body:  `${req.user.name} ne SOS button dabaya hai. Turant help karo!`,
            data:  { type: 'SOS', alertId: String(alert._id) },
          });
        }
      } else if (triggeredByRole === 'driver') {
        // Driver ne press kiya → customer ko alert
        io.to(`user_${ride.customer?._id}`).emit('sos_alert', sosPayload);

        const customerFcm = req.user.fcmToken;
        if (customerFcm) {
          await notify.custom(customerFcm, {
            title: '🚨 Driver Emergency!',
            body:  'Driver ne SOS button dabaya hai.',
            data:  { type: 'SOS', alertId: String(alert._id) },
          });
        }
      }
    }

    // Nearby drivers ko bhi alert karo (50 nearest)
    const nearbyDrivers = await Provider.find({
      isOnline:   true,
      isApproved: true,
      isBlocked:  { $ne: true },
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: 5000, // 5 km radius
        },
      },
    }).select('_id deviceInfo').limit(10).lean();

    nearbyDrivers.forEach((d) => {
      io.to(`driver_${d._id}`).emit('sos_nearby', sosPayload);
    });

    console.log(`🚨 SOS triggered by ${req.user.name} (${triggeredByRole}) | Ride: ${ride?._id || 'N/A'}`);

    return res.status(201).json({
      success: true,
      message: '🚨 SOS alert bhej diya gaya! Help raste mein hai.',
      data:    { alertId: alert._id },
    });
  } catch (error) {
    console.error('SOS Trigger Error:', error);
    return res.status(500).json({ success: false, message: 'SOS bhejne mein error', ...(isDev && { error: error.message }) });
  }
};

// ─── PUT /api/sos/:alertId/resolve  (Admin only) ──────────────────────────────
exports.resolveSOSAlert = async (req, res) => {
  try {
    const { note, status } = req.body;
    const validStatus = ['resolved', 'false_alarm'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: "Status 'resolved' ya 'false_alarm' hona chahiye" });
    }

    const alert = await SosAlert.findByIdAndUpdate(
      req.params.alertId,
      { status, resolvedBy: req.user.id, resolvedAt: new Date(), resolveNote: note || '' },
      { new: true },
    ).populate('triggeredBy', 'name phone');

    if (!alert) return res.status(404).json({ success: false, message: 'Alert nahi mila' });

    // Socket: resolved notify karo
    const io = getIO();
    io.to('admin_room').emit('sos_resolved', { alertId: alert._id, status, resolvedBy: req.user.name });

    return res.status(200).json({ success: true, message: 'Alert resolve ho gaya', data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Alert resolve karne mein error' });
  }
};

// ─── GET /api/sos/active  (Admin only) ────────────────────────────────────────
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await SosAlert.find({ status: 'active' })
      .populate('triggeredBy', 'name phone')
      .populate('ride', 'pickup drop vehicleType')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Alerts fetch karne mein error' });
  }
};

// ─── GET /api/sos/history  (Admin only) ───────────────────────────────────────
exports.getAlertHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [alerts, total] = await Promise.all([
      SosAlert.find()
        .populate('triggeredBy', 'name phone')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      SosAlert.countDocuments(),
    ]);

    return res.status(200).json({
      success: true, data: alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page), total,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'History fetch karne mein error' });
  }
};
