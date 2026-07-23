const { Server } = require('socket.io');

let io = null;

// driverId → socketId mapping
const connectedDrivers = new Map();

function initSocket(server) {
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!isProd) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Socket CORS blocked: ${origin}`));
      },
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    // Stale connections faster detect karo
    pingTimeout:  20000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🚖 Socket connected: ${socket.id}`);

    // ─── Driver Online ──────────────────────────────────────────────────────
    socket.on('driverOnline', ({ driverId }) => {
      if (!driverId) return;
      connectedDrivers.set(String(driverId), socket.id);
      socket.join(`driver_${driverId}`);
      console.log(`🟢 Driver online: ${driverId}`);
    });

    // ─── User Joins Room ────────────────────────────────────────────────────
    socket.on('user_join', (userId) => {
      if (!userId) return;
      socket.join(`user_${userId}`);
      console.log(`👤 User joined: ${userId}`);
    });

    // ─── User Joins Booking Room ────────────────────────────────────────────
    socket.on('join_booking', (bookingId) => {
      if (!bookingId) return;
      socket.join(`booking_${bookingId}`);
      console.log(`📦 Booking room joined: ${bookingId}`);
    });

    // ─── User App join-ride (object format) ─────────────────────────────────
    socket.on('join-ride', ({ rideId } = {}) => {
      if (!rideId) return;
      socket.join(`booking_${rideId}`);
      console.log(`📍 Ride room joined: ${rideId}`);
    });

    // ─── Driver Live Location ────────────────────────────────────────────────
    socket.on('driverLocation', ({ bookingId, driverId, lat, lng }) => {
      if (!bookingId || lat === undefined || lng === undefined) return;
      io.to(`booking_${bookingId}`).emit('location_update', { driverId, lat, lng });
    });

    // ─── Assign Ride to Driver ───────────────────────────────────────────────
    socket.on('assignRide', ({ driverId, booking }) => {
      if (!driverId || !booking) return;
      const driverSocket = connectedDrivers.get(String(driverId));
      if (driverSocket) {
        io.to(driverSocket).emit('newRideRequest', booking);
        console.log(`📩 Ride sent to driver: ${driverId}`);
      } else {
        console.log(`⚠️  Driver not online: ${driverId}`);
      }
    });

    // ─── Driver Accept / Reject ──────────────────────────────────────────────
    socket.on('rideResponse', ({ bookingId, driverId, status }) => {
      if (!bookingId) return;
      io.to(`booking_${bookingId}`).emit('ride_status_update', { bookingId, driverId, status });
    });

    // ─── Live Ride Tracking ──────────────────────────────────────────────────
    socket.on('rideTracking', ({ bookingId, lat, lng }) => {
      if (!bookingId || lat === undefined || lng === undefined) return;
      io.to(`booking_${bookingId}`).emit('track_update', { lat, lng });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      for (const [driverId, sId] of connectedDrivers.entries()) {
        if (sId === socket.id) {
          connectedDrivers.delete(driverId);
          console.log(`🔴 Driver offline: ${driverId}`);
          break;
        }
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// Online drivers ki list (admin dashboard ke liye)
function getConnectedDrivers() {
  return Array.from(connectedDrivers.keys());
}

module.exports = { initSocket, getIO, getConnectedDrivers };
