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
UserSchema.index({ phone: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
