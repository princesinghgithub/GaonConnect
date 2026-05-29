const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  ride: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Ride',
    required: true,
  },
  // Kisne diya — customer ya driver
  ratedBy: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  raterType: {
    type: String,
    enum: ['customer', 'driver'],
    required: true,
  },
  // Customer ne driver ko diya
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Provider',
  },
  // Driver ne customer ko diya
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  stars: {
    type:     Number,
    required: true,
    min:      1,
    max:      5,
  },
  review: {
    type:      String,
    maxlength: 300,
    trim:      true,
  },
  // Quick tags — Rapido style
  tags: [{
    type: String,
    enum: ['safe_driving', 'on_time', 'friendly', 'clean_vehicle',
           'good_route', 'professional', 'helpful',
           'late', 'rash_driving', 'rude', 'dirty_vehicle'],
  }],
}, {
  timestamps: true,
});

// Ek ride ke liye ek hi rating per raterType
RatingSchema.index({ ride: 1, raterType: 1 }, { unique: true });
RatingSchema.index({ provider: 1 });
RatingSchema.index({ customer: 1 });

module.exports = mongoose.model('Rating', RatingSchema);
