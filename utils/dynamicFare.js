const redis                  = require('../config/redis');
const Setting                = require('../models/Setting');
const { getFareBreakdown,
        getAllFareEstimates,
        getServicesForVehicle,
        calculateHourlyFare } = require('./fareCalculator');

const SETTINGS_CACHE_KEY = 'app:settings';
const SETTINGS_CACHE_TTL = 300; // 5 minutes

// ─── Settings DB se load karo (Redis cache ke saath) ─────────────────────────
const getSettings = async () => {
  try {
    // Redis cache check karo pehle
    const cached = await redis.get(SETTINGS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    // DB se load karo
    let settings = await Setting.findOne().lean();

    // Pehli baar — default document create karo
    if (!settings) {
      settings = await Setting.create({});
      settings = settings.toObject();
    }

    // Cache karo 5 minutes ke liye
    await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, JSON.stringify(settings));

    return settings;
  } catch (err) {
    console.error('getSettings error:', err.message);
    return null; // fareCalculator defaults use karega
  }
};

// ─── Cache invalidate karo jab admin settings update kare ────────────────────
const invalidateSettingsCache = async () => {
  await redis.del(SETTINGS_CACHE_KEY);
};

// ─── Single vehicle fare breakdown ────────────────────────────────────────────
const getDynamicFare = async (distance, vehicleType, options = {}) => {
  const settings = await getSettings();
  return getFareBreakdown(distance, vehicleType, { ...options, settings });
};

// ─── All vehicles estimate ek saath ──────────────────────────────────────────
const getAllDynamicFares = async (distance, options = {}) => {
  const settings = await getSettings();
  return getAllFareEstimates(distance, { ...options, settings });
};

// ─── Tractor/JCB services list (DB rates, admin ke edits ke saath) ───────────
const getDynamicServices = async (vehicleType) => {
  const settings = await getSettings();
  return getServicesForVehicle(vehicleType, settings?.hourlyRates);
};

// ─── Tractor/JCB hourly fare (booking create karte waqt server-side use hota hai) ─
const getDynamicHourlyFare = async (vehicleType, category, service, hours, distance) => {
  const settings = await getSettings();
  return calculateHourlyFare(vehicleType, category, service, hours, distance, settings?.hourlyRates);
};

// ─── Current surge status (App mein dikhao) ───────────────────────────────────
const getCurrentSurgeInfo = async () => {
  const settings = await getSettings();
  const surge    = settings?.surge;

  if (!surge) return { active: false, multiplier: 1.0, reason: null };

  const hour = new Date().getHours();
  let   active     = false;
  let   multiplier = 1.0;
  let   reason     = null;

  if (surge.highDemand?.enabled) {
    active     = true;
    multiplier = surge.highDemand.multiplier;
    reason     = surge.highDemand.reason || 'High Demand';
  } else if (surge.nightCharge?.enabled) {
    const from    = surge.nightCharge.fromHour ?? 22;
    const to      = surge.nightCharge.toHour   ?? 6;
    const isNight = from > to ? (hour >= from || hour < to) : (hour >= from && hour < to);
    if (isNight) {
      active     = true;
      multiplier = surge.nightCharge.multiplier;
      reason     = 'Night Charge';
    }
  } else if (surge.peakHours?.enabled) {
    const isPeak = (surge.peakHours.slots || []).some((s) => hour >= s.from && hour < s.to);
    if (isPeak) {
      active     = true;
      multiplier = surge.peakHours.multiplier;
      reason     = 'Peak Hour';
    }
  }

  return { active, multiplier, reason };
};

module.exports = {
  getSettings,
  invalidateSettingsCache,
  getDynamicFare,
  getAllDynamicFares,
  getCurrentSurgeInfo,
  getDynamicServices,
  getDynamicHourlyFare,
};
