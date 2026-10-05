// ─────────────────────────────────────────────────────────────────────────────
// Driver kitni der mein pahunchega — fare screen ke liye.
//
// Fare screen par har gaadi ke saamne "3 min" jaisa time dikhta hai. Wo andaaza
// nahi hona chahiye: yahan asal mein dekha jaata hai ki us type ki sabse paas
// wali khaali gaadi pickup se kitni door hai.
//
// Kaun "paas ka driver" hai, iski shartein wahi hain jo ride dispatch ki hain
// (rideController.dispatchRideStage) — online, approved, khaali, location taaza.
// Dono alag hue to customer ko "2 min" dikhega aur ride us driver ko jaayegi
// hi nahi.
// ─────────────────────────────────────────────────────────────────────────────
const Provider = require('../models/Provider');
const DISPATCH_RADIUS_STAGES = require('../config/dispatchRadiusConfig');
const { calculateDistance } = require('./fareCalculator');
const { rideTypesFor } = require('./vehicleMatch');

const REACHABLE_WINDOW_MS = 10 * 60 * 1000;
// Sabse bade dispatch radius se aage dekhne ka koi fayda nahi.
const MAX_SEARCH_METERS = Math.max(...Object.values(DISPATCH_RADIUS_STAGES).map((s) => s[s.length - 1]));
// Gaon/kasbe ki sadak par pickup tak ki average raftaar.
const PICKUP_SPEED_KMPH = 25;
// Seedhi doori se sadak ki doori zyada hoti hai.
const ROAD_FACTOR = 1.3;

const maxRadiusKm = (vehicleType) => {
  const stages = DISPATCH_RADIUS_STAGES[vehicleType] || DISPATCH_RADIUS_STAGES.auto;
  return stages[stages.length - 1] / 1000;
};

/**
 * Pickup ke aas-paas ki khaali gaadiyan, paas se door ke kram mein.
 * @returns {Promise<Array<{type, variant, hasAC, km}>>}
 */
const getNearbyDrivers = async (lat, lng) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  const providers = await Provider.find({
    isOnline:      true,
    isApproved:    true,
    isBlocked:     { $ne: true },
    status:        'available',
    activeVehicle: { $ne: null },
    $or: [
      { locationUpdatedAt: { $gte: new Date(Date.now() - REACHABLE_WINDOW_MS) } },
      { locationUpdatedAt: { $exists: false } },
    ],
    currentLocation: {
      $near: {
        $geometry:    { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: MAX_SEARCH_METERS,
      },
    },
  })
    .select('currentLocation activeVehicle')
    .populate('activeVehicle', 'type variant hasAC equipment isVerified isActive')
    .limit(200)
    .lean();

  return providers
    .filter((p) => p.activeVehicle?.isVerified && p.activeVehicle?.isActive !== false)
    .map((p) => {
      const [pLng, pLat] = p.currentLocation?.coordinates || [];
      return {
        type:    p.activeVehicle.type,
        // Ye gaadi kin bookings ko le sakti hai — thresher wala tractor
        // thresher ki bhi, wedding wali car shaadi ki bhi.
        rideTypes: rideTypesFor(p.activeVehicle),
        variant: p.activeVehicle.variant || '',
        hasAC:   p.activeVehicle.hasAC,
        km:      calculateDistance(lat, lng, pLat, pLng),
      };
    })
    .filter((d) => Number.isFinite(d.km) && d.km <= Math.max(...d.rideTypes.map(maxRadiusKm), maxRadiusKm(d.type)));
};

/**
 * Is gaadi (aur category / AC) ke liye sabse paas wala driver kitne minute door.
 * Koi na ho to null — tab app time dikhati hi nahi, jhootha number nahi.
 *
 * Category aur AC ka mel wahi hai jo dispatch mein: jis gaadi par category set
 * nahi wo har category ke liye chalti hai, aur AC maanga ho to sirf wo gaadi
 * nahi chalegi jisme saaf "AC nahi" likha hai.
 */
const nearestMatch = (drivers, vehicleType, { variant = '', ac = false } = {}) =>
  drivers.find((d) =>
    (d.rideTypes || [d.type]).includes(vehicleType)
    && d.km <= maxRadiusKm(vehicleType)
    && (!variant || !d.variant || d.variant === variant)
    && (!ac || d.hasAC !== false));

const etaFor = (drivers, vehicleType, opts) => {
  const match = nearestMatch(drivers, vehicleType, opts);
  if (!match) return null;
  return Math.max(1, Math.ceil((match.km * ROAD_FACTOR / PICKUP_SPEED_KMPH) * 60));
};

/**
 * Sabse paas wala driver pickup se sadak ke hisaab se kitne km door.
 * "Long pickup" charge isi par lagta hai. Koi driver na ho to 0 — jo driver
 * dikh hi nahi raha uske aane ka charge customer par nahi daalte.
 */
const pickupKmFor = (drivers, vehicleType, opts) => {
  const match = nearestMatch(drivers, vehicleType, opts);
  return match ? Math.round(match.km * ROAD_FACTOR * 10) / 10 : 0;
};

module.exports = { getNearbyDrivers, etaFor, pickupKmFor };
