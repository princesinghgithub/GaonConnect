// utils/liveTracking.js
// Admin dashboard ki live tracking — driver ki har location (ride screen ka
// socket 'driverLocation' ~3s, ya online rehte background PUT /provider/location
// ~45s) yahan se guzarti hai:
//   1. admin_live room mein turant bhej do — Live Map par marker chalta dikhe
//   2. chalu ride ho to uske trail mein point jodo — admin dekh sake driver
//      kis raaste se gaya (pickup tak bhi, pickup se drop tak bhi)
//   3. socket wale point se Provider.currentLocation bhi taaza karo — pehle
//      socket point sirf customer tak jaata tha, DB mein 45s purana point rehta
//
// DB writes throttle hain (har driver ~10s mein ek), kyunki socket har 3s aata
// hai aur har point par Mongo write bekaar ka bojh hai. Broadcast throttle nahi.
const Provider = require('../models/Provider');
const Ride     = require('../models/Ride');

const ADMIN_ROOM          = 'admin_live';
const ACTIVE_RIDE_STATUSES = ['accepted', 'arrived', 'started', 'working'];
const PROVIDER_SAVE_MS    = 10 * 1000;
const TRAIL_MIN_MS        = 10 * 1000;
const TRAIL_MIN_METERS    = 25;
const TRAIL_MAX_POINTS    = 1500;
const RIDE_LOOKUP_TTL_MS  = 30 * 1000;

// providerId → { savedAt, trailAt, trailLat, trailLng, rideId, rideCheckedAt }
const state = new Map();

const metersBetween = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const validCoords = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

// Driver ki chalu ride — client ne bataayi ho (socket, ownership pehle hi
// check ho chuki) to wahi, warna DB se (30s cache, background ping ke liye).
const resolveActiveRide = async (providerId, s, rideId, now) => {
  if (rideId) {
    s.rideId = String(rideId);
    s.rideCheckedAt = now;
    return s.rideId;
  }
  if (now - (s.rideCheckedAt || 0) < RIDE_LOOKUP_TTL_MS) return s.rideId || null;
  const ride = await Ride.findOne({ provider: providerId, status: { $in: ACTIVE_RIDE_STATUSES } })
    .sort({ updatedAt: -1 })
    .select('_id');
  s.rideId = ride ? String(ride._id) : null;
  s.rideCheckedAt = now;
  return s.rideId;
};

const recordDriverLocation = async ({ providerId, lat, lng, rideId = null, saveToProvider = false }) => {
  lat = Number(lat);
  lng = Number(lng);
  if (!providerId || !validCoords(lat, lng)) return;

  const id  = String(providerId);
  const now = Date.now();
  const s   = state.get(id) || {};
  state.set(id, s);

  const activeRideId = await resolveActiveRide(id, s, rideId, now);

  try {
    const { getIO } = require('../socket'); // lazy — socket.js isi file ko require karta hai
    getIO().to(ADMIN_ROOM).emit('admin_driver_location', {
      providerId: id,
      rideId:     activeRideId,
      lat,
      lng,
      at:         new Date(now).toISOString(),
    });
  } catch { /* socket abhi init nahi hua — scripts/tests */ }

  const writes = [];

  if (saveToProvider && now - (s.savedAt || 0) >= PROVIDER_SAVE_MS) {
    s.savedAt = now;
    writes.push(Provider.updateOne(
      { _id: id },
      { currentLocation: { type: 'Point', coordinates: [lng, lat] }, locationUpdatedAt: new Date(now) },
    ));
  }

  if (activeRideId) {
    const movedEnough = s.trailLat === undefined ||
      metersBetween(s.trailLat, s.trailLng, lat, lng) >= TRAIL_MIN_METERS;
    if (now - (s.trailAt || 0) >= TRAIL_MIN_MS && movedEnough) {
      s.trailAt = now;
      s.trailLat = lat;
      s.trailLng = lng;
      writes.push(Ride.updateOne(
        { _id: activeRideId, status: { $in: ACTIVE_RIDE_STATUSES } },
        { $push: { trail: { $each: [{ lat, lng, at: new Date(now) }], $slice: -TRAIL_MAX_POINTS } } },
      ));
    }
  } else {
    // Ride khatam — agli ride ka trail pehle point se shuru ho
    s.trailLat = undefined;
    s.trailLng = undefined;
  }

  if (writes.length) await Promise.all(writes);
};

module.exports = { recordDriverLocation, ADMIN_ROOM };
