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

  // Vehicle types are admin-managed now (see Setting.vehicleRates) rather
  // than a fixed enum — fareCalculator falls back to 'auto' pricing for any
  // unrecognized type, so this stays a free string.
  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
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
  },

  // Verified vehicles ki details driver seedhe edit nahi kar sakta (Ola/Uber/Rapido
  // jaisa hi — verified papers kisi aur vehicle detail se match na ho jaayein). Driver
  // yahan se admin ko change ki request bhej sakta hai, admin dashboard pe review karega.
  changeRequest: {
    message: String,
    requestedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'resolved'],
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Nearby-driver matching: Vehicle.find({ type, isVerified: true, isActive: true })
VehicleSchema.index({ type: 1, isVerified: 1, isActive: 1 });
// Admin "all vehicles for a provider" listing
VehicleSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
