const Ride    = require('../../models/Ride');
const Vehicle = require('../../models/Vehicle');

const SaathiReferral = require('../models/SaathiReferral');
const incentives     = require('../config/incentives');

// Portal ki teen list screens: Drivers Added, Customers Added, Bookings.

const parsePaging = (query) => {
  const page  = Math.max(1, parseInt(query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// UI ke liye seedha padhne laayak status
const DRIVER_STATUS_LABEL = {
  joined:    'Pending Verification',
  verified:  'Verified — Pending First Booking',
  activated: 'Verified + Booking Done',
  rejected:  'Verification Rejected',
};

const CUSTOMER_STATUS_LABEL = {
  joined:    'No Booking Yet',
  verified:  'No Booking Yet',
  activated: 'First Booking Done',
  rejected:  'Inactive',
};

// ─── GET /api/saathi/network/drivers ─────────────────────────────────────────
const getDrivers = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { saathi: req.saathi._id, type: 'driver' };
  if (req.query.status) filter.status = req.query.status;

  const [total, referrals] = await Promise.all([
    SaathiReferral.countDocuments(filter),
    SaathiReferral.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name phone city')
      .populate('provider', 'isApproved isRejected activeVehicle'),
  ]);

  // Vehicle type ek hi query mein le aao — har row par alag lookup se bachne ke liye
  const vehicleIds = referrals.map((r) => r.provider?.activeVehicle).filter(Boolean);
  const vehicles   = vehicleIds.length
    ? await Vehicle.find({ _id: { $in: vehicleIds } }).select('type number')
    : [];
  const vehicleMap = new Map(vehicles.map((v) => [String(v._id), v]));

  return res.json({
    success: true,
    data: referrals.map((r) => {
      const vehicle = vehicleMap.get(String(r.provider?.activeVehicle));
      return {
        id:            r._id,
        name:          r.user?.name || 'Unknown',
        phone:         r.user?.phone || '',
        vehicle:       vehicle?.type || '—',
        vehicleNumber: vehicle?.number || '',
        village:       r.village || r.user?.city || '',
        status:        r.status,
        statusLabel:   DRIVER_STATUS_LABEL[r.status] || r.status,
        rewarded:      r.rewarded,
        reward:        r.rewarded ? incentives.DRIVER_ACTIVATION : 0,
        joinedAt:      r.createdAt,
      };
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── GET /api/saathi/network/customers ───────────────────────────────────────
const getCustomers = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { saathi: req.saathi._id, type: 'customer' };
  if (req.query.status) filter.status = req.query.status;

  const [total, referrals] = await Promise.all([
    SaathiReferral.countDocuments(filter),
    SaathiReferral.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name phone city'),
  ]);

  return res.json({
    success: true,
    data: referrals.map((r) => ({
      id:          r._id,
      name:        r.user?.name || 'Unknown',
      phone:       r.user?.phone || '',
      village:     r.village || r.user?.city || '',
      status:      r.status,
      statusLabel: CUSTOMER_STATUS_LABEL[r.status] || r.status,
      rewarded:    r.rewarded,
      reward:      r.rewarded ? incentives.CUSTOMER_FIRST_BOOKING : 0,
      joinedAt:    r.createdAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── GET /api/saathi/network/bookings ────────────────────────────────────────
// Sirf un customers ki rides jo is Saathi ne jode. Driver-side rides isme
// jaan-bujhkar nahi hain — warna ek hi ride do baar dikhti jab customer aur
// driver dono isi Saathi ke ho.
const getBookings = async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);

  const customerIds = await SaathiReferral.find({ saathi: req.saathi._id, type: 'customer' }).distinct('user');

  if (!customerIds.length) {
    return res.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
  }

  const filter = { customer: { $in: customerIds } };
  if (req.query.status) filter.status = req.query.status;

  const [total, rides] = await Promise.all([
    Ride.countDocuments(filter),
    Ride.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name')
      .populate({ path: 'provider', select: 'user', populate: { path: 'user', select: 'name' } })
      .select('customer provider vehicleType status fare finalFare createdAt'),
  ]);

  // Reward tabhi mila jab ye us customer ki PEHLI completed ride thi
  const rewardedRideIds = new Set(
    (await SaathiReferral.find({
      saathi:    req.saathi._id,
      type:      'customer',
      rewarded:  true,
      firstRide: { $in: rides.map((r) => r._id) },
    }).select('firstRide')).map((r) => String(r.firstRide))
  );

  return res.json({
    success: true,
    data: rides.map((ride) => ({
      id:       ride._id,
      // Portal short ID dikhata hai — pura ObjectId table mein nahi samata
      code:     `GCN-${String(ride._id).slice(-6).toUpperCase()}`,
      service:  ride.vehicleType || '—',
      customer: ride.customer?.name || 'Unknown',
      driver:   ride.provider?.user?.name || 'Not assigned',
      status:   ride.status,
      fare:     ride.finalFare ?? ride.fare ?? 0,
      reward:   rewardedRideIds.has(String(ride._id)) ? incentives.CUSTOMER_FIRST_BOOKING : 0,
      at:       ride.createdAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

module.exports = { getDrivers, getCustomers, getBookings };
