const mongoose = require('mongoose');

const SosAlertSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Ride',
  },
  triggeredBy: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  triggeredByRole: {
    type: String,
    enum: ['customer', 'driver'],
    required: true,
  },
  location: {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    address:   { type: String, default: '' },
  },
  status: {
    type:    String,
    enum:    ['active', 'resolved', 'false_alarm'],
    default: 'active',
  },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  Date,
  resolveNote: String,
}, {
  timestamps: true,
});

SosAlertSchema.index({ status: 1, createdAt: -1 });
SosAlertSchema.index({ triggeredBy: 1 });

module.exports = mongoose.model('SosAlert', SosAlertSchema);
