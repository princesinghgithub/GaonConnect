const mongoose = require('mongoose');
const HOURLY_RATE_DEFAULTS = require('../config/hourlyRatesDefaults');

// ─── Per-vehicle rate structure ───────────────────────────────────────────────
const vehicleRateSchema = new mongoose.Schema({
  // ─── Distance pricing ──────────────────────────────────────────────────────
  // Model: minimumFare `includedKm` tak cover karta hai; uske aage har km pe
  // perKmRate. Pehle `baseFare + km*rate` (floor minimumFare) tha — us model
  // mein chhoti ride pe customer minimum se kam de deta tha aur driver ka
  // pickup tak ka petrol nikalta hi nahi tha.
  //
  // baseFare purane documents ke liye rakha hai (migration ke bina load ho
  // jaayein) — naya calculator ise use nahi karta.
  baseFare:    { type: Number, default: 0 },
  minimumFare: { type: Number, required: true },
  includedKm:  { type: Number, default: 2 },
  perKmRate:   { type: Number, required: true },

  // ─── Per-vehicle charges ───────────────────────────────────────────────────
  // Pehle waiting/cancellation poore platform ke liye ek hi thi. Bike aur JCB
  // pe ek hi waiting rate lagana galat hai — unki lagat alag hai.
  freeWaitingMinutes: { type: Number, default: 5 },
  waitingPerMinute:   { type: Number, default: 1 },
  /** Goods/tempo per-minute ke bajaye per-hour charge karte hain. */
  waitingPerHour:     { type: Number, default: 0 },

  /** Driver customer se itne km door tak muft aata hai. */
  freePickupKm:       { type: Number, default: 3 },
  /** Usse zyada door ho to har extra km ka charge. */
  longPickupPerKm:    { type: Number, default: 0 },

  /** Raat ka charge — percent mein (10 = 10% extra). */
  nightChargePercent: { type: Number, default: 10 },

  /** Driver ke pahunchne ke baad cancel karne par. */
  cancellationFee:    { type: Number, default: 0 },

  /** Per-vehicle commission. Khaali chhodo to global commission lagta hai. */
  commissionPercent:  { type: Number, default: null },

  /** Fuel adjustment kis eendhan pe lagega. */
  fuelType: { type: String, enum: ['petrol', 'diesel', 'cng', 'electric'], default: 'petrol' },

  /**
   * Is vehicle ka kiraya kaise banta hai:
   *   distance   — minimumFare + includedKm + perKm  (bike, auto, cab, tempo)
   *   hourly     — hourlyRates se (tractor farming, JCB)
   *   per_acre   — hourlyRates se (harvester)
   *   package    — weddingPackages se (wedding car)
   * `hourly`/`per_acre`/`package` wale vehicles ka distance fare nahi banta.
   */
  pricingType: {
    type: String,
    enum: ['distance', 'hourly', 'per_acre', 'per_quintal', 'package', 'custom'],
    default: 'distance',
  },

  /** Goods/tempo ke optional extras — admin on/off kar sakta hai. */
  extras: {
    loading:   { enabled: { type: Boolean, default: false }, amount: { type: Number, default: 0 } },
    unloading: { enabled: { type: Boolean, default: false }, amount: { type: Number, default: 0 } },
    helper:    { enabled: { type: Boolean, default: false }, amount: { type: Number, default: 0 } },
  },

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
// Rate card ke exact numbers. Ye sirf pehli baar Setting document banane ke
// liye hain — uske baad admin dashboard se badalte hain, code se nahi.
//
// Har rate ka aadhar: customer ke liye kiraya waajib rahe AUR driver ka petrol,
// maintenance aur waqt nikal aaye. Sirf Uber/Rapido se sasta dikhne ke liye
// rate neeche nahi rakhe gaye.
const DEFAULT_VEHICLE_RATES = {
  bike: {
    label: 'Bike Taxi', icon: '🏍️', pricingType: 'distance', fuelType: 'petrol',
    minimumFare: 30, includedKm: 2, perKmRate: 15,
    freeWaitingMinutes: 5, waitingPerMinute: 1,
    freePickupKm: 3, longPickupPerKm: 3,
    nightChargePercent: 10, cancellationFee: 10,
  },
  auto: {
    label: 'Auto Rickshaw', icon: '🛺', pricingType: 'distance', fuelType: 'cng',
    minimumFare: 50, includedKm: 2, perKmRate: 16,
    freeWaitingMinutes: 5, waitingPerMinute: 1.5,
    freePickupKm: 3, longPickupPerKm: 4,
    nightChargePercent: 10, cancellationFee: 20,
  },
  erickshaw: {
    label: 'E-Rickshaw', icon: '🛺', pricingType: 'distance', fuelType: 'electric',
    minimumFare: 40, includedKm: 2, perKmRate: 19,
    freeWaitingMinutes: 5, waitingPerMinute: 1,
    freePickupKm: 3, longPickupPerKm: 3,
    nightChargePercent: 10, cancellationFee: 15,
  },
  car: {
    label: 'Car / Cab', icon: '🚗', pricingType: 'distance', fuelType: 'petrol',
    minimumFare: 80, includedKm: 3, perKmRate: 14,
    freeWaitingMinutes: 5, waitingPerMinute: 2,
    freePickupKm: 3, longPickupPerKm: 5,
    nightChargePercent: 10, cancellationFee: 30,
  },

  // Goods aur tempo passenger vehicle nahi hain — inka waiting per-hour hai
  // (loading/unloading mein ghanta lag jaata hai, minute nahi).
  goods: {
    label: 'Goods Transport', icon: '🚛', pricingType: 'distance', fuelType: 'diesel',
    minimumFare: 150, includedKm: 3, perKmRate: 20,
    freeWaitingMinutes: 15, waitingPerMinute: 0, waitingPerHour: 100,
    freePickupKm: 3, longPickupPerKm: 0,
    nightChargePercent: 10, cancellationFee: 0,
    extras: {
      loading:   { enabled: false, amount: 0 },
      unloading: { enabled: false, amount: 0 },
      helper:    { enabled: false, amount: 0 },
    },
  },
  tempo: {
    label: 'Tempo / Pickup', icon: '🚐', pricingType: 'distance', fuelType: 'diesel',
    minimumFare: 150, includedKm: 3, perKmRate: 18,
    freeWaitingMinutes: 15, waitingPerMinute: 0, waitingPerHour: 100,
    freePickupKm: 3, longPickupPerKm: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },

  // Ye per-km nahi chalte — inka kiraya hourlyRates/packages se banta hai.
  tractor: {
    label: 'Tractor', icon: '🚜', pricingType: 'hourly', fuelType: 'diesel',
    minimumFare: 0, includedKm: 0, perKmRate: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },
  jcb: {
    label: 'JCB / Excavator', icon: '🏗️', pricingType: 'hourly', fuelType: 'diesel',
    minimumFare: 0, includedKm: 0, perKmRate: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },
  thresher: {
    label: 'Thresher', icon: '🌾', pricingType: 'hourly', fuelType: 'diesel',
    minimumFare: 0, includedKm: 0, perKmRate: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },
  harvester: {
    label: 'Harvester', icon: '🌾', pricingType: 'per_acre', fuelType: 'diesel',
    minimumFare: 0, includedKm: 0, perKmRate: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },
  wedding: {
    label: 'Wedding Car', icon: '💐', pricingType: 'package', fuelType: 'petrol',
    minimumFare: 0, includedKm: 0, perKmRate: 0,
    nightChargePercent: 10, cancellationFee: 0,
  },

  ambulance: {
    label: 'Ambulance', icon: '🚑', pricingType: 'distance', fuelType: 'diesel',
    minimumFare: 150, includedKm: 3, perKmRate: 18,
    freeWaitingMinutes: 10, waitingPerMinute: 0,
    freePickupKm: 5, longPickupPerKm: 0,
    nightChargePercent: 0, cancellationFee: 0,
  },
};

// ─── Tractor/JCB Hourly (or per-km) Service Rates ─────────────────────────────
const hourlySubServiceSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  label:        { type: String, required: true },
  rate:         { type: Number, required: true },
  minimumHours: { type: Number, default: 1 },

  // Thresher/Harvester per acre ya per quintal chalte hain, ghante se nahi.
  // Rate wahi field hai; unit yahan se tay hota hai.
  /**
   * `either` ka matlab: customer khud chunega ki ghante se karana hai ya acre
   * se. Aise mein `rate` per-ghanta hai aur `perAcreRate` per-acre — dono
   * bhare hone chahiye, warna customer ko aadha option dikhega.
   */
  unit:            { type: String, enum: ['hour', 'acre', 'quintal', 'km', 'job', 'either'], default: 'hour' },
  minimumQuantity: { type: Number, default: 1 },

  /** Per-acre bhi allow ho to yahan rate do — customer ko dono option milte hain. */
  perAcreRate:     { type: Number, default: 0 },

  isActive:        { type: Boolean, default: true },
}, { _id: false });

const hourlyCategorySchema = new mongoose.Schema({
  id:          { type: String, required: true },
  label:       { type: String, required: true },
  emoji:       { type: String, default: '' },
  pricingType: {
    type: String,
    enum: ['hourly', 'per_km', 'per_acre', 'per_quintal', 'fixed'],
    default: 'hourly',
  },

  /**
   * JCB/tractor ko site tak laane ka charge. Gaadi jitni door se aayegi utna
   * diesel lagega, isliye `perKm` asli field hai — `amount` sirf un purane
   * records ke liye hai jinme flat charge bhara tha.
   * `freeArrivalKm` tak kuch nahi lagta.
   */
  travelCharge: {
    enabled: { type: Boolean, default: false },
    perKm:   { type: Number,  default: 0 },
    amount:  { type: Number,  default: 0 },
  },
  freeArrivalKm: { type: Number, default: 5 },

  /**
   * Is category ka kam se kam kiraya. Pehle per-km wale kaam pe ₹150 ka
   * minimum code mein likha hua tha — admin use badal hi nahi sakta tha.
   * Default 0 hai: jab tak admin na rakhe, koi minimum nahi lagta.
   */
  minimumFare:   { type: Number, default: 0 },
  /** Kam se kam itne km ka charge lagega, chahe trip usse chhoti ho. */
  minimumKm:     { type: Number, default: 0 },

  /**
   * Waiting, raat aur commission — ye teeno pehle sirf passenger gaadiyon ke
   * rate card mein the. Matlab tractor/JCB ka driver raat ko kaam kare ya
   * ghanton khada rahe, use ek rupaya extra nahi milta tha.
   */
  freeWaitingMinutes: { type: Number, default: 15 },
  waitingPerHour:     { type: Number, default: 0 },
  nightChargePercent: { type: Number, default: 0 },
  /** null = platform ka global commission use karo. */
  commissionPercent:  { type: Number, default: null },

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
  // Spec: launch pe aggressive surge nahi. Night charge ab per-vehicle percent
  // hai (vehicleRates.nightChargePercent), isliye yahan sab default OFF hai.
  // Future ke liye structure padi rehti hai.
  surge: {
    enabled: { type: Boolean, default: false },
    // Peak hours multiplier (rush hour)
    peakHours: {
      enabled:    { type: Boolean, default: false },
      multiplier: { type: Number,  default: 1.2  },  // 20% extra
      // Format: [{ from: 8, to: 10 }, { from: 17, to: 20 }]
      slots: {
        type: [{ from: Number, to: Number }],
        default: [{ from: 8, to: 10 }, { from: 17, to: 20 }],
      },
    },
    // Night charges
    nightCharge: {
      enabled:    { type: Boolean, default: false },
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
  // ─── Wedding Car Packages ────────────────────────────────────────────────────
  // Wedding car per-km nahi chalti — log ghanton ke liye gaadi lete hain.
  // Isliye package based: itne ghante + itne km ka ek daam, uske aage extra.
  // Daam yahan hardcode nahi hain, admin har category ke liye set karta hai.
  weddingPackages: {
    type: [{
      id:              { type: String, required: true },
      category:        { type: String, required: true },  // sedan, ertiga, innova, suv, luxury
      name:            { type: String, required: true },  // "8 Hours / 80 KM"
      includedHours:   { type: Number, default: 0 },
      includedKm:      { type: Number, default: 0 },
      price:           { type: Number, required: true },
      extraKmCharge:   { type: Number, default: 0 },
      extraHourCharge: { type: Number, default: 0 },
      nightChargePercent: { type: Number, default: 0 },
      decorationCharge:   { enabled: { type: Boolean, default: false }, amount: { type: Number, default: 0 } },
      commissionPercent:  { type: Number, default: null },
      isActive:        { type: Boolean, default: true },
    }],
    default: [],
  },

  // ─── Fuel / Diesel Price Protection ──────────────────────────────────────────
  // Petrol-diesel mehnga hone par driver ka nuksan na ho, par customer par bhi
  // ekdum bojh na aaye. Admin reference price ke saamne aaj ka price daalta hai;
  // farak ka asar fare pe padta hai, par maxAdjustmentPercent se zyada kabhi nahi.
  //
  // Fuel price ki koi automatic API nahi lagayi — spec ke mutabik admin khud
  // update karega, taaki daam kabhi apne aap na uchhal jaayein.
  fuelAdjustment: {
    enabled:               { type: Boolean, default: false },
    petrolReferencePrice:  { type: Number,  default: 0 },
    dieselReferencePrice:  { type: Number,  default: 0 },
    currentPetrolPrice:    { type: Number,  default: 0 },
    currentDieselPrice:    { type: Number,  default: 0 },
    /** Fare kitna badal sakta hai, zyada se zyada. Yahi customer ki suraksha hai. */
    maxAdjustmentPercent:  { type: Number,  default: 5 },
    effectiveDate:         { type: Date,    default: null },
  },

  // ─── Location-based pricing ──────────────────────────────────────────────────
  // Poore India ke liye ek rate theek nahi — Rewa aur Gurgaon ka bike rate alag
  // hona chahiye. Abhi sirf dhaancha rakha hai: `overrides` mein city/district
  // ke hisaab se vehicleRates ke kuch fields overwrite ho sakte hain.
  // Khaali hai to sab jagah default rate hi chalta hai.
  locationPricing: {
    enabled:   { type: Boolean, default: false },
    /** { "rewa": { bike: { perKmRate: 14 } }, "gurgaon": { bike: { perKmRate: 18 } } } */
    overrides: { type: Map, of: mongoose.Schema.Types.Mixed, default: () => new Map() },
  },

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
