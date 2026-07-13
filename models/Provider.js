const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Vehicle jo abhi active/on-duty hai — Vehicle collection me actual vehicles hain (ek provider ke multiple ho sakte hain)
  activeVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },

  documents: {
    aadhaar: {
      number: {
        type: String,
        trim: true
      },
      photo: String,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    photo: {
      type: String // Driver's selfie/profile photo
    }
  },

  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },

  stats: {
    totalTrips: {
      type: Number,
      default: 0
    },
    completedTrips: {
      type: Number,
      default: 0
    },
    cancelledTrips: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    weekEarnings: {
      type: Number,
      default: 0
    },
    monthEarnings: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0 // in km
    },
    onlineHours: {
      type: Number,
      default: 0 // in hours
    },
    acceptanceRate: {
      type: Number,
      default: 100 // percentage
    },
    lastTripDate: Date
  },

  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    totalWithdrawals: {
      type: Number,
      default: 0
    }
  },

  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    verified: {
      type: Boolean,
      default: false
    }
  },

  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },

  // currentLocation: {
  //   type: {
  //     type: String,
  //     enum: ['Point'],
  //     default: 'Point'
  //   },
  //   coordinates: {
  //     type: [Number], // [longitude, latitude]
  //     default: [0, 0]
  //   },
  //   address: String,
  //   updatedAt: {
  //     type: Date,
  //     default: Date.now
  //   }
  // },


  currentLocation: {
  type: { type: String, enum: ['Point'] },
  coordinates: { type: [Number], index: '2dsphere' }
},

  isApproved: {
    type: Boolean,
    default: false
  },

  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  blockedAt: Date,
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unblockedAt: Date,

  isOnline: {
    type: Boolean,
    default: false
  },

  onlineAt: Date, // Last time driver went online
  offlineAt: Date, // Last time driver went offline

  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'hi'
    },
    notifications: {
      rideRequests: {
        type: Boolean,
        default: true
      },
      earnings: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: false
      }
    },
    autoAccept: {
      type: Boolean,
      default: false
    },
    maxDistance: {
      type: Number,
      default: 15 // km
    }
  },

  rejectionReasons: [{
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  deviceInfo: {
    deviceId: String,
    fcmToken: String, // For push notifications
    platform: {
      type: String,
      enum: ['android', 'ios']
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create 2dsphere index for location queries
ProviderSchema.index({ currentLocation: '2dsphere' });
ProviderSchema.index({ status: 1, isApproved: 1, isOnline: 1 });
ProviderSchema.index({ activeVehicle: 1 });

// Update updatedAt before save
ProviderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total trips
ProviderSchema.virtual('totalRides').get(function() {
  return this.stats.completedTrips + this.stats.cancelledTrips;
});

// Virtual populate — provider ki saari vehicles (Vehicle collection se), manual Vehicle.find() ki zaroorat nahi
ProviderSchema.virtual('vehicles', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'providerId'
});

ProviderSchema.set('toObject', { virtuals: true });
ProviderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Provider', ProviderSchema);
