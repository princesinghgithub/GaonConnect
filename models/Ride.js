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

    // Car ke andar kaunsi category chuni (hatchback / sedan / suv) aur AC
    // chahiye ya nahi. Label bhi saath rakhte hain — admin baad mein category
    // ka naam badal de to purani ride pe wahi dikhe jo customer ne book kiya tha.
    vehicleVariant:      { type: String, default: '', trim: true, lowercase: true },
    vehicleVariantLabel: { type: String, default: '' },
    ac:                  { type: Boolean, default: false },

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

    // Ride poori hone par jo hisaab laga, wahi yahan jam jaata hai. Baad mein
    // admin commission badal de to purani rides ka hisaab nahi badalna
    // chahiye — driver ne jo kamaya, wo kamaya.
    // Acre/quintal wale kaam ki maatra. Ride complete hone par dobara hisaab
    // lagta hai, tab bhi yahi value use hoti hai.
    serviceQuantity:   { type: Number, default: 0 },
    /** "Customer ki marzi" wali service mein usne kya chuna — hour ya acre. */
    chosenUnit:        { type: String, default: '' },

    // Wedding car ka chuna hua package.
    packageId:         { type: String, default: '' },
    packageName:       { type: String, default: '' },
    decoration:        { type: Boolean, default: false },

    // Customer ne kaunse extras maange the. Ride complete hone par dobara
    // hisaab lagta hai, tab bhi yahi list dekhi jaati hai.
    extras: {
      loading:   { type: Boolean, default: false },
      unloading: { type: Boolean, default: false },
      helper:    { type: Boolean, default: false },
    },

    commissionPercent: { type: Number, default: 0 },
    platformFee:       { type: Number, default: 0 },
    driverEarning:     { type: Number, default: 0 },

    // Promo se kitna kam hua. `fare` promo ke BAAD ka hai (customer itna deta
    // hai); driver ki kamai fare + promoDiscount par banti hai — offer platform
    // ka hai, driver ka nahi.
    promoCode:     { type: String, default: '' },
    promoDiscount: { type: Number, default: 0 },

    // Customer ka pichhla baaki jo is ride ke kiraye mein juda hai. `fare`
    // mein ye shaamil hai (customer itna hi deta hai), par driver ki kamai
    // isme se nahi banti. Ride poori hone par ye "bhara hua" ho jaata hai.
    dues: {
      amount:  { type: Number, default: 0 },
      txnIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
      rideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],
    },

    // Raaste mein rukne ki jagah (pickup → stop → drop). Kiraya dono tukdon
    // ki doori jod kar banta hai.
    stops: [{
      _id: false,
      address:   String,
      latitude:  Number,
      longitude: Number,
    }],

    // Customer ne ride ke dauraan drop badalne ko kaha — driver ke haan/na
    // kehne tak yahan rehta hai. Haan par ride ka drop, doori aur kiraya isi
    // se badalte hain.
    pendingDropChange: {
      address:     String,
      latitude:    Number,
      longitude:   Number,
      distance:    Number,
      fare:        Number,
      requestedAt: Date,
    },

    // Customer ne cancel karte waqt driver ki galti batayi ("driver ne cancel
    // karne ko kaha") — admin ko jaanchna hai.
    flaggedForReview: { type: Boolean, default: false },

    // Kaam usi jagah hona hai jahan bulaya gaya (khet jotna, JCB se khudai) —
    // is ride ka koi "drop" nahi hai. Model mein `drop` zaroori field hai,
    // isliye usme pickup hi rakha jaata hai; par apps aur dashboard isi flag
    // se jaante hain ki drop dikhana nahi hai.
    workAtPickup: { type: Boolean, default: false },

    // Kaam tay se zyada nikla — driver ne mauke par extra raashi jodi aur
    // customer ne haan kahi. `fareAdjustment` un sab ka jod hai aur `fare` mein
    // shaamil hai; list isliye ki baad mein pata chale kab, kitna aur kyun.
    fareAdjustment: { type: Number, default: 0 },
    fareAdjustments: [{
      _id: false,
      amount:   Number,
      hours:    Number,
      reason:   String,
      approved: Boolean,
      at:       { type: Date, default: Date.now },
    }],

    // Kaam se pehle aur baad ki photo (tractor / JCB / saamaan) — jhagde ke
    // waqt yahi saboot hota hai.
    workProof: {
      before: { url: String, at: Date },
      after:  { url: String, at: Date },
    },

    // Ride complete hote waqt paisa kahan maana gaya:
    //   'cash'     — driver ke haath mein
    //   'platform' — platform ke paas (online / QR), driver ke wallet mein juda
    // Cash ride baad mein QR se bhari jaaye to 'cash' → 'platform' hota hai,
    // aur ye badlav ek hi baar ho sakta hai (dekho utils/walletOps.js).
    walletSettled: { type: String, enum: ['', 'cash', 'platform'], default: '' },

    // Accept ke waqt driver pickup se kitna door tha aur kitni der mein
    // pahunchna tha. Isi se tay hota hai ki driver "der" kar raha hai ya nahi —
    // der driver ki ho to customer se cancel ka charge nahi liya jaata.
    pickupKmAtAccept: { type: Number, default: 0 },
    pickupEtaMinutes: { type: Number, default: 0 },

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

// Booking mode — distance, hourly ya package (wedding car)
bookingMode: {
  type: String,
  enum: ['distance', 'hourly', 'package'],
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

// Pre-booking — driver pehle se pakka. Status 'scheduled' hi rehta hai par
// `provider` lag jaata hai; samay se pehle cron use 'accepted' (chalu) karta hai.
scheduledAcceptedAt: {
  type: Date,
  default: null
},
// "Kal subah 7 baje" wala yaad-dihani — ek hi baar jaaye
scheduleReminderAt: {
  type: Date,
  default: null
},

// Ghante wale kaam ki ghadi — server par, taaki driver aur customer dono ek
// hi waqt dekhein. Chala hua waqt = abhi − workStartedAt − pausedSeconds
// (aur abhi ruka ho to − (abhi − pausedAt)).
pausedAt: {
  type: Date,
  default: null
},
pausedSeconds: {
  type: Number,
  default: 0
},

// Tractor/JCB booking mein customer ne kya maanga: kaunse upkaran (hal,
// rotavator, breaker…), kam se kam kitne HP ka tractor, aur trolley kaisi.
// Booking sirf usi driver ko jaati hai jiske paas ye sab ho, aur driver ko
// pehle se dikhta hai ki kya leke aana hai.
equipment: {
  type: [String],
  default: undefined
},
// Kaam ke liye zaroori auzaar (koi ek) — booking bante waqt admin ke Rate
// Card niyam se likha jaata hai (utils/vehicleMatch.js requiredEquipment).
serviceEquipment: {
  type: [String],
  default: undefined
},
minHorsepower: {
  type: Number,
  default: 0
},
trolleyType: {
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

    // Driver ke pickup pe pahunchne (arrivedAt) se ride start hone tak ka time.
    // Settings.waiting ke free minutes ke upar jo bacha, uska charge lagta hai.
    // Dono alag store hote hain taaki invoice mein saaf dikha sakein ki kitna
    // wait hua aur uska kitna laga — warna user ko sirf badha hua fare dikhta.
    waitMinutes:   { type: Number, default: 0 },
    waitingCharge: { type: Number, default: 0 },

    // Cancellation fee — free window ke baad cancel karne par lagti hai.
    cancellationFee: { type: Number, default: 0 },

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
