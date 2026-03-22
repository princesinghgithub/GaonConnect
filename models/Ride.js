const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },

    pickup: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    },

    drop: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    },

    vehicleType: {
      type: String,
      required: true,
      enum: ["auto", "bike", "car", "tractor", "tempo", "truck", "jcb"],
    },

    distance: {
      type: Number, // in km
      required: true,
    },

    estimatedDuration: {
      type: Number, // in minutes
      required: true,
    },

    actualDuration: {
      type: Number, // in minutes
    },

    fare: {
      type: Number,
      required: true,
    },

    finalFare: {
      type: Number, // Can be different due to extra charges or discounts
    },

    otp: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "searching",
        "accepted",
        "arrived",
        "started",
        "completed",
        "cancelled",
      ],
      default: "searching",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "wallet"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    rating: {
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      driverRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      customerFeedback: String,
      driverFeedback: String,
    },

    cancelledBy: {
      type: String,
      enum: ["customer", "driver"],
    },

    cancellationReason: String,
    bookingType: {
      type: String,
      enum: ["instant", "scheduled"],
      default: "instant",
    },
    scheduledAt: { type: Date, default: null },
    scheduledNote: { type: String, default: "" },

    requestTime: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: Date,
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
RideSchema.index({ customer: 1, createdAt: -1 });
RideSchema.index({ provider: 1, createdAt: -1 });
RideSchema.index({ status: 1 });

module.exports = mongoose.model("Ride", RideSchema);
