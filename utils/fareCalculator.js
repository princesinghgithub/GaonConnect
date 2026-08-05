// ─────────────────────────────────────────────────────────────────────────────
// GaonConnect Fare Calculator v2.0
// Default rates (fallback jab DB available nahi ho)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RATES = {
  bike:    { baseFare: 20,  perKmRate: 8,  minimumFare: 25  },
  auto:    { baseFare: 25,  perKmRate: 12, minimumFare: 30  },
  car:     { baseFare: 50,  perKmRate: 15, minimumFare: 70  },
  tractor: { baseFare: 100, perKmRate: 25, minimumFare: 150 },
  tempo:   { baseFare: 80,  perKmRate: 20, minimumFare: 120 },
  truck:   { baseFare: 150, perKmRate: 30, minimumFare: 200 },
  jcb:     { baseFare: 200, perKmRate: 40, minimumFare: 300 },
  ambulance: { baseFare: 100, perKmRate: 18, minimumFare: 150 },
  wedding:   { baseFare: 500, perKmRate: 35, minimumFare: 1500 },
};

const DEFAULT_SURGE = {
  peakHours:   { enabled: true, multiplier: 1.2, slots: [{ from: 8, to: 10 }, { from: 17, to: 20 }] },
  nightCharge: { enabled: true, multiplier: 1.25, fromHour: 22, toHour: 6 },
  highDemand:  { enabled: false, multiplier: 1.5, reason: '' },
  maxMultiplier: 2.0,
};

const DEFAULT_WAITING = { enabled: true, freeMinutes: 3, perMinuteRate: 2, maxCharge: 50 };
const DEFAULT_BOOKING_FEE = { enabled: false, amount: 5 };
const DEFAULT_COMMISSION   = 0; // % (abhi 0 — no commission)

// ─── Haversine Distance ───────────────────────────────────────────────────────
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
};

// ─── Duration Estimate ────────────────────────────────────────────────────────
exports.calculateDuration = (distance) =>
  Math.ceil((distance / 25) * 60 * 1.2); // avg 25 km/h + 20% buffer

// ─── Surge Multiplier ─────────────────────────────────────────────────────────
const getSurgeMultiplier = (surge = DEFAULT_SURGE, bookingDate = new Date()) => {
  const hour = bookingDate.getHours(); // IST mein aata hai (server timezone)

  let multiplier = 1.0;
  let surgeType  = null;

  // High demand — Admin ne manually set kiya (highest priority)
  // Priority 1: Admin manual high demand (highest)
  if (surge.highDemand?.enabled) {
    multiplier = surge.highDemand.multiplier || 1.5;
    surgeType  = `High Demand${surge.highDemand.reason ? ` (${surge.highDemand.reason})` : ''}`;
  } else {
    // Priority 2: Night charge
    let nightActive = false;
    if (surge.nightCharge?.enabled) {
      const from    = surge.nightCharge.fromHour ?? 22;
      const to      = surge.nightCharge.toHour   ?? 6;
      // from > to means it crosses midnight (e.g. 22 → 6)
      nightActive = from > to
        ? (hour >= from || hour < to)
        : (hour >= from && hour < to);

      if (nightActive) {
        multiplier = surge.nightCharge.multiplier || 1.25;
        surgeType  = 'Night Charge (10PM–6AM)';
      }
    }

    // Priority 3: Peak hour (only if not night)
    if (!nightActive && surge.peakHours?.enabled) {
      const slots  = surge.peakHours.slots || [];
      const isPeak = slots.some((s) => hour >= s.from && hour < s.to);
      if (isPeak) {
        multiplier = surge.peakHours.multiplier || 1.2;
        surgeType  = 'Peak Hour';
      }
    }
  }

  // Cap at max
  const maxMultiplier = surge.maxMultiplier || 2.0;
  multiplier = Math.min(multiplier, maxMultiplier);

  return { multiplier, surgeType };
};

// ─── Waiting Charge ───────────────────────────────────────────────────────────
exports.calculateWaitingCharge = (waitMinutes = 0, waitingConfig = DEFAULT_WAITING) => {
  if (!waitingConfig.enabled || waitMinutes <= 0) return 0;

  const billable = Math.max(0, waitMinutes - (waitingConfig.freeMinutes || 3));
  const charge   = Math.round(billable * (waitingConfig.perMinuteRate || 2));
  return Math.min(charge, waitingConfig.maxCharge || 50);
};

// ─── Commission Split ─────────────────────────────────────────────────────────
exports.calculateCommission = (fare, commissionPercent = DEFAULT_COMMISSION) => {
  const rate          = commissionPercent / 100;
  const commission    = Math.round(fare * rate);
  const driverEarnings = fare - commission;
  return { fare, commission, driverEarnings, commissionRate: commissionPercent };
};

// ─── Base Fare (simple, backward compat) ─────────────────────────────────────
exports.calculateFare = (distance, vehicleType, rates = DEFAULT_RATES) => {
  const r    = rates[vehicleType] || rates.auto;
  let   fare = r.baseFare + distance * r.perKmRate;
  if (fare < r.minimumFare) fare = r.minimumFare;
  return Math.ceil(fare / 5) * 5;
};

// ─── FULL FARE BREAKDOWN (Uber-style) ─────────────────────────────────────────
/**
 * Detailed fare breakdown — User App mein dikhao
 * @param {number}  distance      km
 * @param {string}  vehicleType
 * @param {object}  options       { waitMinutes, bookingDate, settings }
 * @returns {object}              Detailed breakdown
 */
exports.getFareBreakdown = (distance, vehicleType, options = {}) => {
  const {
    waitMinutes  = 0,
    bookingDate  = new Date(),
    settings     = {},              // DB se aaya Setting document
  } = options;

  // Rates — DB se ya default
  const rates      = settings.vehicleRates || DEFAULT_RATES;
  const surgeConf  = settings.surge        || DEFAULT_SURGE;
  const waitConf   = settings.waiting      || DEFAULT_WAITING;
  const bookFeeConf = settings.bookingFee  || DEFAULT_BOOKING_FEE;
  const commPct    = settings.commission?.percentage ?? DEFAULT_COMMISSION;

  const r = rates[vehicleType] || rates.auto;

  // 1. Base fare
  let baseFare = r.baseFare + distance * r.perKmRate;
  if (baseFare < r.minimumFare) baseFare = r.minimumFare;
  baseFare = Math.ceil(baseFare / 5) * 5;

  // 2. Surge
  const { multiplier, surgeType } = getSurgeMultiplier(surgeConf, bookingDate);
  const surgeAmount = multiplier > 1
    ? Math.round(baseFare * (multiplier - 1))
    : 0;

  // 3. Waiting charge
  const waitingCharge = exports.calculateWaitingCharge(waitMinutes, waitConf);

  // 4. Booking fee
  const bookingFee = bookFeeConf.enabled ? (bookFeeConf.amount || 5) : 0;

  // 5. Total
  const subtotal  = baseFare + surgeAmount + waitingCharge + bookingFee;
  const totalFare = Math.ceil(subtotal / 5) * 5;

  // 6. Commission split
  const commission     = Math.round(totalFare * commPct / 100);
  const driverEarnings = totalFare - commission;

  return {
    // Summary (App mein bada dikhao)
    totalFare,
    currency: '₹',

    // Breakdown (expandable section)
    breakdown: [
      { label: 'Base Fare',      amount: baseFare,      show: true             },
      { label: surgeType || '',  amount: surgeAmount,    show: surgeAmount > 0  },
      { label: 'Waiting Charge', amount: waitingCharge,  show: waitingCharge > 0},
      { label: 'Booking Fee',    amount: bookingFee,     show: bookingFee > 0   },
    ].filter((item) => item.show),

    // Surge info
    surgeActive:    multiplier > 1,
    surgeType:      surgeType || null,
    surgeMultiplier: multiplier,

    // Driver earnings
    platformFee:     commission,
    driverEarnings,
    commissionPercent: commPct,

    // Meta
    vehicleType,
    distance,
    rateCard: {
      baseFare:    r.baseFare,
      perKmRate:   r.perKmRate,
      minimumFare: r.minimumFare,
    },
  };
};

// ─── All vehicles ka estimate ek saath ───────────────────────────────────────
exports.getAllFareEstimates = (distance, options = {}) => {
  const rates    = options.settings?.vehicleRates || DEFAULT_RATES;
  const vehicles = Object.keys(rates);
  const result   = {};
  vehicles.forEach((v) => {
    result[v] = exports.getFareBreakdown(distance, v, options);
  });
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// HOURLY RATES — Tractor & JCB
// Rates ab DB (Setting.hourlyRates) se aate hain, admin panel se editable.
// Yahan ke defaults sirf fallback hain jab settings load na ho paaye.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_HOURLY_RATES = require('../config/hourlyRatesDefaults');

// categories: array of { id, label, emoji, pricingType, sub: [{ id, label, rate, minimumHours }] }
exports.calculateHourlyFare = (vehicleType, category, service, hours = 1, distance = 0, hourlyRatesConfig = DEFAULT_HOURLY_RATES) => {
  const categories = hourlyRatesConfig?.[vehicleType];
  if (!categories) return { fare: 0, rateType: 'hourly', rate: 0 };

  const categoryConf = categories.find((c) => c.id === category);
  if (!categoryConf) return { fare: 0, rateType: 'hourly', rate: 0 };

  const serviceRate = categoryConf.sub?.find((s) => s.id === service);
  if (!serviceRate) return { fare: 0, rateType: 'hourly', rate: 0 };

  const isPerKm = categoryConf.pricingType === 'per_km';
  let fare = 0;
  const rateType = isPerKm ? 'per_km' : 'hourly';

  if (isPerKm) {
    fare = Math.max(distance * serviceRate.rate, 150);
  } else {
    fare = Math.max(hours, serviceRate.minimumHours || 1) * serviceRate.rate;
  }

  fare = Math.ceil(fare / 10) * 10;
  return { fare, rateType, rate: serviceRate.rate, label: serviceRate.label };
};

exports.getServicesForVehicle = (vehicleType, hourlyRatesConfig = DEFAULT_HOURLY_RATES) =>
  hourlyRatesConfig?.[vehicleType] || null;

exports.DEFAULT_HOURLY_RATES = DEFAULT_HOURLY_RATES;
