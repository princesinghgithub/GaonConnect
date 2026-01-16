// socket.js
const { Server } = require("socket.io");

let io = null;

// 🔥 Driver socket mapping (driverId -> socketId)
const connectedDrivers = new Map();

function initSocket(server) {

  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("🚖 Client Connected:", socket.id);

    // 🟢 DRIVER ONLINE
    socket.on("driverOnline", ({ driverId }) => {
      connectedDrivers.set(driverId, socket.id);
      socket.join(`driver_${driverId}`);

      console.log("🟢 Driver Online:", driverId);
    });

    // 👤 USER JOINS ROOM
    socket.on("user_join", (userId) => {
      socket.join(`user_${userId}`);
      console.log("👤 User Joined:", userId);
    });

    // 🚕 USER JOINS BOOKING ROOM
    socket.on("join_booking", (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log("📦 Booking Room Joined:", bookingId);
    });

    // 📡 DRIVER LIVE LOCATION
    socket.on("driverLocation", ({ bookingId, driverId, lat, lng }) => {
      io.to(`booking_${bookingId}`).emit("location_update", {
        driverId,
        lat,
        lng
      });
    });

    // 📲 ASSIGN RIDE TO DRIVER
    socket.on("assignRide", ({ driverId, booking }) => {
      const driverSocket = connectedDrivers.get(driverId);

      if (driverSocket) {
        io.to(driverSocket).emit("newRideRequest", booking);
        console.log("📩 Ride Sent To Driver:", driverId);
      } else {
        console.log("⚠ Driver not online", driverId);
      }
    });

    // 🚦 DRIVER ACCEPT / REJECT
    socket.on("rideResponse", ({ bookingId, driverId, status }) => {
      io.to(`booking_${bookingId}`).emit("ride_status_update", {
        bookingId,
        driverId,
        status
      });
    });

    // 📍 LIVE RIDE TRACKING
    socket.on("rideTracking", ({ bookingId, lat, lng }) => {
      io.to(`booking_${bookingId}`).emit("track_update", { lat, lng });
    });

    // ❌ DISCONNECT
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);

      for (let [driverId, sId] of connectedDrivers.entries()) {
        if (sId === socket.id) {
          connectedDrivers.delete(driverId);
          console.log("🔴 Driver Offline:", driverId);
        }
      }
    });

  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
