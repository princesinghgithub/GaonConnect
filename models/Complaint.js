const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['customer_vs_driver', 'driver_vs_customer', 'app_issue', 'fare_dispute', 'other'],
    default: 'customer_vs_driver',
  },
  complainant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  complainantName: String,
  complainantPhone: String,
  against: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  againstName: String,
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  category: {
    type: String,
    enum: ['fare', 'behavior', 'safety', 'vehicle_condition', 'delay', 'route', 'other'],
    default: 'other',
  },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'dismissed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  resolution: { type: String, trim: true },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

ComplaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
