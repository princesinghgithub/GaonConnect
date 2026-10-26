const Ride = require('../../models/Ride');

const SaathiReferral = require('../models/SaathiReferral');
const SaathiEarning  = require('../models/SaathiEarning');
const { getBalance } = require('../services/rewards');
const incentives     = require('../config/incentives');

const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

// ─── GET /api/saathi/dashboard ───────────────────────────────────────────────
// Portal ka dashboard ek hi call mein bharta hai — stats, goal, recent activity
// aur referral code. Chhote portal ke liye 6 alag calls se ye behtar hai.
const getDashboard = async (req, res) => {
  const saathiId  = req.saathi._id;
  const monthFrom = startOfMonth();

  const [
    driversTotal, driversThisMonth,
    customersTotal, customersThisMonth,
    activations, activationsThisMonth,
    balance, recent,
  ] = await Promise.all([
    SaathiReferral.countDocuments({ saathi: saathiId, type: 'driver' }),
    SaathiReferral.countDocuments({ saathi: saathiId, type: 'driver', createdAt: { $gte: monthFrom } }),
    SaathiReferral.countDocuments({ saathi: saathiId, type: 'customer' }),
    SaathiReferral.countDocuments({ saathi: saathiId, type: 'customer', createdAt: { $gte: monthFrom } }),
    SaathiReferral.countDocuments({ saathi: saathiId, status: 'activated' }),
    SaathiReferral.countDocuments({ saathi: saathiId, status: 'activated', firstRideAt: { $gte: monthFrom } }),
    getBalance(saathiId),
    SaathiReferral.find({ saathi: saathiId })
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate('user', 'name')
      .select('type status user village updatedAt rewarded'),
  ]);

  // Completed bookings = un rides ki ginti jo is Saathi ke refer kiye customers
  // ne karayi. Driver-side count alag se nahi jodte warna ek hi ride do baar gin
  // jaati (jab customer aur driver dono isi Saathi ke ho).
  const customerIds = await SaathiReferral.find({ saathi: saathiId, type: 'customer' }).distinct('user');
  const completedBookings = customerIds.length
    ? await Ride.countDocuments({ customer: { $in: customerIds }, status: 'completed' })
    : 0;
  const totalBookings = customerIds.length
    ? await Ride.countDocuments({ customer: { $in: customerIds } })
    : 0;

  const rewardAmount = (type) =>
    type === 'driver' ? incentives.DRIVER_ACTIVATION : incentives.CUSTOMER_FIRST_BOOKING;

  return res.json({
    success: true,
    data: {
      saathi: {
        name:       req.saathi.name,
        saathiCode: req.saathi.saathiCode,
        saathiId:   req.saathi.saathiId,
        status:     req.saathi.status,
        area:       [req.saathi.village, req.saathi.district].filter(Boolean).join(', '),
      },

      stats: {
        driversJoined:     { value: driversTotal,   thisMonth: driversThisMonth },
        customersJoined:   { value: customersTotal, thisMonth: customersThisMonth },
        completedBookings: {
          value: completedBookings,
          // 0 bookings par "NaN%" dikhne se bachne ke liye
          successRate: totalBookings ? Math.round((completedBookings / totalBookings) * 100) : 0,
        },
        earnings: {
          total:   balance.lifetime,
          pending: balance.pending,
        },
      },

      monthlyGoal: {
        target:      incentives.MONTHLY_GOAL,
        achieved:    activations,
        thisMonth:   activationsThisMonth,
        percent:     incentives.MONTHLY_GOAL
          ? Math.min(100, Math.round((activations / incentives.MONTHLY_GOAL) * 100))
          : 0,
      },

      recentActivity: recent.map((r) => ({
        type:   r.type === 'driver' ? 'Driver' : 'Customer',
        name:   r.user?.name || 'Unknown',
        status: r.status,
        reward: r.rewarded ? rewardAmount(r.type) : 0,
        at:     r.updatedAt,
      })),
    },
  });
};

module.exports = { getDashboard };
