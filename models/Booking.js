const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // provider bhi user hi hoga
      default: null,
    },

    service: {
      type: String,
      enum: [
        "Auto Rickshaw",
        "Bike Taxi",
        "Car",
        "Tractor (Jutai)",
        "Wedding Car",
        "Goods Transport",
        "Tempo",
        "JCB/Excavator",
      ],
      required: true,
    },

    pickup: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    dropoff: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    distance: Number, // km
    duration: Number, // minutes
    fare: Number,

    status: {
      type: String,
      enum: ["pending", "confirmed", "started", "completed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "wallet"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    trackingId: {
      type: String,
      unique: true,
    },
    earning: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },

    startTime: Date,
    endTime: Date,
  },
  { timestamps: true }
);

BookingSchema.pre("save", function (next) {
  if (!this.trackingId) {
    this.trackingId = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model("Booking", BookingSchema);
