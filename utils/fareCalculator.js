// ─────────────────────────────────────────────────────────────────────────────
// GaonConnect Fare Calculator v2.0
// Default rates (fallback jab DB available nahi ho)
// ─────────────────────────────────────────────────────────────────────────────

// Fallback — sirf tab lagta hai jab Settings load na ho paaye. Numbers wahi
// rate card wale hain jo Setting.js seed karti hai, taaki dono kabhi alag na hon.
const DEFAULT_RATES = {
  bike:      { minimumFare: 30,  includedKm: 2, perKmRate: 15, freeWaitingMinutes: 5, waitingPerMinute: 1,   freePickupKm: 3, longPickupPerKm: 3, nightChargePercent: 10, fuelType: 'petrol' },
  auto:      { minimumFare: 50,  includedKm: 2, perKmRate: 16, freeWaitingMinutes: 5, waitingPerMinute: 1.5, freePickupKm: 3, longPickupPerKm: 4, nightChargePercent: 10, fuelType: 'cng' },
  erickshaw: { minimumFare: 40,  includedKm: 2, perKmRate: 19, freeWaitingMinutes: 5, waitingPerMinute: 1,   freePickupKm: 3, longPickupPerKm: 3, nightChargePercent: 10, fuelType: 'electric' },
  car:       { minimumFare: 80,  includedKm: 3, perKmRate: 14, freeWaitingMinutes: 5, waitingPerMinute: 2,   freePickupKm: 3, longPickupPerKm: 5, nightChargePercent: 10, fuelType: 'petrol' },
  goods:     { minimumFare: 150, includedKm: 3, perKmRate: 20, freeWaitingMinutes: 15, waitingPerHour: 100,  freePickupKm: 3, nightChargePercent: 10, fuelType: 'diesel' },
  tempo:     { minimumFare: 150, includedKm: 3, perKmRate: 18, freeWaitingMinutes: 15, waitingPerHour: 100,  freePickupKm: 3, nightChargePercent: 10, fuelType: 'diesel' },
  ambulance: { minimumFare: 150, includedKm: 3, perKmRate: 18, freeWaitingMinutes: 10, freePickupKm: 5, nightChargePercent: 0, fuelType: 'diesel' },
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
  const r = rates[vehicleType] || rates.auto;
  // Wahi formula jo getFareBreakdown use karta hai: minimumFare includedKm tak
  // cover karta hai, uske aage perKmRate. Do jagah do alag formula rakhne se
  // ek din dono ke jawab alag ho jaate.
  const extraKm = Math.max(0, Number(distance) - Number(r.includedKm || 0));
  const fare    = Number(r.minimumFare || 0) + Math.round(extraKm * Number(r.perKmRate || 0));
  return Math.max(Number(r.minimumFare || 0), Math.ceil(fare / 5) * 5);
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
    pickupKm     = 0,          // driver customer se kitni door tha
    durationMinutes = 0,       // ride mein kitna waqt lagega (andaaza)
    bookingDate  = new Date(),
    settings     = {},
    extras       = {},         // { loading: true, unloading: false, helper: true }
  } = options;

  const rates       = settings.vehicleRates   || DEFAULT_RATES;
  const surgeConf   = settings.surge          || DEFAULT_SURGE;
  const bookFeeConf = settings.bookingFee     || DEFAULT_BOOKING_FEE;
  const fuelConf    = settings.fuelAdjustment || {};
  const globalComm  = settings.commission?.percentage ?? DEFAULT_COMMISSION;

  const r = rates[vehicleType] || rates.auto || Object.values(rates)[0] || {};

  // Per-vehicle commission set ho to wahi, warna global.
  const commPct = (r.commissionPercent !== null && r.commissionPercent !== undefined && r.commissionPercent !== '')
    ? Number(r.commissionPercent)
    : globalComm;

  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const lines = [];

  // 1. Distance fare
  // minimumFare `includedKm` tak cover karta hai; uske aage har km ka perKmRate.
  // Purana model (baseFare + km*rate, floor minimum) chhoti rides pe driver ka
  // pickup tak ka kharcha bhi nahi nikalta tha.
  const minimumFare = num(r.minimumFare);
  const includedKm  = num(r.includedKm);
  const perKmRate   = num(r.perKmRate);

  const extraKm        = Math.max(0, num(distance) - includedKm);
  const distanceCharge = Math.round(extraKm * perKmRate);
  // NOTE: time charge neeche judta hai (perMinuteRate padhne ke baad).
  let   baseFare       = minimumFare + distanceCharge;

  lines.push({ label: 'Minimum Fare', amount: minimumFare, show: minimumFare > 0 });
  lines.push({
    label:  'Distance Charge (' + extraKm.toFixed(1) + ' km)',
    amount: distanceCharge,
    show:   distanceCharge > 0,
  });

  // 1b. Waqt ka charge — default 0, yaani band.
  // Booking ke waqt ke andaaze par, isliye customer ko jo daam dikha wahi
  // lagta hai chahe raste mein jaam mile.
  const perMinuteRate = num(r.perMinuteRate);
  const timeCharge    = perMinuteRate > 0
    ? Math.round(num(durationMinutes) * perMinuteRate)
    : 0;
  lines.push({
    label:  'Time Charge (' + Math.round(num(durationMinutes)) + ' min)',
    amount: timeCharge,
    show:   timeCharge > 0,
  });

  baseFare += timeCharge;

  // 2. Waiting — goods/tempo per-hour charge karte hain, baaki per-minute.
  const freeWait     = num(r.freeWaitingMinutes, 5);
  const billableWait = Math.max(0, num(waitMinutes) - freeWait);
  let   waitingCharge = 0;
  if (billableWait > 0) {
    waitingCharge = num(r.waitingPerHour) > 0
      ? Math.round((billableWait / 60) * num(r.waitingPerHour))
      : Math.round(billableWait * num(r.waitingPerMinute, 1));
  }
  lines.push({
    label:  'Waiting Charge (' + billableWait + ' min)',
    amount: waitingCharge,
    show:   waitingCharge > 0,
  });

  // 3. Long pickup — driver ko customer tak aane mein bhi petrol lagta hai.
  // Kuch km muft, uske aage charge; warna door wale customer par driver ka nuksan.
  const freePickup  = num(r.freePickupKm, 3);
  const extraPickup = Math.max(0, num(pickupKm) - freePickup);
  const longPickup  = Math.round(extraPickup * num(r.longPickupPerKm));
  lines.push({
    label:  'Long Pickup (' + extraPickup.toFixed(1) + ' km)',
    amount: longPickup,
    show:   longPickup > 0,
  });

  // 4. Goods extras — sirf tab jab admin ne enable kiya ho AUR customer ne chuna ho.
  let extrasTotal = 0;
  ['loading', 'unloading', 'helper'].forEach((key) => {
    const conf = r.extras && r.extras[key];
    if (!conf || !conf.enabled || !extras[key]) return;
    const amt = num(conf.amount);
    extrasTotal += amt;
    lines.push({
      label:  key.charAt(0).toUpperCase() + key.slice(1) + ' Charge',
      amount: amt,
      show:   amt > 0,
    });
  });

  // 5. Night charge — per-vehicle percent. Surge se alag cheez hai: night charge
  // hamesha ek jaisa aur pehle se maloom hota hai, surge demand pe badalta hai.
  const nightPct  = num(r.nightChargePercent);
  const hour      = bookingDate.getHours();
  const isNight   = nightPct > 0 && (hour >= 22 || hour < 6);
  const preNight  = baseFare + waitingCharge + longPickup + extrasTotal;
  const nightCharge = isNight ? Math.round(preNight * nightPct / 100) : 0;
  lines.push({
    label:  'Night Charge (' + nightPct + '%)',
    amount: nightCharge,
    show:   nightCharge > 0,
  });

  // 6. Fuel adjustment
  const fuelAdj = exports.calculateFuelAdjustment(preNight + nightCharge, r.fuelType, fuelConf);
  lines.push({ label: 'Fuel Adjustment', amount: fuelAdj, show: fuelAdj !== 0 });

  // 7. Surge — launch pe band hai (Setting.surge.enabled = false).
  const { multiplier, surgeType } = getSurgeMultiplier(surgeConf, bookingDate);
  const surgeAmount = (surgeConf.enabled && multiplier > 1)
    ? Math.round(baseFare * (multiplier - 1))
    : 0;
  lines.push({ label: surgeType || 'Surge', amount: surgeAmount, show: surgeAmount > 0 });

  // 8. Booking fee
  const bookingFee = bookFeeConf.enabled ? num(bookFeeConf.amount, 5) : 0;
  lines.push({ label: 'Booking Fee', amount: bookingFee, show: bookingFee > 0 });

  // 9. Total — minimumFare se neeche kabhi nahi.
  const subtotal  = preNight + nightCharge + fuelAdj + surgeAmount + bookingFee;
  const totalFare = Math.max(minimumFare, Math.ceil(subtotal / 5) * 5);

  const commission     = Math.round(totalFare * commPct / 100);
  const driverEarnings = totalFare - commission;

  return {
    totalFare,
    currency: '₹',

    breakdown: lines.filter((l) => l.show),

    surgeActive:        surgeAmount > 0,
    surgeType:          surgeAmount > 0 ? surgeType : null,
    surgeMultiplier:    surgeAmount > 0 ? multiplier : 1,
    nightChargeApplied: nightCharge > 0,

    platformFee:       commission,
    driverEarnings,
    commissionPercent: commPct,

    vehicleType,
    distance,
    label:       r.label || vehicleType,
    icon:        r.icon  || '',
    image:       r.image || '',
    pricingType: r.pricingType || 'distance',

    rateCard: {
      minimumFare,
      includedKm,
      perKmRate,
      perMinuteRate,
      freeWaitingMinutes: freeWait,
      waitingPerMinute:   num(r.waitingPerMinute),
      waitingPerHour:     num(r.waitingPerHour),
      freePickupKm:       freePickup,
      longPickupPerKm:    num(r.longPickupPerKm),
      nightChargePercent: nightPct,
      cancellationFee:    num(r.cancellationFee),
      // App ko pata hona chahiye ki is gaadi pe kaunse extras chalu hain aur
      // kitne ke — tabhi wo customer ko chunne ka option de paayegi.
      extras: ['loading', 'unloading', 'helper'].reduce((acc, key) => {
        const c = r.extras && r.extras[key];
        if (c && c.enabled && num(c.amount) > 0) acc[key] = num(c.amount);
        return acc;
      }, {}),
    },
  };
};

// Fuel adjustment
// Reference price ke muqable aaj ka price kitna upar/neeche hai, usi anupaat
// mein fare thoda adjust hota hai -- par maxAdjustmentPercent se zyada kabhi
// nahi, taaki customer par ek jhatke mein bada bojh na aaye.
exports.calculateFuelAdjustment = (amount, fuelType = 'petrol', conf = {}) => {
  if (!conf.enabled) return 0;
  // Electric/CNG pe petrol-diesel ka utaar-chadhav lagana galat hoga.
  if (fuelType !== 'petrol' && fuelType !== 'diesel') return 0;

  const isDiesel = fuelType === 'diesel';
  const ref = Number(isDiesel ? conf.dieselReferencePrice : conf.petrolReferencePrice);
  const now = Number(isDiesel ? conf.currentDieselPrice   : conf.currentPetrolPrice);
  if (!ref || !now || ref <= 0) return 0;

  const cap       = Math.abs(Number(conf.maxAdjustmentPercent) || 5);
  const changePct = ((now - ref) / ref) * 100;
  const capped    = Math.max(-cap, Math.min(cap, changePct));
  return Math.round(amount * capped / 100);
};

// ─── All vehicles ka estimate ek saath ───────────────────────────────────────
exports.getAllFareEstimates = (distance, options = {}) => {
  const rates = options.settings?.vehicleRates || DEFAULT_RATES;

  // isActive: false wale vehicles chhod do. Pehle yeh sab types ka fare lauta
  // deta tha jabki getDynamicVehicleTypes inhe filter karta hai — is farak ki
  // wajah se admin ke band kiye hue vehicle home screen se to gayab ho jaate
  // the, par fare screen unhe ab bhi dikha kar book karne deti thi.
  const vehicles = Object.keys(rates).filter((v) => rates[v]?.isActive !== false);

  const result = {};
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
// Tractor/JCB/Thresher/Harvester ka kiraya.
//
// Ye sab ek hisaab se nahi chalte: hal chalana ghante se, fasal dhona km se,
// katai acre se, gehun nikalna quintal se. Isliye rate ke saath uska `unit`
// bhi dekhna zaroori hai.
//
// Waiting, raat ka charge aur commission pehle sirf passenger gaadiyon pe
// lagte the — yaani tractor ka driver raat ko kaam kare ya ghanton khada rahe,
// use ek rupaya extra nahi milta tha. Ab ye teeno yahan bhi lagte hain, har
// category ki apni setting se.
exports.calculateHourlyFare = (
  vehicleType, category, service,
  hours = 1, distance = 0,
  hourlyRatesConfig = DEFAULT_HOURLY_RATES,
  options = {},
) => {
  const empty = { fare: 0, rateType: 'hourly', rate: 0, breakdown: [] };

  const categories = hourlyRatesConfig?.[vehicleType];
  if (!categories) return empty;

  const categoryConf = categories.find((c) => c.id === category);
  if (!categoryConf) return empty;

  const serviceRate = categoryConf.sub?.find((s) => s.id === service);
  if (!serviceRate) return empty;

  // Jis service ka rate admin ne abhi set hi nahi kiya (thresher/harvester),
  // uski booking nahi banni chahiye — warna ride ₹0 pe ban jaayegi.
  if (serviceRate.isActive === false || !(Number(serviceRate.rate) > 0)) return empty;

  const {
    quantity = 0,
    arrivalKm = 0,
    waitMinutes = 0,
    bookingDate = new Date(),
    globalCommission = 0,
    // `either` wali service mein customer ne kya chuna — 'hour' ya 'acre'.
    chosenUnit = null,
  } = options;

  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const lines = [];

  // Purane records mein `unit` nahi hai — tab category ka pricingType hi
  // bataata tha ki per-km hai ya per-hour.
  const configuredUnit = serviceRate.unit || (categoryConf.pricingType === 'per_km' ? 'km' : 'hour');

  // `either` = customer ki marzi. Usne acre chuna to per-acre rate chalega,
  // warna ghante wala. Acre ka rate bhara hi na ho to ghante pe hi rahega —
  // aadha bhara hua option dikhana galat hoga.
  let unit = configuredUnit;
  let rate = num(serviceRate.rate);

  if (configuredUnit === 'either') {
    const acreRate = num(serviceRate.perAcreRate);
    if (chosenUnit === 'acre' && acreRate > 0) {
      unit = 'acre';
      rate = acreRate;
    } else {
      unit = 'hour';
    }
  }

  if (!(rate > 0)) return empty;

  // ── 1. Kaam ka daam ────────────────────────────────────────────────────────
  let workCharge = 0;
  let qtyLabel   = '';

  switch (unit) {
    case 'km': {
      // Chhoti trip pe bhi kam se kam itne km ka charge — gaadi nikaalne ka
      // apna kharcha hota hai.
      const km = Math.max(num(distance), num(categoryConf.minimumKm));
      workCharge = km * rate;
      qtyLabel   = km.toFixed(1) + ' km';
      break;
    }
    case 'acre':
    case 'quintal': {
      const qty = Math.max(num(quantity), num(serviceRate.minimumQuantity, 1));
      workCharge = qty * rate;
      qtyLabel   = qty + ' ' + unit;
      break;
    }
    case 'job':
      workCharge = rate;          // poore kaam ka ek daam
      qtyLabel   = 'poora kaam';
      break;
    case 'hour':
    default: {
      const hrs = Math.max(num(hours), num(serviceRate.minimumHours, 1));
      workCharge = hrs * rate;
      qtyLabel   = hrs + ' ghante';
      break;
    }
  }

  workCharge = Math.round(workCharge);
  lines.push({ label: (serviceRate.label || 'Kaam') + ' (' + qtyLabel + ')', amount: workCharge });

  // ── 2. Site tak aane ka charge ─────────────────────────────────────────────
  // Gaadi jitni door se aayegi utna diesel lagega. `freeArrivalKm` tak muft.
  const travel     = categoryConf.travelCharge || {};
  const freeArrive = num(categoryConf.freeArrivalKm, 5);
  const extraArrive = Math.max(0, num(arrivalKm) - freeArrive);
  let travelCharge = 0;

  if (travel.enabled) {
    travelCharge = num(travel.perKm) > 0
      ? Math.round(extraArrive * num(travel.perKm))
      // Purane records jinme flat amount bhara tha — wo tabhi lagta hai jab
      // gaadi free doori se aage se aa rahi ho.
      : (extraArrive > 0 ? num(travel.amount) : 0);

    if (travelCharge > 0) {
      lines.push({ label: 'Gaadi aane ka charge (' + extraArrive.toFixed(1) + ' km)', amount: travelCharge });
    }
  }

  // ── 3. Waiting ─────────────────────────────────────────────────────────────
  // Khet/site pe driver ka intezaar bhi uska waqt hai.
  const freeWait     = num(categoryConf.freeWaitingMinutes, 15);
  const billableWait = Math.max(0, num(waitMinutes) - freeWait);
  const waitingCharge = (billableWait > 0 && num(categoryConf.waitingPerHour) > 0)
    ? Math.round((billableWait / 60) * num(categoryConf.waitingPerHour))
    : 0;
  if (waitingCharge > 0) {
    lines.push({ label: 'Waiting (' + billableWait + ' min)', amount: waitingCharge });
  }

  // ── 4. Raat ka charge ──────────────────────────────────────────────────────
  const nightPct = num(categoryConf.nightChargePercent);
  const hour     = bookingDate.getHours();
  const isNight  = nightPct > 0 && (hour >= 22 || hour < 6);
  const preNight = workCharge + travelCharge + waitingCharge;
  const nightCharge = isNight ? Math.round(preNight * nightPct / 100) : 0;
  if (nightCharge > 0) {
    lines.push({ label: 'Night Charge (' + nightPct + '%)', amount: nightCharge });
  }

  // ── 5. Total ───────────────────────────────────────────────────────────────
  let fare = preNight + nightCharge;
  fare = Math.max(fare, num(categoryConf.minimumFare));
  fare = Math.ceil(fare / 10) * 10;

  // Category ka apna commission ho to wahi, warna platform ka global.
  const catComm = categoryConf.commissionPercent;
  const commissionPct = (catComm !== null && catComm !== undefined && catComm !== '')
    ? num(catComm)
    : num(globalCommission);
  const commission = Math.round(fare * commissionPct / 100);

  return {
    fare,
    currency: '₹',
    rateType: unit === 'km' ? 'per_km' : unit === 'hour' ? 'hourly' : unit,
    unit,
    rate,
    breakdown: lines,
    travelCharge,
    waitingCharge,
    nightCharge,
    nightChargeApplied: nightCharge > 0,
    commissionPercent: commissionPct,
    platformFee: commission,
    driverEarnings: fare - commission,
    label: serviceRate.label,
  };
};

// Wedding car ka kiraya.
//
// Shaadi ki gaadi per-km nahi chalti — log "8 ghante / 80 km" jaisa package
// lete hain. Package ke andar sab shaamil; uske bahar jaane par hi extra
// lagta hai. Package ke daam code mein nahi hain, admin banata hai.
exports.calculateWeddingFare = (packageId, options = {}) => {
  const {
    packages = [],
    hours = 0,
    distance = 0,
    decoration = false,
    bookingDate = new Date(),
    globalCommission = 0,
  } = options;

  const pkg = packages.find((p) => p.id === packageId && p.isActive !== false);
  if (!pkg) return { fare: 0, breakdown: [], found: false };

  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const lines = [];

  const base = num(pkg.price);
  lines.push({
    label: (pkg.name || 'Package') + ' (' + num(pkg.includedHours) + ' ghante / ' + num(pkg.includedKm) + ' km)',
    amount: base,
  });

  // Package ke bahar gaya to hi extra.
  const extraHours = Math.max(0, num(hours) - num(pkg.includedHours));
  const extraKm    = Math.max(0, num(distance) - num(pkg.includedKm));
  const hourCharge = Math.round(extraHours * num(pkg.extraHourCharge));
  const kmCharge   = Math.round(extraKm * num(pkg.extraKmCharge));

  if (hourCharge > 0) lines.push({ label: 'Extra ' + extraHours.toFixed(1) + ' ghante', amount: hourCharge });
  if (kmCharge > 0)   lines.push({ label: 'Extra ' + extraKm.toFixed(1) + ' km',        amount: kmCharge });

  // Sajawat tabhi jab admin ne chaalu ki ho AUR customer ne maangi ho.
  const dec = pkg.decorationCharge || {};
  const decorationCharge = (dec.enabled && decoration) ? num(dec.amount) : 0;
  if (decorationCharge > 0) lines.push({ label: 'Sajawat (Decoration)', amount: decorationCharge });

  const preNight = base + hourCharge + kmCharge + decorationCharge;
  const nightPct = num(pkg.nightChargePercent);
  const hour     = bookingDate.getHours();
  const isNight  = nightPct > 0 && (hour >= 22 || hour < 6);
  const nightCharge = isNight ? Math.round(preNight * nightPct / 100) : 0;
  if (nightCharge > 0) lines.push({ label: 'Night Charge (' + nightPct + '%)', amount: nightCharge });

  const fare = Math.ceil((preNight + nightCharge) / 10) * 10;

  const pkgComm = pkg.commissionPercent;
  const commissionPct = (pkgComm !== null && pkgComm !== undefined && pkgComm !== '')
    ? num(pkgComm)
    : num(globalCommission);
  const commission = Math.round(fare * commissionPct / 100);

  return {
    found: true,
    fare,
    currency: '₹',
    pricingType: 'package',
    packageId: pkg.id,
    packageName: pkg.name,
    category: pkg.category,
    breakdown: lines,
    nightCharge,
    nightChargeApplied: nightCharge > 0,
    commissionPercent: commissionPct,
    platformFee: commission,
    driverEarnings: fare - commission,
  };
};

// Customer ko sirf wahi services dikhni chahiye jinka rate admin ne set kiya hai.
// Thresher/Harvester defaults mein rate 0 aur isActive false hain — kyunki inka
// bhaav har gaon aur har fasal mein alag hota hai. Agar ye list mein aa jaayein
// to customer ko "0 rupaye" wali service dikhegi aur booking pe jhagda hoga.
// `includeInactive` admin dashboard ke liye hai — wahan sab dikhna chahiye.
exports.getServicesForVehicle = (vehicleType, hourlyRatesConfig = DEFAULT_HOURLY_RATES, includeInactive = false) => {
  const categories = hourlyRatesConfig?.[vehicleType];
  if (!categories) return null;
  if (includeInactive) return categories;

  return categories
    .map((c) => ({
      ...(typeof c.toObject === 'function' ? c.toObject() : c),
      sub: (c.sub || []).filter((sv) => sv.isActive !== false && Number(sv.rate) > 0),
    }))
    .filter((c) => c.sub.length > 0);
};

exports.DEFAULT_HOURLY_RATES = DEFAULT_HOURLY_RATES;
