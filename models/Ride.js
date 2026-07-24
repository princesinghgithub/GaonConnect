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

    vehicleType: {
      type: String,
      required: true,
      enum: ["auto", "bike", "car", "tractor", "tempo", "truck", "jcb", "ambulance", "wedding"],
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

module.exports = mongoose.model("Ride", RideSchema);
