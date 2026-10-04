const redis                  = require('../config/redis');
const Setting                = require('../models/Setting');
const { getFareBreakdown,
        getAllFareEstimates,
        getVariantsFor,
        pricingTypeOf,
        getServicesForVehicle,
        calculateHourlyFare,
        calculateWeddingFare } = require('./fareCalculator');
const { isRegistrableType } = require('./vehicleMatch');
const RETIRED_VEHICLE_TYPES = require('../config/retiredVehicleTypes');

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
const getDynamicHourlyFare = async (vehicleType, category, service, hours, distance, options = {}) => {
  const settings = await getSettings();
  return calculateHourlyFare(vehicleType, category, service, hours, distance, settings?.hourlyRates, {
    // Category ka apna commission na ho to platform ka global chalta hai.
    globalCommission: settings?.commission?.percentage ?? 0,
    ...options,
  });
};

// ─── Wedding car packages (app + website dono dikhate hain) ─────────────────
const getDynamicWeddingPackages = async () => {
  const settings = await getSettings();
  return (settings?.weddingPackages || []).filter((p) => p.isActive !== false);
};

// ─── Ek vehicle ka rate card (bina trip ke bhi dikhana hai) ──────────────────
// "No hidden charges" tabhi sach lagta hai jab customer booking se pehle hi
// poora rate card dekh sake.
const getRateCard = async (vehicleType) => {
  const settings = await getSettings();
  const r = settings?.vehicleRates?.[vehicleType];
  if (!r) return null;

  return {
    vehicleType,
    label:       r.label || vehicleType,
    icon:        r.icon  || '',
    image:       r.image || '',
    pricingType: pricingTypeOf(vehicleType, r, settings?.hourlyRates),

    minimumFare: r.minimumFare,
    includedKm:  r.includedKm,
    perKmRate:   r.perKmRate,
    perMinuteRate: r.perMinuteRate,

    freeWaitingMinutes: r.freeWaitingMinutes,
    waitingPerMinute:   r.waitingPerMinute,
    waitingPerHour:     r.waitingPerHour,

    freePickupKm:    r.freePickupKm,
    longPickupPerKm: r.longPickupPerKm,

    nightChargePercent: r.nightChargePercent,
    // Gaadi ka apna fee na ho to platform wala — wahi niyam jo cancelRide mein hai.
    cancellationFee:    Number(r.cancellationFee) > 0
      ? r.cancellationFee
      : (settings?.cancellation?.customerFee ?? 20),
    // Driver ke accept karne ke itne minute baad tak cancel muft hai.
    cancellationFreeMinutes: settings?.cancellation?.freeWindowMinutes ?? 2,
    extras:             r.extras || {},
    currency: '₹',
  };
};

// ─── Wedding package ka kiraya ───────────────────────────────────────────────
const getDynamicWeddingFare = async (packageId, options = {}) => {
  const settings = await getSettings();
  return calculateWeddingFare(packageId, {
    packages: settings?.weddingPackages || [],
    globalCommission: settings?.commission?.percentage ?? 0,
    ...options,
  });
};

// ─── Bookable vehicle-type catalog (apps ke liye — icon, label, hourly support) ──
const getDynamicVehicleTypes = async ({ forDriver = false } = {}) => {
  const settings     = await getSettings();
  const vehicleRates = settings?.vehicleRates || {};
  const hourlyRates   = settings?.hourlyRates  || {};

  // Customer ko wo gaadi dikhana jiska ek bhi kaam chalu nahi (thresher,
  // harvester jab tak admin rate na bhare) — tap karte hi khaali screen.
  // Isliye customer ki list mein sirf wahi jo abhi sach mein book ho sakti hai.
  const bookable = (id, r) => {
    const type = pricingTypeOf(id, r, hourlyRates);
    if (type === 'package') return (settings?.weddingPackages || []).some((p) => p.isActive !== false);
    if (type === 'distance') return true;
    const services = getServicesForVehicle(id, hourlyRates);
    return Array.isArray(services) && services.length > 0;
  };

  return Object.entries(vehicleRates)
    .filter(([, r]) => r.isActive !== false)
    .filter(([id]) => !RETIRED_VEHICLE_TYPES.includes(id))
    .filter(([id, r]) => (forDriver ? isRegistrableType(id) : bookable(id, r)))
    .map(([id, r]) => ({
      id,
      label: r.label || id,
      icon:  r.icon || '',
      image: r.image || '',
      pricingType: pricingTypeOf(id, r, hourlyRates),
      supportsHourly: Array.isArray(hourlyRates[id]) && hourlyRates[id].length > 0,
      // Type ke andar ki chaalu categories (car → Mini / Sedan / SUV). Daam
      // yahan nahi — wo fare-estimate deta hai. Ye sirf chunne ke liye hai,
      // jaise pre-booking screen par.
      variants: getVariantsFor(id, r).map((v) => ({
        id:     v.id,
        label:  v.label || v.id,
        models: v.models || '',
        seats:  Number(v.seats) || 0,
        image:  v.image || '',
        acAvailable:    v.acAvailable    !== false,
        nonAcAvailable: v.nonAcAvailable !== false,
      })),
    }));
};

// ─── Current surge status (App mein dikhao) ───────────────────────────────────
const getCurrentSurgeInfo = async () => {
  const settings = await getSettings();
  const surge    = settings?.surge;

  // fareCalculator surge tabhi lagata hai jab master switch on ho — yahan bhi
  // wahi shart honi chahiye, warna banner dikhega aur fare mein surge hoga hi nahi.
  if (!surge || !surge.enabled) return { active: false, multiplier: 1.0, reason: null };

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
  getDynamicVehicleTypes,
  getDynamicWeddingPackages,
  getDynamicWeddingFare,
  getRateCard,
};
