const mongoose = require('mongoose');

// ─── Per-vehicle rate structure ───────────────────────────────────────────────
const vehicleRateSchema = new mongoose.Schema({
  baseFare:    { type: Number, required: true },
  perKmRate:   { type: Number, required: true },
  minimumFare: { type: Number, required: true },
  isActive:    { type: Boolean, default: true  },
}, { _id: false });

const SettingSchema = new mongoose.Schema({

  // ─── Commission ─────────────────────────────────────────────────────────────
  commission: {
    percentage: { type: Number, default: 15 },  // % platform lega
    type:       { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  },

  // ─── Vehicle-wise Base Rates ─────────────────────────────────────────────────
  vehicleRates: {
    bike:    { type: vehicleRateSchema, default: { baseFare: 20,  perKmRate: 8,  minimumFare: 25  } },
    auto:    { type: vehicleRateSchema, default: { baseFare: 25,  perKmRate: 12, minimumFare: 30  } },
    car:     { type: vehicleRateSchema, default: { baseFare: 50,  perKmRate: 15, minimumFare: 70  } },
    tractor: { type: vehicleRateSchema, default: { baseFare: 100, perKmRate: 25, minimumFare: 150 } },
    tempo:   { type: vehicleRateSchema, default: { baseFare: 80,  perKmRate: 20, minimumFare: 120 } },
    truck:   { type: vehicleRateSchema, default: { baseFare: 150, perKmRate: 30, minimumFare: 200 } },
    jcb:     { type: vehicleRateSchema, default: { baseFare: 200, perKmRate: 40, minimumFare: 300 } },
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
