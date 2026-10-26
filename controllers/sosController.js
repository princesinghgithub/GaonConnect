const SosAlert = require('../models/SosAlert');
const Ride     = require('../models/Ride');
const Provider = require('../models/Provider');
const User     = require('../models/User');
const { getIO }  = require('../socket');
const { notify } = require('../utils/notifications');
const { ADMIN_ROOM } = require('../utils/liveTracking');

const isDev = process.env.NODE_ENV !== 'production';

// ─── POST /api/sos/trigger ────────────────────────────────────────────────────
// Customer ya driver — ride ke dauran emergency button dabaye
exports.triggerSOS = async (req, res) => {
  try {
    const { rideId, address } = req.body;

    // Location do tarah aati hai: website/driver app { latitude, longitude },
    // customer app { location: { lat, lng } }. Pehle sirf pehla format maana
    // jaata tha — customer app ka HAR SOS "Location required" (400) se fail
    // hota tha aur admin tak kuch nahi pahunchta tha.
    const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
    let latitude  = num(req.body.latitude ?? req.body.location?.lat ?? req.body.location?.latitude);
    let longitude = num(req.body.longitude ?? req.body.location?.lng ?? req.body.location?.longitude);
    const validPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng)
      && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

    // Ride sirf tab judti hai jab ye banda us ride ka customer ya driver ho —
    // warna koi bhi kisi ki ride id se us driver ko "SOS" bhej sakta tha.
    let ride = null;
    if (rideId) {
      const found = await Ride.findById(rideId)
        .populate('customer', 'name phone fcmToken')
        .populate({ path: 'provider', select: 'user deviceInfo currentLocation', populate: { path: 'user', select: 'name phone' } })
        .catch(() => null);
      const uid = String(req.user._id);
      const mine = found && (String(found.customer?._id) === uid || String(found.provider?.user?._id) === uid);
      if (mine) ride = found;
    }

    // Phone ki location nahi mili (permission band / GPS off) — SOS phir bhi
    // jaana chahiye. Driver ki aakhri jagah, warna pickup.
    let locationNote = '';
    if (!validPoint(latitude, longitude)) {
      const [dLng, dLat] = ride?.provider?.currentLocation?.coordinates || [];
      const pick = ride?.pickup?.coordinates;
      if (validPoint(Number(dLat), Number(dLng))) {
        latitude = Number(dLat); longitude = Number(dLng);
        locationNote = 'Phone ki location nahi mili — driver ki aakhri jagah';
      } else if (pick && validPoint(pick.latitude, pick.longitude)) {
        latitude = pick.latitude; longitude = pick.longitude;
        locationNote = 'Phone ki location nahi mili — ride ka pickup';
      } else {
        latitude = 0; longitude = 0;
        locationNote = 'Location nahi mil paayi — turant phone karein';
      }
    }
    const hasLocation = !(latitude === 0 && longitude === 0);
    const addressText = [address, locationNote].filter(Boolean).join(' · ');

    // Token ka role (kaunsi app) — User.role nahi; customer se driver bane
    // bande ka User.role 'customer' hi rehta hai.
    const triggeredByRole = req.activeRole === 'provider' ? 'driver' : 'customer';

    // SOS record save karo
    const alert = await SosAlert.create({
      ride:            ride?._id,
      triggeredBy:     req.user.id,
      triggeredByRole,
      location:        { latitude, longitude, address: addressText },
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
      location:  { latitude, longitude, address: addressText },
      rideId:    ride?._id || null,
      createdAt: alert.createdAt,
    };

    // Admin dashboard — wo 'admin_live' room mein judta hai (dekho socket.js).
    // Pehle 'admin_room' mein bhejte the jisme koi kabhi judta hi nahi tha.
    io.to(ADMIN_ROOM).emit('sos_alert', sosPayload);

    // Dusre party ko bhi notify karo. Push fail ho to bhi SOS safal hai.
    if (ride) {
      if (triggeredByRole === 'customer' && ride.provider) {
        // Customer ne press kiya → driver ko alert
        io.to(`driver_${ride.provider._id}`).emit('sos_alert', sosPayload);

        const driverFcm = ride.provider.deviceInfo?.fcmToken;
        if (driverFcm) {
          notify.custom(driverFcm, {
            title: '🚨 EMERGENCY ALERT!',
            body:  `${req.user.name} ne SOS button dabaya hai. Turant help karo!`,
            data:  { type: 'SOS', alertId: String(alert._id) },
          }).catch(() => {});
        }
      } else if (triggeredByRole === 'driver') {
        // Driver ne press kiya → customer ko alert. Pehle yahan driver ka
        // apna token (req.user) lagta tha — notification driver ko hi jaati.
        io.to(`user_${ride.customer?._id}`).emit('sos_alert', sosPayload);

        const customerFcm = ride.customer?.fcmToken;
        if (customerFcm) {
          notify.custom(customerFcm, {
            title: '🚨 Driver Emergency!',
            body:  'Driver ne SOS button dabaya hai.',
            data:  { type: 'SOS', alertId: String(alert._id) },
          }).catch(() => {});
        }
      }
    }

    // Nearby drivers ko bhi alert karo (10 nearest) — jagah pata ho tabhi
    const nearbyDrivers = !hasLocation ? [] : await Provider.find({
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

    // User ke emergency contacts wapas bhejo taaki app turant unhe WhatsApp pe
    // live location bhej sake. SMS isliye nahi bhej rahe kyunki India mein
    // custom SMS ke liye DLT-approved template chahiye — WhatsApp deep link
    // bina kisi gateway ke aaj hi kaam karta hai.
    let emergencyContacts = [];
    try {
      const u = await User.findById(req.user.id).select('emergencyContacts');
      emergencyContacts = u?.emergencyContacts || [];
    } catch {
      // Contacts na mile to SOS phir bhi safal hai — 112 aur admin alert ja chuka hai.
    }

    // Admin ko bhi contacts dikhne chahiye, taaki ops team khud phone kar sake.
    if (emergencyContacts.length) {
      io.to(ADMIN_ROOM).emit('sos_contacts', {
        alertId:  alert._id,
        contacts: emergencyContacts,
      });
    }

    return res.status(201).json({
      success: true,
      message: '🚨 SOS alert bhej diya gaya! Help raste mein hai.',
      data: {
        alertId: alert._id,
        emergencyContacts,
        // App is text ko WhatsApp/SMS mein bhej sakti hai.
        shareText: hasLocation
          ? `EMERGENCY: ${req.user.name} ko madad chahiye. Live location: https://maps.google.com/?q=${latitude},${longitude}`
          : `EMERGENCY: ${req.user.name} ko madad chahiye. Turant phone karein: ${req.user.phone}`,
      },
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
    io.to(ADMIN_ROOM).emit('sos_resolved', { alertId: alert._id, status, resolvedBy: req.user.name });

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
