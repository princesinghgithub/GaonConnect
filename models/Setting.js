// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  commission: {
    percentage: {
      type: Number,
      default: 20
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },
  pricing: {
    baseFare: {
      type: Number,
      default: 50
    },
    perKm: {
      type: Number,
      default: 10
    },
    perMinute: {
      type: Number,
      default: 2
    },
    minimumFare: {
      type: Number,
      default: 80
    },
    auto: {
      baseFare: Number,
      perKm: Number,
      perMinute: Number
    },
    bike: {
      baseFare: Number,
      perKm: Number,
      perMinute: Number
    },
    car: {
      baseFare: Number,
      perKm: Number,
      perMinute: Number
    }
  },
  cancellation: {
    userFee: {
      type: Number,
      default: 20
    },
    driverFee: {
      type: Number,
      default: 30
    },
    timeLimit: {
      type: Number,
      default: 5 // minutes
    }
  },
  general: {
    currency: {
      type: String,
      default: 'INR'
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    supportEmail: String,
    supportPhone: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);