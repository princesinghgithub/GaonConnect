const mongoose = require('mongoose');
const HOURLY_RATE_DEFAULTS = require('../config/hourlyRatesDefaults');

// ─── Per-vehicle rate structure ───────────────────────────────────────────────
const vehicleRateSchema = new mongoose.Schema({
  baseFare:    { type: Number, required: true },
  perKmRate:   { type: Number, required: true },
  minimumFare: { type: Number, required: true },
  isActive:    { type: Boolean, default: true  },
  label:       { type: String, default: '' },
  /** Emoji fallback — jab tak asli photo na ho. */
  icon:        { type: String, default: '' },
  /**
   * Vehicle ki asli photo (Cloudinary URL). Emoji se kaam chal jaata hai par
   * kuch vehicles ke liye Unicode mein theek emoji hai hi nahi — JCB iska
   * saaf example hai: 🚧 road-work ka board hai, JCB nahi. Photo yahan set
   * karne par dono apps mein turant dikhti hai, app release ki zarurat nahi.
   */
  image:       { type: String, default: '' },
}, { _id: false });

// Seed defaults for the original 9 vehicle types — vehicleRates/hourlyRates
// are Maps now (admin can add/delete keys from the dashboard), these are
// just the starting values for a fresh Setting document.
const DEFAULT_VEHICLE_RATES = {
  bike:      { baseFare: 20,  perKmRate: 8,  minimumFare: 25,   label: 'Bike',      icon: '🏍️' },
  auto:      { baseFare: 25,  perKmRate: 12, minimumFare: 30,   label: 'Auto',      icon: '🛺' },
  car:       { baseFare: 50,  perKmRate: 15, minimumFare: 70,   label: 'Car',       icon: '🚗' },
  tractor:   { baseFare: 100, perKmRate: 25, minimumFare: 150,  label: 'Tractor',   icon: '🚜' },
  tempo:     { baseFare: 80,  perKmRate: 20, minimumFare: 120,  label: 'Tempo / Pickup',     icon: '🚐' },
  truck:     { baseFare: 150, perKmRate: 30, minimumFare: 200,  label: 'Truck',     icon: '🚛' },
  jcb:       { baseFare: 200, perKmRate: 40, minimumFare: 300,  label: 'JCB',       icon: '🏗️' },
  ambulance: { baseFare: 100, perKmRate: 18, minimumFare: 150,  label: 'Ambulance', icon: '🚑' },
  wedding:   { baseFare: 500, perKmRate: 35, minimumFare: 1500, label: 'Wedding',   icon: '💐' },
};

// ─── Tractor/JCB Hourly (or per-km) Service Rates ─────────────────────────────
const hourlySubServiceSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  label:        { type: String, required: true },
  rate:         { type: Number, required: true },
  minimumHours: { type: Number, default: 1 },
}, { _id: false });

const hourlyCategorySchema = new mongoose.Schema({
  id:          { type: String, required: true },
  label:       { type: String, required: true },
  emoji:       { type: String, default: '' },
  pricingType: { type: String, enum: ['hourly', 'per_km'], default: 'hourly' },
  sub:         { type: [hourlySubServiceSchema], default: [] },
}, { _id: false });

const SettingSchema = new mongoose.Schema({

  // ─── Commission ─────────────────────────────────────────────────────────────
  commission: {
    percentage: { type: Number, default: 0 },  // % platform lega (abhi 0 — no commission)
    type:       { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  },

  // ─── Vehicle-wise Base Rates ─────────────────────────────────────────────────
  // Map, not fixed keys — admin dashboard can add/delete vehicle types at
  // runtime (POST/DELETE /admin/vehicle-types) without a schema change.
  // Stored BSON shape ({bike: {...}, auto: {...}}) is identical to the old
  // fixed-key subdocument, so existing documents load with no migration.
  vehicleRates: {
    type: Map,
    of: vehicleRateSchema,
    default: () => new Map(Object.entries(DEFAULT_VEHICLE_RATES)),
  },

  // ─── Hourly Service Rates (admin-editable, Kaam ka Prakar → Service) ─────────
  // Map keyed by vehicleType — only types that support hourly billing
  // (tractor/jcb today) have an entry; a type with no key here is
  // distance-only. New types get an entry via createVehicleType.
  hourlyRates: {
    type: Map,
    of: [hourlyCategorySchema],
    default: () => new Map(Object.entries(HOURLY_RATE_DEFAULTS)),
  },

  // ─── Surge Pricing ───────────────────────────────────────────────────────────
  surge: {
    enabled: { type: Boolean, default: true },
    // Peak hours multiplier (rush hour)
    peakHours: {
      enabled:    { type: Boolean, default: true },
      multiplier: { type: Number,  default: 1.2  },  // 20% extra
      // Format: [{ from: 8, to: 10 }, { from: 17, to: 20 }]
      slots: {
        type: [{ from: Number, to: Number }],
        default: [{ from: 8, to: 10 }, { from: 17, to: 20 }],
      },
    },
    // Night charges
    nightCharge: {
      enabled:    { type: Boolean, default: true },
      multiplier: { type: Number,  default: 1.25 }, // 25% extra
      fromHour:   { type: Number,  default: 22   }, // 10 PM
      toHour:     { type: Number,  default: 6    }, // 6 AM
    },
    // High demand (admin manually set kar sakta hai)
    highDemand: {
      enabled:    { type: Boolean, default: false },
      multiplier: { type: Number,  default: 1.5   },
      reason:     { type: String,  default: ''     }, // e.g. "Festival", "Rain"
    },
    // Max allowed surge multiplier
    maxMultiplier: { type: Number, default: 2.0 },
  },

  // ─── Waiting Charges ─────────────────────────────────────────────────────────
  waiting: {
    enabled:       { type: Boolean, default: true  },
    freeMinutes:   { type: Number,  default: 3     }, // 3 min free
    perMinuteRate: { type: Number,  default: 2     }, // ₹2/min after free period
    maxCharge:     { type: Number,  default: 50    }, // max ₹50
  },

  // ─── Booking / Convenience Fee ───────────────────────────────────────────────
  bookingFee: {
    enabled: { type: Boolean, default: false },
    amount:  { type: Number,  default: 5     }, // ₹5 flat
  },

  // ─── Cancellation Fee ────────────────────────────────────────────────────────
  cancellation: {
    freeWindowMinutes: { type: Number, default: 2  }, // 2 min ke andar free cancel
    customerFee:       { type: Number, default: 20 }, // ₹20
    driverFee:         { type: Number, default: 30 }, // ₹30 agar driver cancel kare
  },

  // ─── General ─────────────────────────────────────────────────────────────────
  // ─── Refer & Earn ────────────────────────────────────────────────────────────
  referral: {
    enabled:        { type: Boolean, default: true },
    referrerReward: { type: Number,  default: 50 },  // jisne refer kiya
    refereeReward:  { type: Number,  default: 50 },  // jo refer hokar aaya
    // Reward pehli COMPLETED ride ke baad milta hai, sign-up pe nahi — warna
    // log fake account bana bana ke wallet bharte rehte.
    rewardOnFirstRide: { type: Boolean, default: true },
  },

  // ─── Driver Incentives ───────────────────────────────────────────────────────
  // Rapido-style daily targets: "aaj itni rides pure karo, itna bonus".
  // Tiers sorted rakhna zaroori nahi — code sabse ooncha pura hua tier chunta hai.
  incentive: {
    enabled: { type: Boolean, default: false },
    daily: {
      type: [{
        rides: { type: Number, required: true },
        bonus: { type: Number, required: true },
      }],
      default: [
        { rides: 5,  bonus: 50  },
        { rides: 10, bonus: 150 },
        { rides: 15, bonus: 300 },
      ],
    },
  },

  general: {
    currency:       { type: String, default: 'INR'            },
    currencySymbol: { type: String, default: '₹'              },
    timezone:       { type: String, default: 'Asia/Kolkata'   },
    supportEmail:   { type: String, default: 'support@gaonconnect.in' },
    supportPhone:   { type: String, default: ''               },
    appVersion:     { type: String, default: '2.0.0'          },
  },

}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
