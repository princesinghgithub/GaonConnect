const Ride = require("../models/Ride");
const Provider = require("../models/Provider");
const User = require("../models/User");
const { calculateFare } = require("../utils/fareCalculator");
const { getIO } = require("../socket");
const Razorpay = require("razorpay");

// exports.createRide = async (req, res) => {
//   try {
//     console.log('=== CREATE RIDE HIT ===');
//     console.log('BODY:', JSON.stringify(req.body));
//     console.log('USER:', req.user?.id);

//     const {
//       pickup,
//       dropoff,
//       vehicleType,
//       distance,
//       estimatedFare,
//       estimatedDuration,
//       paymentMethod = 'cash'
//     } = req.body;

//     if (!pickup || !dropoff || !vehicleType) {
//       return res.status(400).json({
//         success: false,
//         message: 'Pickup, drop location and vehicle type are required'
//       });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();

//     // 🟢 SAFE distance handling
//     const finalDistance =
//       typeof distance === 'object' ? distance.value : distance;

//     const finalDuration =
//       estimatedDuration ||
//       (distance?.duration?.value ?? null);

//     const ride = await Ride.create({
//       customer: req.user.id,
//       pickup: {
//         address: pickup.addressLine2 || pickup.address,
//         coordinates: {
//           latitude: pickup.location?.latitude || pickup.latitude,
//           longitude: pickup.location?.longitude || pickup.longitude
//         }
//       },
//       drop: {
//         address: dropoff.addressLine2 || dropoff.address,
//         coordinates: {
//           latitude: dropoff.location?.latitude || dropoff.latitude,
//           longitude: dropoff.location?.longitude || dropoff.longitude
//         }
//       },
//       vehicleType,
//       distance: finalDistance,
//       estimatedDuration: finalDuration,
//       fare: estimatedFare,
//       paymentMethod,
//       otp,
//       status: 'searching',
//       requestTime: new Date()
//     });

//     // 🔔 IMPORTANT: send provider count (debug help)
//     const providerCount = await Provider.countDocuments({
//       isOnline: true,
//       isApproved: true,
//       status: 'available',
//       'vehicle.type': vehicleType
//     });

//     return res.status(201).json({
//       success: true,
//       message: providerCount
//         ? 'Searching nearby drivers'
//         : 'No provider available',
//       data: {
//         ride,
//         providerCount
//       }
//     });

//   } catch (error) {
//     console.error('Create Ride Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error creating ride request',
//       error: error.message
//     });
//   }
// };

exports.createRide = async (req, res) => {
  try {
    console.log("=== CREATE RIDE HIT ===");
    console.log("BODY:", JSON.stringify(req.body));
    console.log("USER:", req.user?.id);

    const {
      pickup,
      drop,
      dropoff,
      vehicleType,
      distance,
      estimatedFare,
      fare,
      estimatedDuration,
      paymentMethod = "cash",
      bookingType = "instant",
      scheduledAt = null,
      scheduledNote = "",
    } = req.body;

    // drop ya dropoff dono accept karo
    const dropLocation = drop || dropoff;

    if (!pickup || !dropLocation || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Pickup, drop aur vehicle type required hai",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const finalFare = fare || estimatedFare || 0;
    const finalDistance =
      typeof distance === "object" ? distance.value : distance || 0;
    const finalDuration = estimatedDuration || 30;

    const ride = await Ride.create({
      customer: req.user.id,
      pickup: {
        address: pickup.address || pickup.addressLine2,
        coordinates: {
          latitude: pickup.latitude || pickup.location?.latitude,
          longitude: pickup.longitude || pickup.location?.longitude,
        },
      },
      drop: {
        address: dropLocation.address || dropLocation.addressLine2,
        coordinates: {
          latitude: dropLocation.latitude || dropLocation.location?.latitude,
          longitude: dropLocation.longitude || dropLocation.location?.longitude,
        },
      },
      vehicleType,
      distance: finalDistance,
      estimatedDuration: finalDuration,
      fare: finalFare,
      paymentMethod,
      otp,
      status: bookingType === "scheduled" ? "scheduled" : "searching",
      requestTime: new Date(),
      bookingType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      scheduledNote: scheduledNote || "",
    });

    console.log("✅ Ride created:", ride._id, "| OTP:", otp);

    // ── SOCKET: Online drivers ko newRideRequest bhejo ────────────
    if (bookingType === "scheduled") {
      return res.status(201).json({
        success: true,
        message: "Pre-booking ho gayi! Driver ko time pe notify kiya jayega.",
        data: { ride, providerCount: 0 },
      });
    }
    const io = getIO();

    const availableDrivers = await Provider.find({
      isOnline: true,
      isApproved: true,
      status: "available",
      "vehicle.type": vehicleType,
    }).populate("user", "name phone");

    console.log(
      `📡 Online drivers for [${vehicleType}]:`,
      availableDrivers.length,
    );

    const customerUser = await User.findById(req.user.id).select("name phone");

    const ridePayload = {
      rideId: ride._id,
      customerName: customerUser?.name || "Customer",
      customerPhone: customerUser?.phone || "",
      pickup: {
        address: ride.pickup.address,
        latitude: ride.pickup.coordinates.latitude,
        longitude: ride.pickup.coordinates.longitude,
      },
      drop: {
        address: ride.drop.address,
        latitude: ride.drop.coordinates.latitude,
        longitude: ride.drop.coordinates.longitude,
      },
      fare: finalFare,
      distance: finalDistance,
      vehicleType,
      paymentMethod,
    };

    // Har available driver ko personally send karo
    availableDrivers.forEach((driver) => {
      console.log(
        `🔔 Ride sent to driver: ${driver.user?.name} | room: driver_${driver._id}`,
      );
      io.to(`driver_${driver._id}`).emit("newRideRequest", ridePayload);
    });

    return res.status(201).json({
      success: true,
      message: availableDrivers.length
        ? `${availableDrivers.length} drivers ko request bheji`
        : "Koi driver available nahi",
      data: { ride, providerCount: availableDrivers.length },
    });
  } catch (error) {
    console.error("Create Ride Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET RIDE BY ID
 */
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("customer", "name phone profilePhoto")
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "name phone profilePhoto",
        },
      });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // ✅ Allow access without strict authorization for now (MVP)
    // Later add proper authorization checks

    return res.status(200).json({
      success: true,
      data: ride, // ✅ Wrapped in 'data' key
    });
  } catch (error) {
    console.error("Get Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching ride",
      error: error.message,
    });
  }
};

/**
 * GET CURRENT ACTIVE RIDE (CUSTOMER)
 */
exports.getCurrentRideCustomer = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      customer: req.user.id,
      status: { $in: ["searching", "accepted", "arrived", "started"] },
    })
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "name phone profilePhoto",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: ride, // ✅ Changed from 'ride' to 'data'
      message: ride ? "Active ride found" : "No active ride",
    });
  } catch (error) {
    console.error("Get Current Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching current ride",
      error: error.message,
    });
  }
};

/**
 * GET CURRENT ACTIVE RIDE (DRIVER)
 */
// exports.getCurrentRideDriver = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: 'Provider not found'
//       });
//     }

//     const ride = await Ride.findOne({
//       provider: provider._id,
//       status: { $in: ['accepted', 'arrived', 'started'] }
//     })
//     .populate('customer', 'name phone profilePhoto')
//     .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data: ride,
//       message: ride ? 'Active ride found' : 'No active ride'
//     });

//   } catch (error) {
//     console.error('Get Current Ride Driver Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching current ride',
//       error: error.message
//     });
//   }
// };

exports.getCurrentRideDriver = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // 1️⃣ Accepted / Ongoing Ride
    let ride = await Ride.findOne({
      provider: provider._id,
      status: { $in: ["accepted", "arrived", "started"] },
    })
      .populate("customer", "name phone profilePhoto")
      .sort({ createdAt: -1 });

    // 2️⃣ Searching Ride (FIXED)
    if (!ride && provider.isOnline === true) {
      ride = await Ride.findOne({
        status: "searching",
        $or: [{ provider: { $exists: false } }, { provider: null }],
        vehicleType: provider.vehicle.type,
      })
        .populate("customer", "name phone profilePhoto")
        .sort({ createdAt: 1 });
    }

    return res.status(200).json({
      success: true,
      data: ride,
      message: ride ? "Ride available" : "No active ride",
    });
  } catch (error) {
    console.error("Get Current Ride Driver Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching current ride",
    });
  }
};

/**
 * CANCEL RIDE (CUSTOMER/DRIVER)
 */
exports.cancelRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check authorization
    const isCustomer = ride.customer.toString() === req.user.id;

    let isDriver = false;
    if (ride.provider) {
      const provider = await Provider.findById(ride.provider);
      isDriver = provider?.user?.toString() === req.user.id;
    }

    if (!isCustomer && !isDriver) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (["completed", "cancelled"].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed or already cancelled ride",
      });
    }

    ride.status = "cancelled";
    ride.cancelledBy = isCustomer ? "customer" : "driver";
    ride.cancellationReason = reason || "Not specified";
    ride.cancelledAt = new Date();

    await ride.save();

    // Update provider status if assigned
    if (ride.provider) {
      const provider = await Provider.findById(ride.provider);
      if (provider) {
        provider.status = "available";
        provider.stats.cancelledTrips += 1;
        await provider.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Cancel Ride Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling ride",
      error: error.message,
    });
  }
};

/**
 * GET RIDE HISTORY (CUSTOMER)
 */
exports.getRideHistoryCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { customer: req.user.id };

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "name phone",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Ride.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: rides,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get Ride History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching ride history",
      error: error.message,
    });
  }
};

// exports.acceptRide = async (req, res) => {
//   try {
//     const { rideId } = req.body;
//     const userId = req.user.id;

//     const provider = await Provider.findOne({ user: userId });

//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: "Provider not found",
//       });
//     }

//     const ride = await Ride.findById(rideId);

//     if (!ride || ride.status !== "searching") {
//       return res.status(400).json({
//         success: false,
//         message: "Ride not available",
//       });
//     }

//     // ✅ ASSIGN DRIVER
//     ride.provider = provider._id;
//     ride.status = "accepted";
//     await ride.save();

//     provider.status = "busy";
//     provider.isOnline = true;
//     await provider.save();

//     // 🔥 SOCKET SAFE USAGE
//     const io = getIO();

//     // 🔔 Notify customer
//     io.to(`user_${ride.customer}`).emit("rideAccepted", {
//       rideId: ride._id,
//       driverId: provider._id,
//     });

//     return res.json({
//       success: true,
//       message: "Ride accepted",
//       data: ride,
//     });

//   } catch (error) {
//     console.error("Accept Ride Error:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// 18-01-2024

exports.acceptRide = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized driver",
      });
    }

    const { rideId } = req.body;

    const ride = await Ride.findOne({
      _id: rideId,
      status: "searching",
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not available",
      });
    }

    // 🔥 MOST IMPORTANT FIX
    ride.provider = provider._id;
    ride.status = "accepted";
    await ride.save();

    // 🔔 SOCKET EVENT TO USER
    const io = getIO();
    io.to(`user_${ride.customer}`).emit("rideAccepted", {
      rideId: ride._id,
      driverId: provider._id,
    });

    return res.status(200).json({
      success: true,
      message: "Ride accepted",
      data: ride,
    });
  } catch (err) {
    console.error("Accept Ride Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// exports.acceptRide = async (req, res) => {
//   try {
//     // 🔐 Logged-in driver (provider)
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized driver"
//       });
//     }

//     const { rideId } = req.body;

//     // 🚕 Ride must be in searching state
//     const ride = await Ride.findOne({
//       _id: rideId,
//       status: "searching"
//     });

//     if (!ride) {
//       return res.status(404).json({
//         success: false,
//         message: "Ride not available or already accepted"
//       });
//     }

//     // ✅ Accept ride
//     ride.provider = provider._id;   // 🔥 VERY IMPORTANT
//     ride.status = "accepted";
//     await ride.save();

//     // 📡 Notify user via socket
//     const io = getIO();
//     io.to(`user_${ride.user.toString()}`).emit("rideAccepted", {
//       rideId: ride._id,
//       providerId: provider._id
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Ride accepted successfully",
//       data: ride
//     });

//   } catch (error) {
//     console.error("Accept Ride Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };

/**
 * REJECT RIDE (DRIVER)
 */
// exports.rejectRide = async (req, res) => {
//   try {
//     // TODO: Implement reject ride logic
//     return res.status(501).json({
//       success: false,
//       message: 'rejectRide not implemented yet'
//     });
//   } catch (error) {
//     console.error('Reject Ride Error:', error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.rejectRide = async (req, res) => {
  try {
    const { rideId, reason } = req.body;
    const userId = req.user.id;

    const provider = await Provider.findOne({ user: userId });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride || ride.status !== "searching") {
      return res.status(400).json({
        success: false,
        message: "Ride not available",
      });
    }

    // Save rejection reason (optional)
    provider.rejectionReasons.push({
      rideId: ride._id,
      reason: reason || "Driver rejected",
    });

    await provider.save();

    return res.json({
      success: true,
      message: "Ride rejected",
    });
  } catch (error) {
    console.error("Reject Ride Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error rejecting ride",
    });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized driver",
      });
    }

    const { rideId, status } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // 🔐 Same driver check
    if (
      !ride.provider ||
      ride.provider.toString() !== provider._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized driver for this ride",
      });
    }

    // ⛔ Final states protection
    if (["completed", "cancelled"].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: `Ride already ${ride.status}`,
      });
    }

    // 🔁 Allowed transitions
    const allowedTransitions = {
      searching: ["accepted", "cancelled"],
      accepted: ["arrived", "cancelled"],
      arrived: ["started", "cancelled"],
      started: ["completed"],
    };

    const nextStatuses = allowedTransitions[ride.status] || [];

    if (!nextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status change from ${ride.status} to ${status}`,
      });
    }

    // ✅ Update
    ride.status = status;
    await ride.save();

    // 📡 Socket notify user
    const io = getIO();
    io.to(`user_${ride.user}`).emit("rideStatusUpdate", {
      rideId: ride._id,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Ride status updated successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Update Ride Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * VERIFY OTP AND START RIDE
 */
// exports.verifyOTPAndStart = async (req, res) => {
//   try {
//     // TODO: Implement OTP verification and start ride logic
//     return res.status(501).json({
//       success: false,
//       message: 'verifyOTPAndStart not implemented yet'
//     });
//   } catch (error) {
//     console.error('Verify OTP Error:', error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// exports.verifyOTPAndStart = async (req, res) => {
//   try {
//     const { rideId, otp } = req.body;

//     if (!rideId || !otp) {
//       return res.status(400).json({ success: false, message: "rideId and OTP are required" });
//     }

//     // 1. Fetch ride from DB
//     const ride = await Ride.findById(rideId);
//     if (!ride) {
//       return res.status(404).json({ success: false, message: "Ride not found" });
//     }

//     // 2. Verify OTP
//     if (ride.otp !== otp) {
//       return res.status(401).json({ success: false, message: "Invalid OTP" });
//     }

//     // 3. Update ride status
//     ride.status = "started";
//     ride.startedAt = new Date();
//     await ride.save();

//     // 4. Respond success
//     return res.status(200).json({ success: true, message: "Ride started successfully", ride });

//   } catch (error) {
//     console.error("Verify OTP Error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.verifyOTPAndStart = async (req, res) => {
  try {
    const { rideId, otp } = req.body;

    if (!rideId || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "rideId and OTP are required" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });
    }

    // ✅ Yeh line add karo
    if (ride.status !== "arrived") {
      return res.status(400).json({
        success: false,
        message: `Pehle 'Pickup Pe Pahunch Gaya' dabao`,
      });
    }

    if (ride.otp !== otp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    ride.status = "started";
    ride.startedAt = new Date();
    await ride.save();

    return res.status(200).json({
      success: true,
      message: "Ride started successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * GET RIDE HISTORY (DRIVER)
 */
exports.getRideHistoryDriver = async (req, res) => {
  try {
    const driverId = req.user.id; // Logged-in driver from JWT
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = { driver: driverId };

    // Fetch rides with pagination and sort by latest
    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("user", "name phone email") // show customer info
      .populate("driver", "name phone vehicleNumber"); // optional

    const total = await Ride.countDocuments(query);

    res.json({
      success: true,
      data: rides,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    console.error("Get Ride History Driver Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// exports.getSearchingRides = async (req, res) => {
//   try {
//     if (req.user.role !== 'provider') {
//       return res.status(403).json({ message: 'Only drivers allowed' });
//     }

//     const rides = await Ride.find({
//       status: 'searching',
//       provider: null
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data: rides
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getSearchingRides = async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "Only drivers allowed",
      });
    }

    const rides = await Ride.find({
      status: "searching",
      provider: null,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// upcomming ride  
exports.getScheduledRidesDriver = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const now = new Date();

    // Aane wali scheduled rides — same vehicle type, abhi tak kisi ne accept nahi ki
    const rides = await Ride.find({
      bookingType:   'scheduled',
      status:        'scheduled',
      vehicleType:   provider.vehicle.type,
      scheduledAt:   { $gte: now },
    })
    .populate('customer', 'name phone')
    .sort({ scheduledAt: 1 }) // Sabse pehle wali ride pehle
    .limit(20);

    return res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
