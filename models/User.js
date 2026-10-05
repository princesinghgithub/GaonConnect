const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Name required hai'],
    trim:     true,
  },
  phone: {
    type:     String,
    required: [true, 'Phone number required hai'],
    unique:   true,
    match:    [/^[0-9]{10}$/, 'Valid 10-digit phone number daalo'],
  },
  email: {
    type:      String,
    trim:      true,
    lowercase: true,
    unique:    true,
    sparse:    true, // null values pe unique conflict nahi
  },
  city: {
    type: String,
    trim: true,
  },
  role: {
    type:    String,
    enum:    ['customer', 'provider', 'admin'],
    default: 'customer',
  },
  // Dual role support — same person customer + provider dono ho sakta hai
  roles: {
    type:    [String],
    enum:    ['customer', 'provider', 'admin'],
    default: ['customer'],
  },
  wallet: {
    type:    Number,
    default: 0,
  },
  profilePhoto: {
    type:    String,
    default: '',
  },
  isVerified: {
    type:    Boolean,
    default: false,
  },
  isBlocked: {
    type:    Boolean,
    default: false,
  },
  fcmToken: {
    type:    String,
    default: null,
  },
  // Driver customer ko jo rating deta hai uska average — Rapido jaisa, nayi
  // booking ki request par driver ko dikhta hai. count 0 = naya customer.
  rating: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },
  // ─── Emergency contacts ─────────────────────────────────────────────────────
  // SOS dabane par sirf 112 dial hota tha aur admin ko alert jaata tha — kisi
  // apne ko khabar nahi jaati thi. Yeh contacts SOS response mein wapas aate
  // hain taaki app turant WhatsApp pe live location bhej sake (WhatsApp deep
  // link bina kisi SMS gateway ke chalta hai, aur DLT template ka intezaar
  // nahi karna padta).
  emergencyContacts: {
    type: [{
      name:     { type: String, required: true, trim: true },
      phone:    { type: String, required: true, trim: true },
      relation: { type: String, default: '', trim: true },
    }],
    default: [],
    // Teen se zyada rakhne ka matlab nahi — SOS ke waqt sabko message bhejna
    // hai, aur lambi list bhejne mein der lagti hai.
    validate: [(v) => v.length <= 3, 'Zyada se zyada 3 emergency contacts rakh sakte hain'],
  },

  // ─── Refer & Earn ───────────────────────────────────────────────────────────
  // Har user ko apna code milta hai (register pe generate hota hai). Sparse
  // index isliye taaki purane users jinke paas abhi code nahi hai, unke null
  // aapas mein "duplicate" na maane jaayein.
  referralCode: {
    type:   String,
    unique: true,
    sparse: true,
    uppercase: true,
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  // Reward pehli completed ride pe milta hai — yeh flag do baar dene se rokta hai.
  referralRewarded: {
    type:    Boolean,
    default: false,
  },

  otp: {
    type: String,
    select: false, // GET requests mein auto-exclude
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true, // createdAt + updatedAt automatic
});

// Index for faster lookups
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
