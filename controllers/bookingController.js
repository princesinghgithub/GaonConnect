// const Booking = require('../models/Booking');
// const Provider = require('../models/Provider');
// const { calculateFare } = require('../utils/fareCalculator');
// const { calculateEarning } = require("../utils/earning");
// const { getIO } = require("../socket");

// const Razorpay = require("razorpay");

const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const { calculateFare } = require('../utils/fareCalculator');
const { calculateEarning } = require("../utils/earning");
const { getIO } = require("../socket");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});


// ---------------- CREATE BOOKING ----------------
// exports.createBooking = async (req, res) => {
//   try {
//     const { service, pickup, dropoff, distance, duration } = req.body;

//     if (!pickup?.coordinates || !dropoff?.coordinates)
//       return res.status(400).json({ message: "Pickup & drop required" });

//     // fare calculate
//     const fare = calculateFare(service, distance, duration);

//     // create booking pending
//     const booking = await Booking.create({
//       user: req.user.id,
//       service,
//       pickup,
//       dropoff,
//       distance,
//       duration,
//       fare,
//       otp: Math.floor(1000 + Math.random() * 9000), // 4 digit OTP
//       status: "pending"
//     });

//     // nearest driver find
//     const driver = await Provider.findOne({
//       isOnline: true,
//       isApproved: true,
//       status: "available",
//       "vehicle.type": service.toLowerCase()
//     })
//       .where("currentLocation")
//       .near({
//         center: {
//           type: "Point",
//           coordinates: [
//             pickup.coordinates.lng,
//             pickup.coordinates.lat
//           ]
//         },
//         maxDistance: 5000
//       });

//     // driver na mile
//     if (!driver)
//       return res.json({ success: true, assigned: false, booking });

//     // assign driver
//     booking.provider = driver._id;
//     booking.status = "confirmed";
//     await booking.save();

//     driver.status = "busy";
//     await driver.save();

//     // notify driver
//     getIO().to(`driver_${driver._id}`).emit("ride_request", booking);

//     res.json({ success: true, assigned: true, booking });

//   } catch (e) {
//     console.log(e);
//     res.status(500).json({ message: "Booking failed" });
//   }
// };


exports.createBooking = async (req, res) => {
  try {
    const { service, pickup, dropoff, distance, duration, paymentMethod = "cash" } = req.body;

    if (!pickup?.coordinates || !dropoff?.coordinates)
      return res.status(400).json({ message: "Pickup & drop required" });

    const fare = calculateFare(service, distance, duration);

    const booking = await Booking.create({
      user: req.user.id,
      service,
      pickup,
      dropoff,
      distance,
      duration,
      fare,
      paymentMethod,
      otp: Math.floor(1000 + Math.random() * 9000), // 4 digit OTP
      status: "pending",
      paymentStatus: paymentMethod === "cash" ? "pending" : "unpaid",
    });

    // Find nearest driver
    const driver = await Provider.findOne({
      isOnline: true,
      isApproved: true,
      status: "available",
      "vehicle.type": service.toLowerCase()
    })
      .where("currentLocation")
      .near({
        center: {
          type: "Point",
          coordinates: [pickup.coordinates.lng, pickup.coordinates.lat]
        },
        maxDistance: 5000
      });

    if (!driver) return res.json({ success: true, assigned: false, booking });

    // assign driver
    booking.provider = driver._id;
    booking.status = "confirmed";
    await booking.save();

    driver.status = "busy";
    await driver.save();

    getIO().to(`driver_${driver._id}`).emit("ride_request", booking);

    res.json({ success: true, assigned: true, booking });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Booking failed" });
  }
};



// ---------------- UPDATE STATUS ----------------
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Not found" });

    booking.status = status;

    if (status === "started") booking.startTime = new Date();

    if (status === "completed") {
      booking.endTime = new Date();
      booking.paymentStatus = "completed";

      const { driverAmount, commission } = calculateEarning(booking.fare);

      booking.earning = driverAmount;
      booking.platformCommission = commission;

      await Provider.findByIdAndUpdate(booking.provider, {
        $inc: { totalEarnings: driverAmount }
      });
    }

    if ((status === "completed" || status === "cancelled") && booking.provider) {
      await Provider.findByIdAndUpdate(booking.provider, { status: "available" });
    }

    await booking.save();

    getIO().to(`user_${booking.user}`).emit("ride_status_update", { status });

    res.json({ success: true, booking });

  } catch (e) {
    res.status(500).json({ message: "Update failed" });
  }
};



// ---------------- START RIDE (OTP) ----------------
// exports.startRide = async (req, res) => {
//   const { otp } = req.body;

//   const booking = await Booking.findById(req.params.id);

//   if (!booking) return res.status(404).json({ message: "Not found" });

//   if (booking.otp != otp)
//     return res.status(400).json({ message: "Invalid OTP" });

//   booking.status = "started";
//   booking.startTime = new Date();
//   await booking.save();

//   res.json({ success: true, message: "Ride Started" });
// };

exports.startRide = async (req, res) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.otp != otp) return res.status(400).json({ message: "Invalid OTP" });

    booking.status = "started";
    booking.startTime = new Date();
    await booking.save();

    res.json({ success: true, message: "Ride Started", booking });
  } catch (err) {
    res.status(500).json({ message: "Start ride failed" });
  }
};


// ---------------- GENERATE RAZORPAY ORDER ----------------
exports.createRazorpayOrder = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.paymentMethod !== "online")
      return res.status(400).json({ message: "Payment method is not online" });

    const options = {
      amount: booking.fare * 100, // in paise
      currency: "INR",
      receipt: `booking_${booking._id}`
    };

    const order = await razorpay.orders.create(options);
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({ success: true, order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Razorpay order creation failed" });
  }
};

// ---------------- VERIFY RAZORPAY PAYMENT ----------------
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpaySignature } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Verify signature
    const crypto = require("crypto");
    const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(booking.razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== razorpaySignature)
      return res.status(400).json({ message: "Payment verification failed" });

    booking.paymentStatus = "paid";
    await booking.save();

    res.json({ success: true, message: "Payment verified", booking });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
// ---------------- COMPLETE RIDE ----------------
// exports.completeRide = async (req, res) => {
//   const booking = await Booking.findById(req.params.id);

//   if (!booking) return res.status(404).json({ message: "Not found" });

//   booking.status = "completed";
//   booking.endTime = new Date();
//   booking.paymentStatus = "completed";

//   const { driverAmount, commission } = calculateEarning(booking.fare);

//   booking.earning = driverAmount;
//   booking.platformCommission = commission;

//   await booking.save();

//   await Provider.findByIdAndUpdate(booking.provider, {
//     status: "available",
//     $inc: { totalEarnings: driverAmount }
//   });

//   res.json({ success: true, message: "Ride Completed" });
// };

exports.completeRide = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Online payment must be paid
    if (booking.paymentMethod === "online" && booking.paymentStatus !== "paid")
      return res.status(400).json({ message: "Payment pending" });

    booking.status = "completed";
    booking.endTime = new Date();

    const { driverAmount, commission } = calculateEarning(booking.fare);
    booking.earning = driverAmount;
    booking.platformCommission = commission;
    booking.paymentStatus = "completed";

    await booking.save();
    if (booking.provider)
      await Provider.findByIdAndUpdate(booking.provider, {
        status: "available",
        $inc: { totalEarnings: driverAmount }
      });

    res.json({ success: true, message: "Ride Completed", booking });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Complete ride failed" });
  }
};



// ---------------- CANCEL RIDE ----------------
exports.cancelRide = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return res.status(404).json({ message: "Not found" });

  const diff = (Date.now() - booking.createdAt) / 60000;

  let penalty = 0;

  if (diff > 2 && booking.provider) penalty = 20;

  booking.status = "cancelled";
  booking.penalty = penalty;

  await booking.save();

  res.json({ success: true, penalty });
};



// ---------------- DRIVER ACCEPT / REJECT ----------------
exports.driverRideResponse = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const driverId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status === "accepted") {
      booking.status = "confirmed";
      booking.provider = driverId;

      await booking.save();

      await Provider.findByIdAndUpdate(driverId, { status: "busy" });
    }

    if (status === "rejected") {
      booking.provider = null;
      booking.status = "pending";
      await booking.save();
    }

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ message: "Ride response failed" });
  }
};



// ---------------- USER BOOKINGS ----------------
exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, bookings });
};



// ---------------- DRIVER BOOKINGS ----------------
exports.getDriverBookings = async (req, res) => {
  const bookings = await Booking.find({ provider: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, bookings });
};



// ---------------- BOOKING DETAIL ----------------
exports.getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("provider", "name phone vehicle")
    .populate("user", "name phone");

  res.json({ success: true, booking });
};



// ---------------- ADMIN ALL BOOKINGS ----------------
exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find()
    .populate("provider", "name phone")
    .populate("user", "name phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, bookings });
};



// ---------------- DRIVER EARNINGS ----------------
exports.getDriverEarnings = async (req, res) => {
  const bookings = await Booking.find({
    provider: req.user.id,
    status: "completed"
  });

  const total = bookings.reduce((sum, b) => sum + (b.earning || 0), 0);

  res.json({ success: true, total, count: bookings.length });
};
