const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code: {
    type:      String,
    required:  true,
    unique:    true,
    uppercase: true,
    trim:      true,
  },
  description: { type: String, default: '' },

  discountType: {
    type: String,
    enum: ['percent', 'flat'],
    required: true,
  },
  discountValue: {
    type:     Number,
    required: true,
    min:      1,
  },
  maxDiscount: {
    type:    Number,
    default: null, // percent type ke liye max cap (e.g. 50% but max ₹100)
  },
  minFare: {
    type:    Number,
    default: 0, // minimum ride fare to apply promo
  },

  // Kitni baar total use ho sakta hai
  maxUses: {
    type:    Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type:    Number,
    default: 0,
  },

  // Ek user kitni baar use kar sakta hai
  maxUsesPerUser: {
    type:    Number,
    default: 1,
  },

  // Sirf pehli ride ke liye
  firstRideOnly: {
    type:    Boolean,
    default: false,
  },

  // Specific users ke liye (referral codes)
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  }],

  // Vehicle type restrict kar sako
  applicableVehicles: [{
    type: String,
    enum: ['auto', 'bike', 'car', 'tractor', 'tempo', 'truck', 'jcb', 'ambulance', 'wedding'],
  }],

  validFrom:  { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },

  isActive: { type: Boolean, default: true },

  // Ye track karo kisne use kiya
  usedBy: [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ride:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
    usedAt: { type: Date, default: Date.now },
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validUntil: 1 });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
