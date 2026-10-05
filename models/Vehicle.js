const mongoose = require('mongoose');

const documentFieldSchema = {
  number: {
    type: String,
    trim: true
  },
  photo: String,       // aage ki taraf (front)
  // Peeche ki taraf. Licence aur RC dono taraf chhape hote hain — address,
  // vehicle class, chassis number peeche hi hote hain, sirf front se verify
  // nahi ho pata. Purane records mein khaali rahega.
  backPhoto: String,
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

  // Type ke andar ki category — car ke liye hatchback / sedan / suv (dekho
  // config/vehicleVariantDefaults.js). Khaali ka matlab "abhi tay nahi": aisi
  // gaadi ko har category ki request jaati hai, taaki purani registered
  // gaadiyan is field ke aane se band na ho jaayein.
  variant: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  // Gaadi ke paas kaunse auzaar/attachment hain — tractor ke rotavator,
  // thresher, trolley; JCB ka breaker, auger. Id config/equipmentDefaults.js
  // wale. Booking sirf usi ko jaati hai jiske paas kaam ka auzaar ho (dekho
  // utils/vehicleMatch.js). Default undefined jaan-bujh kar: purani gaadiyon
  // par yeh field hai hi nahi, aur unhe "sab kuch hai" maana jaata hai.
  equipment: {
    type: [String],
    default: undefined,
  },
  // Tractor ki takat (HP). Variant mein nahi rakha kyunki 55 HP ka tractor
  // 45 HP wala kaam bhi kar sakta hai — "barabar" nahi, "kam se kam" ka
  // hisaab hai, jo number se hi ho sakta hai.
  horsepower: {
    type: Number,
    min: 10,
    max: 150,
  },
  // false = gaadi mein AC nahi hai, AC wali request ise nahi jaayegi.
  // Set na ho to maan lete hain ki hai (wajah wahi — purani gaadiyan).
  hasAC: {
    type: Boolean,
  },
  // Choti category ki booking bhi lunga (Uber/Rapido jaisa) — Sedan/SUV
  // wale ko Mini ki booking tab jaati hai jab paas mein Mini wala na mile.
  // Daam customer ki chuni category ka. false = driver ne mana kiya.
  servesLowerCategory: {
    type: Boolean,
    default: true,
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
  // Gaadi ki photo (number plate ke saath). Registration par abhi optional hai.
  photo: {
    type: String,
    default: ''
  },

  documents: {
    rc: documentFieldSchema,
    insurance: documentFieldSchema,
    license: documentFieldSchema,             // driving license — vehicle-class specific
    puc: documentFieldSchema,                  // pollution certificate
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
