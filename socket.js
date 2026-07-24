const { Server } = require('socket.io');
const jwt         = require('jsonwebtoken');
const Provider     = require('./models/Provider');
const Ride          = require('./models/Ride');

let io = null;

// providerId → socketId mapping (sirf online drivers)
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

  // ─── Auth middleware ──────────────────────────────────────────────────────
  // Pehle koi bhi client kisi bhi driverId/userId/bookingId se connect ho
  // sakta tha (OTP leak, fake ride offers, driver hijacking — dekho audit).
  // Ab connect karte waqt valid JWT (handshake.auth.token) chahiye hi hoga,
  // aur uske baad driverId/userId client se nahi, TOKEN se derive hote hain.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id);
      socket.role   = decoded.role;

      if (decoded.role === 'provider') {
        const provider = await Provider.findOne({ user: decoded.id }).select('_id');
        if (!provider) return next(new Error('Provider profile not found'));
        socket.providerId = String(provider._id);
      }

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🚖 Socket connected: ${socket.id} (user ${socket.userId}${socket.providerId ? `, provider ${socket.providerId}` : ''})`);

    // ─── Booking room join helper — sirf apni khud ki ride ke liye ──────────
    const joinBookingRoom = async (bookingId) => {
      if (!bookingId) return;
      try {
        const ride = await Ride.findById(bookingId).select('customer provider');
        if (!ride) return;
        const ownsAsCustomer = String(ride.customer) === socket.userId;
        const ownsAsDriver   = socket.providerId && ride.provider && String(ride.provider) === socket.providerId;
        if (!ownsAsCustomer && !ownsAsDriver) {
          console.log(`⛔ Booking room join blocked: ${bookingId} (user ${socket.userId})`);
          return;
        }
        socket.join(`booking_${bookingId}`);
        console.log(`📦 Booking room joined: ${bookingId}`);
      } catch (err) {
        console.error('joinBookingRoom error:', err.message);
      }
    };

    // ─── Driver Online ──────────────────────────────────────────────────────
    socket.on('driverOnline', () => {
      if (!socket.providerId) return; // sirf provider-role token waale
      connectedDrivers.set(socket.providerId, socket.id);
      socket.join(`driver_${socket.providerId}`);
      console.log(`🟢 Driver online: ${socket.providerId}`);
    });

    // ─── User Joins Room ────────────────────────────────────────────────────
    socket.on('user_join', () => {
      socket.join(`user_${socket.userId}`);
      console.log(`👤 User joined: ${socket.userId}`);
    });

    // ─── User Joins Booking Room ────────────────────────────────────────────
    socket.on('join_booking', (bookingId) => joinBookingRoom(bookingId));

    // ─── User App join-ride (object format) ─────────────────────────────────
    socket.on('join-ride', ({ rideId } = {}) => joinBookingRoom(rideId));

    // ─── Driver Live Location ────────────────────────────────────────────────
    socket.on('driverLocation', async ({ bookingId, lat, lng }) => {
      if (!socket.providerId || !bookingId || lat === undefined || lng === undefined) return;
      try {
        const ride = await Ride.findById(bookingId).select('provider');
        if (!ride || !ride.provider || String(ride.provider) !== socket.providerId) return;
        io.to(`booking_${bookingId}`).emit('location_update', { driverId: socket.providerId, lat, lng });
      } catch (err) {
        console.error('driverLocation error:', err.message);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      if (socket.providerId && connectedDrivers.get(socket.providerId) === socket.id) {
        connectedDrivers.delete(socket.providerId);
        console.log(`🔴 Driver offline: ${socket.providerId}`);
        // DB sync: socket cut hone pe driver ko offline mark karo taaki next
        // createRide query mein stale 'isOnline:true' wale drivers na aayein.
        Provider.findByIdAndUpdate(socket.providerId, { isOnline: false, status: 'offline' }).catch(() => {});
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
