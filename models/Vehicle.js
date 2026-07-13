const mongoose = require('mongoose');

const documentFieldSchema = {
  number: {
    type: String,
    trim: true
  },
  photo: String,
  expiryDate: Date,
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
};

const VehicleSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },

  type: {
    type: String,
    required: true,
    enum: ['auto', 'bike', 'car', 'tractor', 'tempo', 'truck', 'jcb', 'ambulance', 'wedding']
  },

  number: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  model: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  registrationYear: {
    type: Number
  },

  documents: {
    rc: documentFieldSchema,
    insurance: documentFieldSchema,
    license: documentFieldSchema,             // driving license — vehicle-class specific
    permit: documentFieldSchema,               // commercial car/truck
    fitness: documentFieldSchema,              // commercial car/truck
    machineRegistration: documentFieldSchema,  // tractor/jcb
    operatorLicense: documentFieldSchema       // tractor/jcb operator cert
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: String,

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Nearby-driver matching: Vehicle.find({ type, isVerified: true, isActive: true })
VehicleSchema.index({ type: 1, isVerified: 1, isActive: 1 });
// Admin "all vehicles for a provider" listing
VehicleSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
