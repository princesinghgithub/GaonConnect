

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const { initSocket } = require("./socket");
const path = require('path');
const adminRoutes = require('./routes/admin')
const locationRoutes = require('./routes/location');

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

// 🔥 REQUEST LOGGER
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 🔥 CORS ALWAYS FIRST
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//   })
// );

const corsOptions = {
  origin: ['http://localhost:5173', 'https://gaonconnect.in', 'http://localhost:3000',], // Frontend URLs
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(cors(corsOptions));
// 🔥 BODY PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 STATIC UPLOADS
app.use("/uploads", express.static("uploads"));


// 🔥 ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/provider", require("./routes/provider"));
app.use("/api/ride", require("./routes/ride"));
app.use("/api/wallet", require("./routes/wallet"));
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);


// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GaonConnect API + Socket.io is running",
    version: "1.0.0",
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error:
      process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ⭐ Initialize Socket.io
initSocket(server);

// START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// HANDLE PROMISE REJECTIONS
process.on("unhandledRejection", (err) => {
  console.log(`🔥 Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server;
