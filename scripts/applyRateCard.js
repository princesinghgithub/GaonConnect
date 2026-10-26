// Rate Card (GaonConnect-Rate-Card.pdf ke "sujhaav") ek saath database mein.
//
// Kya karta hai:
//   • Bike/Auto Rapido jaisa — har minute ka rate, 3 min muft intezaar
//   • Car (Mini/Sedan/SUV, AC), Tempo ke rate
//   • Tractor/JCB ke kaam ke rate; Transport ke kaam (fasal/ret/saamaan) ka
//     unit "km" — purane data mein unit khaali tha aur ye ghante ke hisaab
//     se lag rahe the (₹20 prati ghanta!)
//   • Tractor/JCB category settings — 15 min billing step, aane ka charge,
//     intezaar, raat
//   • Harvester ki fasalon ke rate
//
// Kya NAHI karta: koi seva/kaam chalu ya band nahi karta (naye kaam ka rate
// bharta hai, chalu admin dashboard se karega), commission nahi chhoota,
// koi naya kaam nahi jodta (wo scripts/addToolServices.js).
//
// Chalane ka tareeka:
//   node scripts/applyRateCard.js                  (test DB — sirf dikhata hai)
//   node scripts/applyRateCard.js --apply          (test DB — likhta hai)
//   node scripts/applyRateCard.js --live           (LIVE DB — sirf dikhata hai)
//   node scripts/applyRateCard.js --live --apply   (LIVE DB — likhta hai)
//
// Dobara chalane se kuch nahi bigadta — wahi values dobara likhi jaati hain.

const path = require('path');
const dotenv = require('dotenv');

const LIVE  = process.argv.includes('--live');
const APPLY = process.argv.includes('--apply');
// --live par .env.local (test DB) nahi padhte — seedha .env (live)
if (!LIVE) dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Setting  = require('../models/Setting');
const VARIANT_DEFAULTS = require('../config/vehicleVariantDefaults');

// ── Sawari ───────────────────────────────────────────────────────────────────
const VEHICLE = {
  bike:  { minimumFare: 20, includedKm: 2, perKmRate: 5, perMinuteRate: 0.5, freeWaitingMinutes: 3, waitingPerMinute: 1, longPickupPerKm: 2, cancellationFee: 10 },
  auto:  { minimumFare: 30, includedKm: 2, perKmRate: 12, perMinuteRate: 1, freeWaitingMinutes: 3, waitingPerMinute: 1.5, longPickupPerKm: 3 },
  car:   { minimumFare: 70, includedKm: 2, perKmRate: 15, perMinuteRate: 1.5, freeWaitingMinutes: 5, waitingPerMinute: 2, longPickupPerKm: 4, cancellationFee: 30 },
  tempo: { minimumFare: 150, includedKm: 2, perKmRate: 20, freeWaitingMinutes: 15, waitingPerMinute: 0, waitingPerHour: 100, longPickupPerKm: 5, cancellationFee: 50 },
};
// Car ki category — Mini car ka apna rate (null), Sedan/SUV alag; AC +₹2/km
const CAR_VARIANTS = {
  hatchback: { minimumFare: null, perKmRate: null, acPerKm: 2 },
  sedan:     { minimumFare: 90,  perKmRate: 17, acPerKm: 2 },
  suv:       { minimumFare: 120, perKmRate: 21, acPerKm: 2 },
};

// ── Kaam (₹; unit ke saath) ──────────────────────────────────────────────────
const SUBS = {
  tractor: {
    ploughing: { rate: 800 }, rotavator: { rate: 1000 }, seed_drill: { rate: 800 }, harvesting: { rate: 1200 },
    cultivator: { rate: 800 }, land_leveling: { rate: 900 }, threshing: { rate: 1000 },
    straw_reaper: { rate: 1000 }, baling: { rate: 1200 },
    spray: { rate: 500 }, grass_cutting: { rate: 600 }, cleaning: { rate: 500 },
    tanker: { rate: 700 }, irrigation: { rate: 600 },
    post_hole: { rate: 800 }, custom_request: { rate: 800 },
    // Galat unit wale — km
    crop_transport: { rate: 20, unit: 'km' }, sand_brick: { rate: 25, unit: 'km' }, goods: { rate: 22, unit: 'km' },
  },
  jcb: {
    digging: { rate: 1500 }, leveling: { rate: 1200 }, loading: { rate: 1300 }, construction: { rate: 1400 },
    breaking: { rate: 1800 }, drilling: { rate: 1600 }, custom_request: { rate: 1500 },
  },
  harvester: {
    wheat: { rate: 2000, unit: 'acre' }, paddy: { rate: 2400, unit: 'acre' }, soybean: { rate: 1800, unit: 'acre' },
    gram: { rate: 1800, unit: 'acre' }, other: { rate: 2000, unit: 'acre' },
  },
};
const CATEGORY = {
  tractor:   { billingStepMinutes: 15, freeArrivalKm: 5, travelCharge: { enabled: true, perKm: 20 }, freeWaitingMinutes: 15, waitingPerHour: 300, nightChargePercent: 10 },
  jcb:       { billingStepMinutes: 15, freeArrivalKm: 5, travelCharge: { enabled: true, perKm: 40 }, freeWaitingMinutes: 15, waitingPerHour: 500, nightChargePercent: 10 },
  harvester: { nightChargePercent: 10 },
};
// Transport category: km wala kaam — kam se kam 5 km, aur category bhi per_km
const TRANSPORT_IDS = ['transport'];

const plain = (x) => (x && typeof x.toObject === 'function' ? x.toObject() : JSON.parse(JSON.stringify(x || {})));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) { console.error('MONGO_URI nahi mila'); process.exit(1); }
  await mongoose.connect(uri);
  const db = mongoose.connection.name;
  console.log(`📦 Database: ${db}  ${LIVE ? '(LIVE)' : '(test)'}  ${APPLY ? '— LIKHEGA' : '— sirf dikhayega'}`);
  if (LIVE && db.endsWith('_dev')) { console.error('--live diya par database test wala hai — ruk gaye'); process.exit(1); }
  if (!LIVE && !db.endsWith('_dev')) { console.error('Bina --live ke live database mila (.env.local nahi?) — ruk gaye'); process.exit(1); }

  const s = await Setting.findOne();
  if (!s) { console.error('Setting document nahi mila'); process.exit(1); }
  const changes = [];

  // ── Sawari ──
  for (const [type, fields] of Object.entries(VEHICLE)) {
    const cur = s.vehicleRates.get(type);
    if (!cur) { changes.push(`(!) ${type}: rate card hi nahi — chhoda`); continue; }
    const next = plain(cur);
    for (const [k, v] of Object.entries(fields)) {
      if (next[k] !== v) { changes.push(`${type}: ${k} ${next[k] ?? '—'} → ${v}`); next[k] = v; }
    }
    if (type === 'car') {
      const base = Array.isArray(next.variants) && next.variants.length ? next.variants : plain(VARIANT_DEFAULTS.car);
      next.variants = base.map((v) => {
        const o = CAR_VARIANTS[v.id];
        if (!o) return v;
        const nv = { ...v, ...o };
        if (!same(v, nv)) changes.push(`car › ${v.label || v.id}: min ${v.minimumFare ?? 'car'} → ${o.minimumFare ?? 'car'}, km ${v.perKmRate ?? 'car'} → ${o.perKmRate ?? 'car'}, AC +${v.acPerKm ?? 0} → +${o.acPerKm}/km`);
        return nv;
      });
    }
    s.vehicleRates.set(type, next);
  }

  // ── Kaam ──
  for (const [type, subs] of Object.entries(SUBS)) {
    const cats = (s.hourlyRates.get(type) || []).map(plain);
    if (!cats.length) { changes.push(`(!) ${type}: koi kaam nahi — chhoda`); continue; }
    for (const cat of cats) {
      const cs = { ...(CATEGORY[type] || {}) };
      const isTransport = TRANSPORT_IDS.includes(cat.id);
      if (isTransport) { cs.minimumKm = 5; cs.pricingType = 'per_km'; }
      for (const [k, v] of Object.entries(cs)) {
        const curV = k === 'travelCharge' ? { enabled: !!cat.travelCharge?.enabled, perKm: Number(cat.travelCharge?.perKm) || 0 } : cat[k];
        if (!same(curV, v)) {
          changes.push(`${type} › ${cat.label}: ${k} ${JSON.stringify(curV ?? '—')} → ${JSON.stringify(v)}`);
          cat[k] = k === 'travelCharge' ? { ...(cat.travelCharge || {}), ...v } : v;
        }
      }
      for (const sub of cat.sub || []) {
        const want = subs[sub.id];
        if (!want) continue;
        const unitNow = sub.unit || '(khaali→ghanta)';
        const parts = [];
        if (Number(sub.rate) !== want.rate) parts.push(`₹${sub.rate} → ₹${want.rate}`);
        if (want.unit && sub.unit !== want.unit) parts.push(`unit ${unitNow} → ${want.unit}`);
        if (parts.length) {
          changes.push(`${type} › ${cat.label} › ${sub.label}: ${parts.join(', ')}${sub.isActive === false ? '  (band hai — dashboard se chalu karein)' : ''}`);
          sub.rate = want.rate;
          if (want.unit) sub.unit = want.unit;
        }
      }
    }
    s.hourlyRates.set(type, cats);
  }

  if (!changes.length) console.log('Sab pehle se sahi hai — kuch badalna nahi pada');
  else { console.log(`\n${changes.length} badlav:`); changes.forEach((c) => console.log('  •', c)); }

  if (APPLY && changes.length) {
    s.markModified('vehicleRates'); s.markModified('hourlyRates');
    await s.save();
    try { await require('../utils/dynamicFare').invalidateSettingsCache(); } catch {}
    console.log('\n✅ Likh diya. Naya kiraya ~5 minute mein apps aur website par.');
  } else if (!APPLY) {
    console.log('\n(sirf dikhaya — likhne ke liye --apply jodein)');
  }
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
