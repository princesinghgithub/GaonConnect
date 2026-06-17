const dns        = require('dns');
const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const helmet     = require('helmet');
const http       = require('http');
const path       = require('path');
const mongoose   = require('mongoose');

dotenv.config();

// Railway containers have no outbound IPv6 route; Gmail SMTP (and other hosts)
// resolve to IPv6 first and hang/fail with ENETUNREACH unless IPv4 is preferred.
dns.setDefaultResultOrder('ipv4first');

const connectDB       = require('./config/db');
const redis           = require('./config/redis');
const { initSocket }  = require('./socket');
const { apiLimiter }  = require('./middleware/rateLimiter');

const adminRoutes    = require('./routes/admin');
const locationRoutes = require('./routes/location');

// ─── DB Connect ───────────────────────────────────────────────────────────────
connectDB();

const app    = express();
const server = http.createServer(app);

// Railway sits in front as a reverse proxy and sets X-Forwarded-For;
// trust its single proxy hop so express-rate-limit sees the real client IP.
app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // uploads folder ke liye

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials:         true,
  optionsSuccessStatus: 200,
  methods:             ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders:      ['Content-Type', 'Authorization'],
}));

// ─── Body Parsers (with size limit) ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Static Uploads (single registration) ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Global API Rate Limiter ──────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Request Logger (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`➡️  ${req.method} ${req.url}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/create',   require('./routes/ride'));
app.use('/api/ride',     require('./routes/ride'));
app.use('/api/rides',    require('./routes/ride'));
app.use('/api/wallet',   require('./routes/wallet'));
app.use('/api/admin',    adminRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/ratings', require('./routes/rating'));
app.use('/api/sos',     require('./routes/sos'));
app.use('/api/promo',   require('./routes/promo'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const dbStatus    = mongoose.connection.readyState === 1 ? 'ok' : 'down';
    const redisPing   = await redis.ping().catch(() => null);
    const redisStatus = redisPing === 'PONG' ? 'ok' : 'down';

    const allOk  = dbStatus === 'ok' && redisStatus === 'ok';
    const status = allOk ? 200 : 503;

    return res.status(status).json({
      status:    allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
      services:  { database: dbStatus, redis: redisStatus },
    });
  } catch {
    return res.status(503).json({ status: 'unhealthy' });
  }
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'GaonConnect API is running', version: '2.0.0' });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route nahi mili.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message,
  });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(server);

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
const { startScheduledRideJob } = require('./jobs/scheduledRideJob');
startScheduledRideJob();

// ─── Start Server with Port Retry ────────────────────────────────────────────
const BASE_PORT      = Number(process.env.PORT) || 5000;
const MAX_PORT_TRIES = 5;
let currentPort  = BASE_PORT;
let retries      = 0;
let retryPending = false;

const startServer = (port) => {
  currentPort = port;
  server.listen(currentPort, () => {
    console.log(`\n🚀 Server running on port ${currentPort}`);
    console.log(`📊 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${currentPort}/health\n`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && retries < MAX_PORT_TRIES && !retryPending) {
    retryPending = true;
    retries += 1;
    const next = currentPort + 1;
    console.warn(`⚠️  Port ${currentPort} busy. Trying ${next}...`);
    setTimeout(() => { retryPending = false; startServer(next); }, 300);
    return;
  }
  console.error('❌ Server failed to start:', err.message);
  process.exit(1);
});

startServer(BASE_PORT);

// ─── Unhandled Rejections ─────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`🔥 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = server;
