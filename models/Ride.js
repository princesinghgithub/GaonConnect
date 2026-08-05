const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },

    // Jo specific vehicle is ride pe thi — accept karte waqt provider.activeVehicle se set hoti hai
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // Jitne bhi drivers ko is ride ki request bheji gayi thi (socket/FCM) —
    // koi accept kar le to baakiyon ko "ride no longer available" bhejne ke
    // liye chahiye, taaki unki screen se request turant hat jaaye.
    notifiedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider",
      },
    ],

    // Progressive radius-dispatch state (rideController.js dispatchRideStage) —
    // DB mein persist karte hain (na ki sirf in-memory setTimeout se) taaki
    // server restart/redeploy hone par bhi baaki waves (8km/15km/unlimited)
    // kho na jaayein — ek cron job (jobs/scheduledRideJob.js) periodically
    // check karta hai ki kaunsi rides ka agla wave due hai.
    dispatchStageIndex: {
      type: Number,
      default: 0,
    },
    nextDispatchAt: {
      type: Date,
      default: null,
    },

    pickup: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    },

    drop: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    },

    // Vehicle types are admin-managed now (see Setting.vehicleRates) rather
    // than a fixed enum — fareCalculator falls back to 'auto' pricing for any
    // unrecognized type, so this stays a free string.
    vehicleType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    distance: {
      type: Number, // in km
      required: true,
    },

    estimatedDuration: {
      type: Number, // in minutes
      required: true,
    },

    actualDuration: {
      type: Number, // in minutes
    },

    fare: {
      type: Number,
      required: true,
    },

    finalFare: {
      type: Number, // Can be different due to extra charges or discounts
    },

    otp: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "searching",
        "accepted",
        "arrived",
        "started",
        'working',
        "completed",
        "cancelled",
      ],
      default: "searching",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "wallet"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    // Cash ride complete hone ke baad driver app QR dikhata hai — customer
    // kisi bhi UPI app se scan karke pay karta hai (Razorpay QR Codes API)
    razorpayQrCodeId: {
      type: String,
    },

    rating: {
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      driverRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      customerFeedback: String,
      driverFeedback: String,
    },

    cancelledBy: {
      type: String,
      enum: ["customer", "driver", "admin"],
    },

    cancellationReason: String,
    // ═══════════════════════════════════════
// TRACTOR / JCB HOURLY BOOKING FIELDS
// ═══════════════════════════════════════

// Booking mode — distance ya hourly
bookingMode: {
  type: String,
  enum: ['distance', 'hourly'],
  default: 'distance'
},

// Service category — farming, transport, construction etc.
serviceCategory: {
  type: String,
  enum: ['farming', 'transport', 'spraying', 'water', 'construction', 'custom', ''],
  default: ''
},

// Sub-service — ploughing, rotavator, digging etc.
serviceType: {
  type: String,
  default: ''
},

// Hourly booking ke liye
estimatedHours: {
  type: Number,
  default: 0
},

actualHours: {
  type: Number,
  default: 0
},

hourlyRate: {
  type: Number,
  default: 0
},

// Driver ne timer start kiya kab
workStartedAt: {
  type: Date,
  default: null
},

workEndedAt: {
  type: Date,
  default: null
},

// Special note from user
workNote: {
  type: String,
  default: ''
},
    bookingType: {
      type: String,
      enum: ["instant", "scheduled"],
      default: "instant",
    },
    scheduledAt: { type: Date, default: null },
    scheduledNote: { type: String, default: "" },

    requestTime: {
      type: Date,
      default: Date.now,
    },

    // Ride kab 'searching' status mein aayi (instant ride ke liye createRide
    // pe turant, scheduled ride ke liye jab cron job usse activate karta hai).
    // Auto-cancel cutoff isi field se naapa jaata hai, createdAt se nahi —
    // warna scheduled/pre-booked rides turant auto-cancel ho jaati thi.
    searchingSince: Date,
    acceptedAt: Date,
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for otpServiceer queries
RideSchema.index({ customer: 1, createdAt: -1 });
RideSchema.index({ provider: 1, createdAt: -1 });
RideSchema.index({ status: 1 });
// Cron sweep — "status searching + nextDispatchAt due" ko fast dhoondne ke liye
RideSchema.index({ status: 1, nextDispatchAt: 1 });

module.exports = mongoose.model("Ride", RideSchema);
