// const User = require('../models/User');
// const Provider = require('../models/Provider');
// const Booking = require('../models/Booking');
// const Rating = require('../models/Rating');
// const Ride = require('../models/Ride');
// const User = require('../models/User');
// const Driver = require('../models/Driver');
// const Payment = require('../models/Payment');
// const Setting = require('../models/Setting');


// // @desc    Get admin dashboard stats
// // @route   GET /api/admin/stats
// // @access  Private/Admin
// exports.getAdminStats = async (req, res) => {
//   try {
//     // Total revenue
//     const bookings = await Booking.find({ status: 'completed' });
//     const totalRevenue = bookings.reduce((sum, booking) => sum + booking.fare, 0);
    
//     // Commission (10%)
//     const commission = totalRevenue * 0.1;

//     // Active providers
//     const activeProviders = await Provider.countDocuments({ 
//       isApproved: true, 
//       isOnline: true 
//     });

//     // Today's bookings
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const todayBookings = await Booking.countDocuments({
//       createdAt: { $gte: today }
//     });

//     // Total users
//     const totalUsers = await User.countDocuments({ role: 'customer' });

//     // Total providers
//     const totalProviders = await Provider.countDocuments();

//     // Pending approvals
//     const pendingApprovals = await Provider.countDocuments({ 
//       isApproved: false 
//     });

//     // Monthly revenue (last 6 months)
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//     const monthlyRevenue = await Booking.aggregate([
//       {
//         $match: {
//           status: 'completed',
//           createdAt: { $gte: sixMonthsAgo }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$createdAt' },
//             month: { $month: '$createdAt' }
//           },
//           revenue: { $sum: '$fare' },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { '_id.year': 1, '_id.month': 1 }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       stats: {
//         totalRevenue,
//         commission,
//         activeProviders,
//         todayBookings,
//         totalUsers,
//         totalProviders,
//         pendingApprovals
//       },
//       monthlyRevenue
//     });
//   } catch (error) {
//     console.error('Get Admin Stats Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching admin stats',
//       error: error.message
//     });
//   }
// };

// // @desc    Get recent activity
// // @route   GET /api/admin/activity
// // @access  Private/Admin
// exports.getRecentActivity = async (req, res) => {
//   try {
//     const activities = [];

//     // Recent bookings
//     const recentBookings = await Booking.find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate('user', 'name')
//       .populate('provider', 'vehicle');

//     recentBookings.forEach(booking => {
//       activities.push({
//         type: 'booking',
//         action: `Booking ${booking.status}`,
//         details: `Trip #${booking.trackingId}`,
//         time: booking.createdAt,
//         amount: booking.fare
//       });
//     });

//     // Recent provider registrations
//     const recentProviders = await Provider.find()
//       .sort({ createdAt: -1 })
//       .limit(3)
//       .populate('user', 'name');

//     recentProviders.forEach(provider => {
//       activities.push({
//         type: 'provider',
//         action: 'New Provider Registered',
//         details: provider.user.name,
//         time: provider.createdAt
//       });
//     });

//     // Sort by time
//     activities.sort((a, b) => b.time - a.time);

//     res.status(200).json({
//       success: true,
//       activities: activities.slice(0, 10)
//     });
//   } catch (error) {
//     console.error('Get Recent Activity Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching activity',
//       error: error.message
//     });
//   }
// };

// // @desc    Get all users
// // @route   GET /api/admin/users
// // @access  Private/Admin
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find()
//       .select('-password -otp')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       users
//     });
//   } catch (error) {
//     console.error('Get All Users Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching users',
//       error: error.message
//     });
//   }
// };

// // @desc    Get all providers (with approval status)
// // @route   GET /api/admin/providers
// // @access  Private/Admin
// exports.getAllProviders = async (req, res) => {
//   try {
//     const providers = await Provider.find()
//       .populate('user', 'name phone email city')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: providers.length,
//       providers
//     });
//   } catch (error) {
//     console.error('Get All Providers Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching providers',
//       error: error.message
//     });
//   }
// };

// // @desc    Approve/Reject provider
// // @route   PUT /api/admin/providers/:id/approve
// // @access  Private/Admin
// exports.approveProvider = async (req, res) => {
//   try {
//     const { isApproved } = req.body;

//     const provider = await Provider.findById(req.params.id);

//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: 'Provider not found'
//       });
//     }

//     provider.isApproved = isApproved;
//     await provider.save();

//     res.status(200).json({
//       success: true,
//       message: `Provider ${isApproved ? 'approved' : 'rejected'}`,
//       provider
//     });
//   } catch (error) {
//     console.error('Approve Provider Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating provider status',
//       error: error.message
//     });
//   }
// };

// // @desc    Get booking analytics
// // @route   GET /api/admin/analytics/bookings
// // @access  Private/Admin
// exports.getBookingAnalytics = async (req, res) => {
//   try {
//     // Service-wise bookings
//     const serviceStats = await Booking.aggregate([
//       {
//         $group: {
//           _id: '$service',
//           count: { $sum: 1 },
//           totalRevenue: { $sum: '$fare' }
//         }
//       },
//       {
//         $sort: { count: -1 }
//       }
//     ]);

//     // Status-wise bookings
//     const statusStats = await Booking.aggregate([
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Hourly bookings (today)
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const hourlyStats = await Booking.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: today }
//         }
//       },
//       {
//         $group: {
//           _id: { $hour: '$createdAt' },
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { '_id': 1 }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       analytics: {
//         serviceStats,
//         statusStats,
//         hourlyStats
//       }
//     });
//   } catch (error) {
//     console.error('Get Booking Analytics Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching analytics',
//       error: error.message
//     });
//   }
// };



// controllers/adminController.js (Part 2 - Continuation)

// ===== RIDES MANAGEMENT =====

// @desc    Get all rides with filters
// @route   GET /api/admin/rides
// @access  Private/Admin




// const User = require('../models/User');
// const Provider = require('../models/Provider');
// const Booking = require('../models/Booking');
// const Rating = require('../models/Rating');
// const Ride = require('../models/Ride');
// const Driver = require('../models/Provider');
// // const Payment = require('../models/Payment');
// const Setting = require('../models/Setting');

// exports.getAllRides = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status, driverId, userId, startDate, endDate } = req.query;
    
//     const query = {};
    
//     if (status) query.status = status;
//     if (driverId) query.driver = driverId;
//     if (userId) query.user = userId;
//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) query.createdAt.$lte = new Date(endDate);
//     }

//     const rides = await Ride.find(query)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 })
//       .populate('user', 'name email phone')
//       .populate('driver', 'name phone vehicleNumber');

//     const count = await Ride.countDocuments(query);

//     res.json({
//       success: true,
//       data: rides,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       total: count
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get ride details
// // @route   GET /api/admin/rides/:id
// // @access  Private/Admin
// exports.getRideDetails = async (req, res) => {
//   try {
//     const ride = await Ride.findById(req.params.id)
//       .populate('user', 'name email phone profileImage')
//       .populate('driver', 'name phone vehicleNumber vehicleType profileImage rating')
//       .populate('payment');

//     if (!ride) {
//       return res.status(404).json({
//         success: false,
//         message: 'Ride not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: ride
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Cancel ride by admin
// // @route   POST /api/admin/rides/:id/cancel
// // @access  Private/Admin
// exports.cancelRideAdmin = async (req, res) => {
//   try {
//     const { reason } = req.body;

//     const ride = await Ride.findById(req.params.id);

//     if (!ride) {
//       return res.status(404).json({
//         success: false,
//         message: 'Ride not found'
//       });
//     }

//     if (ride.status === 'completed' || ride.status === 'cancelled') {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot cancel this ride'
//       });
//     }

//     ride.status = 'cancelled';
//     ride.cancellationReason = reason;
//     ride.cancelledBy = 'admin';
//     ride.cancelledAt = Date.now();

//     await ride.save();

//     // Refund if payment was made
//     if (ride.payment) {
//       // Add refund logic here
//     }

//     // Send notifications
//     // await sendNotification(ride.user, 'Your ride has been cancelled by admin');
//     // if (ride.driver) await sendNotification(ride.driver, 'Ride cancelled by admin');

//     res.json({
//       success: true,
//       message: 'Ride cancelled successfully',
//       data: ride
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get ride statistics
// // @route   GET /api/admin/rides/stats
// // @access  Private/Admin
// exports.getRideStats = async (req, res) => {
//   try {
//     const { period = 'today' } = req.query;
    
//     let startDate;
//     const now = new Date();
    
//     switch(period) {
//       case 'today':
//         startDate = new Date(now.setHours(0, 0, 0, 0));
//         break;
//       case 'week':
//         startDate = new Date(now.setDate(now.getDate() - 7));
//         break;
//       case 'month':
//         startDate = new Date(now.setMonth(now.getMonth() - 1));
//         break;
//       default:
//         startDate = new Date(now.setHours(0, 0, 0, 0));
//     }

//     const stats = await Ride.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalRides: { $sum: 1 },
//           completed: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           cancelled: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           },
//           ongoing: {
//             $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] }
//           },
//           totalRevenue: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
//           },
//           avgFare: { $avg: '$fare' }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: stats[0] || {
//         totalRides: 0,
//         completed: 0,
//         cancelled: 0,
//         ongoing: 0,
//         totalRevenue: 0,
//         avgFare: 0
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get ongoing rides
// // @route   GET /api/admin/rides/ongoing
// // @access  Private/Admin
// exports.getOngoingRides = async (req, res) => {
//   try {
//     const ongoingRides = await Ride.find({ 
//       status: { $in: ['ongoing', 'accepted', 'arriving'] }
//     })
//       .populate('user', 'name phone')
//       .populate('driver', 'name phone vehicleNumber location')
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: ongoingRides
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Track specific ride
// // @route   GET /api/admin/rides/:id/track
// // @access  Private/Admin
// exports.trackRide = async (req, res) => {
//   try {
//     const ride = await Ride.findById(req.params.id)
//       .populate('driver', 'name phone location vehicleNumber')
//       .select('status pickup dropoff driver currentLocation estimatedArrival');

//     if (!ride) {
//       return res.status(404).json({
//         success: false,
//         message: 'Ride not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: ride
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== LIVE MAP =====

// // @desc    Get active drivers location
// // @route   GET /api/admin/drivers/live-locations
// // @access  Private/Admin
// exports.getActiveDriversLocation = async (req, res) => {
//   try {
//     const activeDrivers = await Driver.find({ 
//       isOnline: true,
//       isApproved: true,
//       isBlocked: false
//     })
//       .select('name phone location vehicleType vehicleNumber currentRide');

//     res.json({
//       success: true,
//       data: activeDrivers
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== PAYMENTS =====

// // @desc    Get all payments
// // @route   GET /api/admin/payments
// // @access  Private/Admin
// exports.getAllPayments = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;
    
//     const query = {};
    
//     if (status) query.status = status;
//     if (method) query.paymentMethod = method;
//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) query.createdAt.$lte = new Date(endDate);
//     }

//     const payments = await Payment.find(query)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 })
//       .populate('ride')
//       .populate('user', 'name email')
//       .populate('driver', 'name phone');

//     const count = await Payment.countDocuments(query);

//     res.json({
//       success: true,
//       data: payments,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       total: count
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get payment statistics
// // @route   GET /api/admin/payments/stats
// // @access  Private/Admin
// exports.getPaymentStats = async (req, res) => {
//   try {
//     const stats = await Payment.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: '$amount' },
//           totalCommission: { $sum: '$commission' },
//           totalTransactions: { $sum: 1 },
//           cashPayments: {
//             $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amount', 0] }
//           },
//           onlinePayments: {
//             $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$amount', 0] }
//           },
//           successfulPayments: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           failedPayments: {
//             $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
//           }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: stats[0] || {
//         totalAmount: 0,
//         totalCommission: 0,
//         totalTransactions: 0,
//         cashPayments: 0,
//         onlinePayments: 0,
//         successfulPayments: 0,
//         failedPayments: 0
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get pending withdrawals
// // @route   GET /api/admin/payments/withdrawals/pending
// // @access  Private/Admin
// exports.getPendingWithdrawals = async (req, res) => {
//   try {
//     const Withdrawal = require('../models/Withdrawal'); // You'll need to create this model

//     const pendingWithdrawals = await Withdrawal.find({ status: 'pending' })
//       .populate('driver', 'name phone email bankDetails')
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: pendingWithdrawals
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Process withdrawal
// // @route   PUT /api/admin/payments/withdrawal/:id
// // @access  Private/Admin
// exports.processWithdrawal = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;
//     const Withdrawal = require('../models/Withdrawal');

//     const withdrawal = await Withdrawal.findById(req.params.id);

//     if (!withdrawal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Withdrawal request not found'
//       });
//     }

//     withdrawal.status = status;
//     withdrawal.remarks = remarks;
//     withdrawal.processedBy = req.user._id;
//     withdrawal.processedAt = Date.now();

//     if (status === 'approved') {
//       // Update driver's wallet
//       const Driver = require('../models/Driver');
//       await Driver.findByIdAndUpdate(withdrawal.driver, {
//         $inc: { walletBalance: -withdrawal.amount }
//       });
//     }

//     await withdrawal.save();

//     res.json({
//       success: true,
//       message: `Withdrawal ${status} successfully`,
//       data: withdrawal
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get commission report
// // @route   GET /api/admin/payments/commission
// // @access  Private/Admin
// exports.getCommissionReport = async (req, res) => {
//   try {
//     const { from_date, to_date } = req.query;

//     const query = { status: 'completed' };
//     if (from_date || to_date) {
//       query.createdAt = {};
//       if (from_date) query.createdAt.$gte = new Date(from_date);
//       if (to_date) query.createdAt.$lte = new Date(to_date);
//     }

//     const commissionData = await Payment.aggregate([
//       { $match: query },
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
//           },
//           totalCommission: { $sum: '$commission' },
//           totalAmount: { $sum: '$amount' },
//           transactionCount: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     const summary = await Payment.aggregate([
//       { $match: query },
//       {
//         $group: {
//           _id: null,
//           totalCommission: { $sum: '$commission' },
//           totalRevenue: { $sum: '$amount' },
//           totalTransactions: { $sum: 1 }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         daily: commissionData,
//         summary: summary[0] || {
//           totalCommission: 0,
//           totalRevenue: 0,
//           totalTransactions: 0
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== USERS/CUSTOMERS =====

// // @desc    Get all users
// // @route   GET /api/admin/users
// // @access  Private/Admin
// exports.getAllUsers = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, search } = req.query;
    
//     const query = { role: 'user' };
    
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const users = await User.find(query)
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 })
//       .select('-password');

//     const count = await User.countDocuments(query);

//     res.json({
//       success: true,
//       data: users,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       total: count
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get user details
// // @route   GET /api/admin/users/:id
// // @access  Private/Admin
// exports.getUserDetails = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Get user's ride history
//     const rides = await Ride.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .populate('driver', 'name vehicleNumber');

//     // Get user statistics
//     const stats = await Ride.aggregate([
//       { $match: { user: user._id } },
//       {
//         $group: {
//           _id: null,
//           totalRides: { $sum: 1 },
//           totalSpent: { $sum: '$fare' },
//           completedRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           cancelledRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         user,
//         recentRides: rides,
//         stats: stats[0] || {
//           totalRides: 0,
//           totalSpent: 0,
//           completedRides: 0,
//           cancelledRides: 0
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Block user
// // @route   PUT /api/admin/users/:id/block
// // @access  Private/Admin
// exports.blockUser = async (req, res) => {
//   try {
//     const { reason } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { 
//         isBlocked: true,
//         blockReason: reason,
//         blockedAt: Date.now(),
//         blockedBy: req.user._id
//       },
//       { new: true }
//     ).select('-password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'User blocked successfully',
//       data: user
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Unblock user
// // @route   PUT /api/admin/users/:id/unblock
// // @access  Private/Admin
// exports.unblockUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { 
//         isBlocked: false,
//         blockReason: null,
//         unblockedAt: Date.now()
//       },
//       { new: true }
//     ).select('-password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'User unblocked successfully',
//       data: user
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== SETTINGS =====

// // @desc    Get system settings
// // @route   GET /api/admin/settings
// // @access  Private/Admin
// exports.getSettings = async (req, res) => {
//   try {
//     const settings = await Setting.findOne();

//     if (!settings) {
//       // Create default settings if not exists
//       const defaultSettings = await Setting.create({
//         commission: {
//           percentage: 20,
//           type: 'percentage'
//         },
//         pricing: {
//           baseFare: 50,
//           perKm: 10,
//           perMinute: 2,
//           minimumFare: 80
//         },
//         cancellation: {
//           userFee: 20,
//           driverFee: 30,
//           timeLimit: 5
//         },
//         general: {
//           currency: 'INR',
//           currencySymbol: 'â‚¹',
//           timezone: 'Asia/Kolkata'
//         }
//       });
//       return res.json({
//         success: true,
//         data: defaultSettings
//       });
//     }

//     res.json({
//       success: true,
//       data: settings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update settings
// // @route   PUT /api/admin/settings
// // @access  Private/Admin
// exports.updateSettings = async (req, res) => {
//   try {
//     let settings = await Setting.findOne();

//     if (!settings) {
//       settings = await Setting.create(req.body);
//     } else {
//       settings = await Setting.findOneAndUpdate(
//         {},
//         req.body,
//         { new: true, runValidators: true }
//       );
//     }

//     res.json({
//       success: true,
//       message: 'Settings updated successfully',
//       data: settings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update pricing
// // @route   PUT /api/admin/pricing
// // @access  Private/Admin
// exports.updatePricing = async (req, res) => {
//   try {
//     const { vehicleType, pricing } = req.body;

//     const settings = await Setting.findOne();

//     if (!settings) {
//       return res.status(404).json({
//         success: false,
//         message: 'Settings not found'
//       });
//     }

//     // Update pricing for specific vehicle type
//     settings.pricing[vehicleType] = pricing;
//     await settings.save();

//     res.json({
//       success: true,
//       message: 'Pricing updated successfully',
//       data: settings
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get system config
// // @route   GET /api/admin/config
// // @access  Private/Admin
// exports.getSystemConfig = async (req, res) => {
//   try {
//     const config = {
//       version: process.env.APP_VERSION || '1.0.0',
//       environment: process.env.NODE_ENV,
//       features: {
//         payment: true,
//         notifications: true,
//         realTimeTracking: true,
//         scheduling: true
//       },
//       limits: {
//         maxRideDistance: 100, // km
//         maxWaitingTime: 15, // minutes
//         maxDriverRadius: 10 // km
//       }
//     };

//     res.json({
//       success: true,
//       data: config
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== REPORTS & ANALYTICS =====

// // @desc    Get analytics
// // @route   GET /api/admin/analytics
// // @access  Private/Admin
// exports.getAnalytics = async (req, res) => {
//   try {
//     const { period = 'week' } = req.query;
    
//     let startDate;
//     const now = new Date();
    
//     switch(period) {
//       case 'today':
//         startDate = new Date(now.setHours(0, 0, 0, 0));
//         break;
//       case 'week':
//         startDate = new Date(now.setDate(now.getDate() - 7));
//         break;
//       case 'month':
//         startDate = new Date(now.setMonth(now.getMonth() - 1));
//         break;
//       case 'year':
//         startDate = new Date(now.setFullYear(now.getFullYear() - 1));
//         break;
//       default:
//         startDate = new Date(now.setDate(now.getDate() - 7));
//     }

//     const [rideAnalytics, revenueAnalytics, userGrowth, driverGrowth] = await Promise.all([
//       // Ride analytics
//       Ride.aggregate([
//         { $match: { createdAt: { $gte: startDate } } },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             totalRides: { $sum: 1 },
//             completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
//             cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]),
      
//       // Revenue analytics
//       Payment.aggregate([
//         { 
//           $match: { 
//             createdAt: { $gte: startDate },
//             status: 'completed'
//           } 
//         },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             revenue: { $sum: '$amount' },
//             commission: { $sum: '$commission' }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]),
      
//       // User growth
//       User.aggregate([
//         { 
//           $match: { 
//             createdAt: { $gte: startDate },
//             role: 'user'
//           } 
//         },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             newUsers: { $sum: 1 }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]),
      
//       // Driver growth
//       Driver.aggregate([
//         { $match: { createdAt: { $gte: startDate } } },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//             newDrivers: { $sum: 1 }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ])
//     ]);

//     res.json({
//       success: true,
//       data: {
//         rides: rideAnalytics,
//         revenue: revenueAnalytics,
//         userGrowth,
//         driverGrowth
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Export report
// // @route   GET /api/admin/reports/export
// // @access  Private/Admin
// exports.exportReport = async (req, res) => {
//   try {
//     const { type, from_date, to_date } = req.query;

//     const query = {};
//     if (from_date || to_date) {
//       query.createdAt = {};
//       if (from_date) query.createdAt.$gte = new Date(from_date);
//       if (to_date) query.createdAt.$lte = new Date(to_date);
//     }

//     let data;
//     let filename;

//     switch(type) {
//       case 'rides':
//         data = await Ride.find(query)
//           .populate('user', 'name email')
//           .populate('driver', 'name phone')
//           .lean();
//         filename = 'rides-report.csv';
//         break;
        
//       case 'payments':
//         data = await Payment.find(query)
//           .populate('user', 'name email')
//           .populate('driver', 'name phone')
//           .lean();
//         filename = 'payments-report.csv';
//         break;
        
//       case 'drivers':
//         data = await Driver.find()
//           .select('-password')
//           .lean();
//         filename = 'drivers-report.csv';
//         break;
        
//       case 'users':
//         data = await User.find({ role: 'user' })
//           .select('-password')
//           .lean();
//         filename = 'users-report.csv';
//         break;
        
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid report type'
//         });
//     }

//     // Convert to CSV (you'll need a CSV library like 'json2csv')
//     const { Parser } = require('json2csv');
//     const json2csvParser = new Parser();
//     const csv = json2csvParser.parse(data);

//     res.header('Content-Type', 'text/csv');
//     res.header('Content-Disposition', `attachment; filename="${filename}"`);
//     res.send(csv);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get driver performance
// // @route   GET /api/admin/drivers/:id/performance
// // @access  Private/Admin
// exports.getDriverPerformance = async (req, res) => {
//   try {
//     const { period = 'week' } = req.query;
//     const driverId = req.params.id;
    
//     let startDate;
//     const now = new Date();
    
//     switch(period) {
//       case 'week':
//         startDate = new Date(now.setDate(now.getDate() - 7));
//         break;
//       case 'month':
//         startDate = new Date(now.setMonth(now.getMonth() - 1));
//         break;
//       case 'year':
//         startDate = new Date(now.setFullYear(now.getFullYear() - 1));
//         break;
//       default:
//         startDate = new Date(now.setDate(now.getDate() - 7));
//     }

//     const performance = await Ride.aggregate([
//       { 
//         $match: { 
//           driver: require('mongoose').Types.ObjectId(driverId),
//           createdAt: { $gte: startDate }
//         } 
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           totalRides: { $sum: 1 },
//           completedRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           totalEarnings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
//           },
//           avgRating: { $avg: '$rating' },
//           totalDistance: { $sum: '$distance' }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     // Overall stats
//     const overallStats = await Ride.aggregate([
//       { 
//         $match: { 
//           driver: require('mongoose').Types.ObjectId(driverId),
//           createdAt: { $gte: startDate }
//         } 
//       },
//       {
//         $group: {
//           _id: null,
//           totalRides: { $sum: 1 },
//           completedRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           cancelledRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           },
//           totalEarnings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
//           },
//           avgRating: { $avg: '$rating' },
//           totalDistance: { $sum: '$distance' }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         daily: performance,
//         overall: overallStats[0] || {
//           totalRides: 0,
//           completedRides: 0,
//           cancelledRides: 0,
//           totalEarnings: 0,
//           avgRating: 0,
//           totalDistance: 0
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get driver stats
// // @route   GET /api/admin/drivers/:id/stats
// // @access  Private/Admin
// exports.getDriverStats = async (req, res) => {
//   try {
//     const driverId = req.params.id;

//     const stats = await Ride.aggregate([
//       { $match: { driver: require('mongoose').Types.ObjectId(driverId) } },
//       {
//         $group: {
//           _id: null,
//           totalRides: { $sum: 1 },
//           completedRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           cancelledRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           },
//           totalEarnings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
//           },
//           avgRating: { $avg: '$rating' },
//           totalDistance: { $sum: '$distance' },
//           avgFare: { $avg: '$fare' }
//         }
//       }
//     ]);

//     // Today's stats
//     const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
//     const todayStats = await Ride.aggregate([
//       { 
//         $match: { 
//           driver: require('mongoose').Types.ObjectId(driverId),
//           createdAt: { $gte: todayStart }
//         } 
//       },
//       {
//         $group: {
//           _id: null,
//           todayRides: { $sum: 1 },
//           todayEarnings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
//           }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         overall: stats[0] || {
//           totalRides: 0,
//           completedRides: 0,
//           cancelledRides: 0,
//           totalEarnings: 0,
//           avgRating: 0,
//           totalDistance: 0,
//           avgFare: 0
//         },
//         today: todayStats[0] || {
//           todayRides: 0,
//           todayEarnings: 0
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update driver status
// // @route   PUT /api/admin/drivers/:id/status
// // @access  Private/Admin
// exports.updateDriverStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const driver = await Driver.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     ).select('-password');

//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Driver status updated',
//       data: driver
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete driver
// // @route   DELETE /api/admin/drivers/:id
// // @access  Private/Admin
// exports.deleteDriver = async (req, res) => {
//   try {
//     const driver = await Driver.findById(req.params.id);

//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver not found'
//       });
//     }

//     // Check if driver has active rides
//     const activeRides = await Ride.countDocuments({
//       driver: driver._id,
//       status: { $in: ['pending', 'accepted', 'ongoing'] }
//     });

//     if (activeRides > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot delete driver with active rides'
//       });
//     }

//     await driver.remove();

//     res.json({
//       success: true,
//       message: 'Driver deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Verify driver document
// // @route   PUT /api/admin/drivers/:id/documents/verify
// // @access  Private/Admin
// exports.verifyDocument = async (req, res) => {
//   try {
//     const { documentType, status } = req.body;

//     const driver = await Driver.findById(req.params.id);

//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver not found'
//       });
//     }

//     // Update document verification status
//     if (!driver.documents) driver.documents = {};
//     if (!driver.documents[documentType]) {
//       driver.documents[documentType] = {};
//     }
    
//     driver.documents[documentType].verified = status === 'verified';
//     driver.documents[documentType].verifiedAt = Date.now();
//     driver.documents[documentType].verifiedBy = req.user._id;

//     await driver.save();

//     res.json({
//       success: true,
//       message: 'Document verification updated',
//       data: driver
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // ===== NOTIFICATIONS =====

// // @desc    Send notification
// // @route   POST /api/admin/notifications/send
// // @access  Private/Admin
// exports.sendNotification = async (req, res) => {
//   try {
//     const { recipientId, recipientType, title, message, type } = req.body;

//     const notification = await Notification.create({
//       recipient: recipientId,
//       recipientType,
//       title,
//       message,
//       type,
//       sentBy: req.user._id
//     });

//     // Send push notification
//     // await sendPushNotification(recipientId, title, message);

//     res.json({
//       success: true,
//       message: 'Notification sent successfully',
//       data: notification
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // @desc    Send bulk notification
// // @route   POST /api/admin/notifications/bulk
// // @access  Private/Admin
// exports.sendBulkNotification = async (req, res) => {
//   try {
//     const { recipientType, title, message, type, filters } = req.body;

//     let recipients = [];

//     if (recipientType === 'users') {
//       const query = filters || {};
//       recipients = await User.find(query).select('_id');
//     } else if (recipientType === 'drivers') {
//       const query = filters || {};
//       recipients = await Driver.find(query).select('_id');
//     } else if (recipientType === 'all') {
//       const users = await User.find().select('_id');
//       const drivers = await Driver.find().select('_id');
//       recipients = [...users, ...drivers];
//     }

//     const notifications = recipients.map(recipient => ({
//       recipient: recipient._id,
//       recipientType,
//       title,
//       message,
//       type,
//       sentBy: req.user._id
//     }));

//     await Notification.insertMany(notifications);

//     // Send push notifications in batches
//     // await sendBulkPushNotifications(recipients, title, message);

//     res.json({
//       success: true,
//       message: `Notification sent to ${recipients.length} recipients`,
//       count: recipients.length
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// module.exports = exports;



// controllers/adminController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Provider')
const Vehicle = require('../models/Vehicle');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');

// ===== DASHBOARD CONTROLLERS =====

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDrivers,
      totalRides,
      activeRides,
      pendingDrivers,
      todayRevenue
    ] = await Promise.all([
      User.countDocuments({ $or: [{ role: 'customer' }, { roles: 'customer' }] }),
      Driver.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ['accepted', 'arrived', 'started', 'working'] } }),
      Driver.countDocuments({ isApproved: false, isRejected: { $ne: true } }),
      Ride.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$fare' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalRides,
        activeRides,
        pendingDrivers,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// const getRecentActivity = async (req, res) => {
//   try {
//     const { limit = 10 } = req.query;

//     const recentRides = await Ride.find()
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .populate('user', 'name email')
//       .populate('driver', 'name phone')
//       .select('status pickup dropoff fare createdAt');

//     res.json({
//       success: true,
//       data: recentRides
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };



const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

      // âœ… FIXED POPULATE
      .populate('customer', 'name email phone')
      .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] })

      .select(`
        status
        pickup
        drop
        fare
        finalFare
        vehicleType
        paymentMethod
        paymentStatus
        createdAt
      `);

    res.status(200).json({
      success: true,
      data: recentRides
    });
  } catch (error) {
    console.error('Recent Activity Error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


const getRevenueChart = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const revenueData = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: { $ifNull: ['$finalFare', '$fare'] } },
          rides: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));

    const metrics = await Promise.all([
      Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: lastMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$finalFare', '$fare'] } }
          }
        }
      ]),
      Driver.countDocuments({ isOnline: true }),
      Driver.aggregate([
        { $match: { 'rating.count': { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating.average' }
          }
        }
      ]),
      Ride.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        monthlyRevenue: metrics[0][0]?.total || 0,
        activeDrivers: metrics[1],
        averageRating: metrics[2][0]?.avgRating || 0,
        completionRate: metrics[3][0]
          ? (metrics[3][0].completed / metrics[3][0].total * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== DASHBOARD OVERVIEW (single call â€” admin dashboard home page) =====

// Service categories jaise dashboard pe dikhte hain â€” vehicleType ko inme group karte hain
const VEHICLE_GROUPS = {
  auto_cab:  ['auto', 'car', 'bike'],
  tractor:   ['tractor'],
  goods:     ['truck', 'tempo'],
  jcb:       ['jcb'],
  ambulance: ['ambulance'],
  wedding:   ['wedding'],
};

const SERVICE_LABELS = {
  auto: 'Auto', bike: 'Bike', car: 'Cab', tractor: 'Tractor',
  tempo: 'Tempo', truck: 'Goods', jcb: 'JCB', ambulance: 'Ambulance', wedding: 'Wedding',
};

const ACTIVE_RIDE_STATUSES = ['accepted', 'arrived', 'started', 'working'];

const mapLiveStatus = (ride) => {
  if (ride.status === 'completed') return 'done';
  if (ride.status === 'cancelled') return 'cancelled';
  if (ride.vehicleType === 'ambulance') return 'urgent';
  if (ACTIVE_RIDE_STATUSES.includes(ride.status)) return 'active';
  return 'wait';
};

const getDashboardOverview = async (req, res) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      todayBookings,
      activeBookings,
      pendingBookings,
      activeDrivers,
      todayRevenueAgg,
      yesterdayRevenueAgg,
      ratingAgg,
      serviceWiseAgg,
      liveRides,
    ] = await Promise.all([
      Ride.countDocuments({ createdAt: { $gte: todayStart } }),
      Ride.countDocuments({ status: { $in: ACTIVE_RIDE_STATUSES } }),
      Ride.countDocuments({ status: { $in: ['searching', 'scheduled'] } }),
      Driver.countDocuments({ isOnline: true }),
      Ride.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$finalFare', '$fare'] } } } },
      ]),
      Ride.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$finalFare', '$fare'] } } } },
      ]),
      Driver.aggregate([
        { $match: { 'rating.count': { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating.average' } } },
      ]),
      Ride.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      ]),
      Ride.find({ createdAt: { $gte: todayStart } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('customer', 'name')
        .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name' }, { path: 'activeVehicle' }] })
        .select('vehicleType status customer provider createdAt'),
    ]);

    // Service-wise booking count â€” vehicleType ko group mein daalo
    const serviceWiseBookings = Object.fromEntries(Object.keys(VEHICLE_GROUPS).map((g) => [g, 0]));
    serviceWiseAgg.forEach(({ _id: vehicleType, count }) => {
      const group = Object.keys(VEHICLE_GROUPS).find((g) => VEHICLE_GROUPS[g].includes(vehicleType));
      if (group) serviceWiseBookings[group] += count;
    });

    const liveBookings = liveRides.map((ride) => ({
      id: ride._id,
      service: SERVICE_LABELS[ride.vehicleType] || ride.vehicleType,
      customer: ride.customer?.name || 'N/A',
      driver: ride.provider?.user?.name || 'Pending',
      status: mapLiveStatus(ride),
    }));

    res.json({
      success: true,
      data: {
        stats: {
          todayBookings,
          activeBookings,
          pendingBookings,
          activeDrivers,
          todayRevenue: todayRevenueAgg[0]?.total || 0,
          yesterdayRevenue: yesterdayRevenueAgg[0]?.total || 0,
          averageRating: ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 0,
        },
        serviceWiseBookings,
        liveBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== AI AGENT TASKS (real data se derive kiye gaye tasks) =====

const getAIAgentTasks = async (req, res) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);

    const [autoConfirmedToday, pendingDrivers, newApprovedDrivers] = await Promise.all([
      Ride.countDocuments({
        createdAt: { $gte: todayStart },
        provider: { $ne: null },
        status: { $ne: 'cancelled' },
      }),
      Driver.find({ isApproved: false, isRejected: { $ne: true } }).populate('user', 'name').populate('vehicles').limit(5).select('user createdAt'),
      Driver.find({ isApproved: true, updatedAt: { $gte: yesterday } }).populate('user', 'name').populate('vehicles').limit(5).select('user updatedAt'),
    ]);

    const tasks = [];

    if (autoConfirmedToday > 0) {
      tasks.push({
        type: 'auto_confirm',
        title: `${autoConfirmedToday} bookings auto-confirm`,
        subtitle: 'Driver milaya, SMS bheja gaya',
        count: autoConfirmedToday,
      });
    }

    if (pendingDrivers.length > 0) {
      tasks.push({
        type: 'driver_onboarding',
        title: `${pendingDrivers.length} drivers onboarding pending`,
        subtitle: 'Documents verify karne hain',
        count: pendingDrivers.length,
        drivers: pendingDrivers.map((d) => ({
          id: d._id,
          name: d.user?.name || 'N/A',
          vehicleType: d.vehicles?.[0]?.type,
        })),
      });
    }

    if (newApprovedDrivers.length > 0) {
      tasks.push({
        type: 'broadcast_ready',
        title: 'WhatsApp broadcast ready',
        subtitle: `Naya ${newApprovedDrivers[0].vehicles?.[0]?.type || ''} driver join hua â€” customers ko batao`,
        count: newApprovedDrivers.length,
        drivers: newApprovedDrivers.map((d) => ({
          id: d._id,
          name: d.user?.name || 'N/A',
          vehicleType: d.vehicles?.[0]?.type,
        })),
      });
    }

    // Kisan marketplace â€” yeh feature abhi backend mein nahi bana hai
    tasks.push({
      type: 'kisan_marketplace',
      title: 'Kisan marketplace',
      subtitle: 'Yeh feature abhi develop nahi hua hai',
      available: false,
    });

    res.json({ success: true, data: { tasks } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== DRIVERS MANAGEMENT =====

const createDriver = async (req, res) => {
  try {
    const { name, phone, email, city, vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Naam aur phone required hai' });
    }
    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle type aur number required hai' });
    }

    const existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Is phone number se account already exist karta hai' });
    }

    const existingVehicle = await Vehicle.findOne({ number: vehicleNumber.trim().toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Yeh vehicle number pehle se registered hai' });
    }

    const user = await User.create({
      name:       name.trim(),
      phone:      phone.trim(),
      email:      email ? email.trim().toLowerCase() : undefined,
      city:       city || '',
      role:       'provider',
      roles:      ['provider'],
      isVerified: true,
    });

    const driver = await Driver.create({
      user: user._id,
      isApproved: true,
      approvedAt: Date.now(),
      approvedBy: req.user._id,
      status: 'offline',
    });

    // Admin-onboarded driver â€” vehicle pre-verified aur turant active (kaam ke liye ready)
    const vehicle = await Vehicle.create({
      providerId: driver._id,
      type:   vehicleType,
      number: vehicleNumber.trim().toUpperCase(),
      model:  vehicleModel || '',
      color:  vehicleColor || '',
      isVerified: true,
      isActive:   true,
    });

    driver.activeVehicle = vehicle._id;
    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver onboard ho gaya',
      data: {
        ...driver.toObject(),
        vehicle,
        user: { _id: user._id, name: user.name, phone: user.phone }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Yeh phone ya vehicle number already registered hai' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, isApproved, isRejected, isBlocked, hasChangeRequest } = req.query;

    const matchStage = {};
    if (status === 'online') {
      matchStage.status = { $in: ['available', 'busy'] };
    } else if (status) {
      matchStage.status = status;
    }
    if (isApproved !== undefined) matchStage.isApproved = isApproved === 'true';
    if (isRejected !== undefined) matchStage.isRejected = isRejected === 'true';
    if (isBlocked !== undefined) matchStage.isBlocked = isBlocked === 'true';
    if (isApproved === 'false' && isRejected === undefined && isBlocked === undefined) {
      matchStage.isRejected = false;
      matchStage.isBlocked = false;
    }

    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'vehicles', localField: '_id', foreignField: 'providerId', as: 'vehicles' } },
      // Admin dashboard listing sirf "current" vehicle dikhata hai â€” activeVehicle ko
      // 'vehicle' (singular) naam se attach karo taaki wo field seedha match ho jaye
      { $lookup: { from: 'vehicles', localField: 'activeVehicle', foreignField: '_id', as: 'vehicle' } },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
    ];

    // Driver ke kisi bhi vehicle pe pending change-request ho, use match karo —
    // 'vehicles' lookup ke baad hi ye field available hota hai, isliye matchStage
    // (jo pipeline se pehle Driver root fields pe chalta hai) mein nahi daala.
    if (hasChangeRequest === 'true') {
      pipeline.push({ $match: { 'vehicles.changeRequest.status': 'pending' } });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.phone': { $regex: search, $options: 'i' } },
            { 'vehicles.number': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $project: { 'user.password': 0 } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }],
          totalCount: [{ $count: 'count' }],
        },
      }
    );

    const result = await Driver.aggregate(pipeline);
    const drivers = result[0]?.data || [];
    const count = result[0]?.totalCount[0]?.count || 0;

    res.json({
      success: true,
      data: drivers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// controllers/adminController.js

// controllers/adminController.js

const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user', '-password')
      .populate('activeVehicle')
      .populate('vehicles');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver's ride statistics
    const rideStats = await Ride.aggregate([
      { $match: { provider: driver._id } },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          avgRating: { $avg: '$rating.driverRating' }
        }
      }
    ]);

    // Dashboard purane single-vehicle model se 'vehicle' (singular) bhi expect karta
    // hai — activeVehicle ko alias kar do (jaisa getActiveDriversLocation mein hai),
    // 'vehicles' (plural, virtual populate) poori list ke liye rehta hai.
    const obj = driver.toObject();
    obj.vehicle = obj.activeVehicle;

    res.json({
      success: true,
      data: {
        ...obj,
        stats: rideStats[0] || {
          totalRides: 0,
          completedRides: 0,
          totalEarnings: 0,
          avgRating: 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getDriverById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// const getDriverById = async (req, res) => {
//   try {
//     const driver = await Driver.findById(req.params.id)
//       .select('-password');

//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: 'Driver not found'
//       });
//     }

//     const rideStats = await Ride.aggregate([
//       { $match: { driver: driver._id } },
//       {
//         $group: {
//           _id: null,
//           totalRides: { $sum: 1 },
//           completedRides: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           totalEarnings: { $sum: '$fare' },
//           avgRating: { $avg: '$rating' }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         ...driver.toObject(),
//         stats: rideStats[0] || {
//           totalRides: 0,
//           completedRides: 0,
//           totalEarnings: 0,
//           avgRating: 0
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

const approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        isApproved:  true,
        approvedAt:  Date.now(),
        approvedBy:  req.user._id,
        isRejected:  false,
      },
      { new: true }
    ).populate('user', 'name');

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Push notification â€” driver ko batao ki account approve ho gaya
    const fcmToken = driver.deviceInfo?.fcmToken;
    if (fcmToken) {
      const { notify } = require('../utils/notifications');
      notify.accountApproved(fcmToken, { driverName: driver.user?.name || 'Driver' }).catch(() => {});
    }

    res.json({ success: true, message: 'Driver approved successfully', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

const rejectDriver = async (req, res) => {
  try {
    const { reason } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        isRejected: true,
        rejectionReason: reason,
        rejectedAt: Date.now(),
        rejectedBy: req.user._id
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver rejected',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const blockDriver = async (req, res) => {
  try {
    const { reason } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked: true,
        blockReason: reason,
        blockedAt: Date.now(),
        blockedBy: req.user._id
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver blocked successfully',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const unblockDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked: false,
        blockReason: null,
        unblockedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver unblocked successfully',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver status updated',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const activeRides = await Ride.countDocuments({
      provider: driver._id,
      status: { $in: ACTIVE_RIDE_STATUSES }
    });

    if (activeRides > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete driver with active rides'
      });
    }

    await Driver.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Provider-level KYC doc verification (aadhaar only â€” vehicle docs use verifyVehicleDocument)
const verifyDocument = async (req, res) => {
  try {
    const { documentType, status } = req.body;

    const VERIFIABLE_DOCS = ['aadhaar'];
    if (!VERIFIABLE_DOCS.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType ek inme se hona chahiye: ${VERIFIABLE_DOCS.join(', ')}`
      });
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    driver.documents[documentType] = driver.documents[documentType] || {};
    driver.documents[documentType].verified = status === 'verified';
    driver.documents[documentType].verifiedAt = Date.now();
    driver.documents[documentType].verifiedBy = req.user._id;

    await driver.save();

    res.json({
      success: true,
      message: 'Document verification updated',
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Bank details verify â€” bina isà¤•à¥‡ withdrawal (/wallet/withdraw) kabhi allow nahi hota
const verifyBankDetails = async (req, res) => {
  try {
    const { verified } = req.body;

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.bankDetails || !driver.bankDetails.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Driver ne abhi bank details add hi nahi ki hai'
      });
    }

    driver.bankDetails.verified = verified !== false;
    await driver.save();

    res.json({
      success: true,
      message: `Bank details ${driver.bankDetails.verified ? 'verified' : 'unverified'}`,
      data: driver.bankDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Driver khud apna profile (naam/phone/email/city) edit nahi kar sakta app se —
// typo ya galat detail ho to admin yahan se User document seedhe update kar deta hai.
const updateDriverProfileAdmin = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    if (!driver.user) {
      return res.status(404).json({ success: false, message: 'Driver ka user account nahi mila' });
    }

    const { name, phone, email, city } = req.body;
    if (name !== undefined) driver.user.name = name.trim();
    if (phone !== undefined) driver.user.phone = phone.trim();
    if (email !== undefined) driver.user.email = email.trim().toLowerCase();
    if (city !== undefined) driver.user.city = city;

    await driver.user.save();

    res.json({ success: true, message: 'Driver profile updated', data: driver.user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Yeh phone ya email pehle se kisi aur account mein use ho raha hai' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Bank details verify (upar) sirf true/false flip karta hai — driver ne galat
// account number/IFSC daal diya ho aur khud fix na kar paaye to admin ye fields
// seedhe edit kar sakta hai (edit hone par verified reset ho jaata hai, dobara verify karna hoga).
const updateBankDetailsAdmin = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;
    driver.bankDetails = driver.bankDetails || {};
    if (accountHolderName !== undefined) driver.bankDetails.accountHolderName = accountHolderName;
    if (accountNumber !== undefined) driver.bankDetails.accountNumber = accountNumber;
    if (ifscCode !== undefined) driver.bankDetails.ifscCode = ifscCode.toUpperCase();
    if (bankName !== undefined) driver.bankDetails.bankName = bankName;
    driver.bankDetails.verified = false; // details badli hain, dobara verify karna zaroori hai

    await driver.save();

    res.json({ success: true, message: 'Bank details updated, verification reset ho gayi', data: driver.bankDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Driver khud upload nahi kar pa raha (phone/camera issue, confusion, etc.) —
// admin uski taraf se seedhe aadhaar/photo upload kar deta hai.
const uploadDriverDocumentAdmin = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const { documentType } = req.body;
    const validTypes = ['aadhaar', 'photo'];
    if (!documentType || !validTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: `documentType ek inme se hona chahiye: ${validTypes.join(', ')}` });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document' });
    }

    if (documentType === 'photo') {
      driver.documents.photo = req.file.path;
    } else {
      driver.documents[documentType] = driver.documents[documentType] || {};
      driver.documents[documentType].photo = req.file.path;
      driver.documents[documentType].verified = false;
    }

    await driver.save();

    res.json({ success: true, message: 'Document uploaded', data: { documentType, url: req.file.path } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===== VEHICLES MANAGEMENT =====

const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, providerId, type, isVerified } = req.query;

    const query = {};
    if (providerId) query.providerId = providerId;
    if (type) query.type = type;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const vehicles = await Vehicle.find(query)
      .populate({ path: 'providerId', select: 'user', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Driver kisi wajah se khud driverApp se vehicle add nahi kar pa raha (app issue,
// confusion, etc.) — admin uski taraf se seedhe vehicle bana deta hai. Baaki flow
// wahi rehta hai: unverified create hoti hai, docs upload aur approval baad mein.
const addVehicleAdmin = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const { vehicleType, vehicleNumber, vehicleModel, vehicleColor, registrationYear } = req.body;
    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle type aur number required hai' });
    }

    const existingVehicle = await Vehicle.findOne({ number: vehicleNumber.trim().toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Yeh vehicle number pehle se registered hai' });
    }

    const vehicle = await Vehicle.create({
      providerId: driver._id,
      type: vehicleType,
      number: vehicleNumber.trim().toUpperCase(),
      model: vehicleModel || '',
      color: vehicleColor || '',
      registrationYear,
      isVerified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Vehicle add ho gayi', data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Yeh vehicle number pehle se registered hai' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getVehicleByIdAdmin = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate({ path: 'providerId', select: 'user', populate: { path: 'user', select: 'name phone' } });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const approveVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // License aur RC mandatory hain approve ke liye; Insurance optional hai
    const missing = [];
    if (!vehicle.documents?.license?.verified) missing.push('Driving License');
    if (!vehicle.documents?.rc?.verified) missing.push('Vehicle RC');
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Approve karne se pehle in documents ko verify karna zaroori hai: ${missing.join(', ')}`
      });
    }

    vehicle.isVerified = true;
    vehicle.isRejected = false;
    await vehicle.save();

    res.json({ success: true, message: 'Vehicle approved', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const rejectVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isVerified: false, isRejected: true, rejectionReason: req.body.reason || '' },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle rejected', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deleteVehicleAdmin = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Agar yehi kisi provider ki active vehicle hai, to unlink karo pehle
    await Driver.updateMany({ activeVehicle: vehicle._id }, { $set: { activeVehicle: null, isOnline: false, status: 'offline' } });

    await Vehicle.findByIdAndDelete(vehicle._id);

    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Vehicle-level document verification (rc/insurance/license/permit/fitness/machineRegistration/operatorLicense)
const verifyVehicleDocument = async (req, res) => {
  try {
    const { documentType, status } = req.body;

    const VERIFIABLE_VEHICLE_DOCS = ['rc', 'insurance', 'license', 'permit', 'fitness', 'machineRegistration', 'operatorLicense'];
    if (!VERIFIABLE_VEHICLE_DOCS.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType ek inme se hona chahiye: ${VERIFIABLE_VEHICLE_DOCS.join(', ')}`
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.documents[documentType] = vehicle.documents[documentType] || {};
    vehicle.documents[documentType].verified = status === 'verified';
    vehicle.documents[documentType].verifiedAt = Date.now();
    vehicle.documents[documentType].verifiedBy = req.user._id;

    await vehicle.save();

    res.json({
      success: true,
      message: 'Document verification updated',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Driver khud upload nahi kar pa raha to admin uski vehicle ke docs (license/rc/
// insurance/etc) seedhe upload kar deta hai — providerController.uploadVehicleDocument
// jaisa hi, bas provider-ownership check yahan nahi (admin kisi bhi vehicle pe kar sakta hai).
const VEHICLE_DOC_TYPES_ADMIN = ['rc', 'insurance', 'license', 'permit', 'fitness', 'machineRegistration', 'operatorLicense'];
const uploadVehicleDocumentAdmin = async (req, res) => {
  try {
    const { documentType } = req.body;
    if (!documentType || !VEHICLE_DOC_TYPES_ADMIN.includes(documentType)) {
      return res.status(400).json({ success: false, message: `documentType ek inme se hona chahiye: ${VEHICLE_DOC_TYPES_ADMIN.join(', ')}` });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.documents[documentType] = vehicle.documents[documentType] || {};
    vehicle.documents[documentType].photo = req.file.path;
    vehicle.documents[documentType].verified = false;

    await vehicle.save();

    res.json({ success: true, message: 'Document uploaded', data: { documentType, url: req.file.path } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin hi verified vehicle ki details edit kar sakta hai (driver ke liye ye
// driverApp mein locked hain — wo sirf change-request bhej sakta hai, admin
// yahan se seedhe fields update kar deta hai).
const updateVehicleAdmin = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const { type, number, model, color, registrationYear } = req.body;
    if (type !== undefined) vehicle.type = type;
    if (number !== undefined) vehicle.number = number.trim().toUpperCase();
    if (model !== undefined) vehicle.model = model;
    if (color !== undefined) vehicle.color = color;
    if (registrationYear !== undefined) vehicle.registrationYear = registrationYear;

    await vehicle.save();

    res.json({ success: true, message: 'Vehicle updated', data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Yeh vehicle number pehle se registered hai' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Driver ki change-request ko resolved mark karo — admin isse pehle updateVehicleAdmin
// (ya vehicle ke doc/approve flow) se zaroori badlav kar chuka hoga.
const resolveVehicleChangeRequest = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    if (vehicle.changeRequest?.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Koi pending change request nahi hai' });
    }

    vehicle.changeRequest.status = 'resolved';
    vehicle.changeRequest.resolvedAt = new Date();
    vehicle.changeRequest.resolvedBy = req.user._id;
    await vehicle.save();

    res.json({ success: true, message: 'Change request resolve ho gayi', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getDriverStats = async (req, res) => {
  try {
    const driverId = new mongoose.Types.ObjectId(req.params.id);

    const stats = await Ride.aggregate([
      { $match: { provider: driverId } },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledRides: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          avgRating: { $avg: '$rating.driverRating' },
          totalDistance: { $sum: '$distance' },
          avgFare: { $avg: { $ifNull: ['$finalFare', '$fare'] } }
        }
      }
    ]);

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayStats = await Ride.aggregate([
      {
        $match: {
          provider: driverId,
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          todayRides: { $sum: 1 },
          todayEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalRides: 0,
          completedRides: 0,
          cancelledRides: 0,
          totalEarnings: 0,
          avgRating: 0,
          totalDistance: 0,
          avgFare: 0
        },
        today: todayStats[0] || {
          todayRides: 0,
          todayEarnings: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== RIDES MANAGEMENT =====

const getAllRides = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, driverId, userId, startDate, endDate } = req.query;

    const query = {};

    if (status) query.status = status;
    if (driverId) query.provider = driverId;
    if (userId) query.customer = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const rides = await Ride.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone')
      .populate('vehicle')
      .populate({ path: 'provider', select: 'user activeVehicle rating', populate: { path: 'user', select: 'name phone' } });

    const count = await Ride.countDocuments(query);

    res.json({
      success: true,
      data: rides,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getRideDetails = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name email phone profileImage')
      .populate('vehicle')
      .populate({ path: 'provider', select: 'user activeVehicle rating', populate: { path: 'user', select: 'name email phone profileImage' } });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const cancelRideAdmin = async (req, res) => {
  try {
    const { reason } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this ride'
      });
    }

    ride.status = 'cancelled';
    ride.cancellationReason = reason;
    ride.cancelledBy = 'admin';
    ride.cancelledAt = Date.now();

    await ride.save();

    res.json({
      success: true,
      message: 'Ride cancelled successfully',
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getRideStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const stats = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          ongoing: {
            $sum: { $cond: [{ $in: ['$status', ACTIVE_RIDE_STATUSES] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          avgFare: { $avg: { $ifNull: ['$finalFare', '$fare'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalRides: 0,
        completed: 0,
        cancelled: 0,
        ongoing: 0,
        totalRevenue: 0,
        avgFare: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getOngoingRides = async (req, res) => {
  try {
    const ongoingRides = await Ride.find({
      status: { $in: ACTIVE_RIDE_STATUSES }
    })
      .populate('customer', 'name phone')
      .populate({ path: 'provider', select: 'user activeVehicle currentLocation', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ongoingRides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const trackRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .select('status pickup drop provider')
      .populate({ path: 'provider', select: 'user activeVehicle currentLocation', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getActiveDriversLocation = async (req, res) => {
  try {
    const activeDrivers = await Driver.find({
      isOnline: true,
      isApproved: true,
      isBlocked: { $ne: true }
    })
      .populate('user', 'name phone')
      .populate('activeVehicle')
      .select('user activeVehicle currentLocation status');

    // Dashboard 'vehicle' (singular) expect karta hai â€” activeVehicle ko alias kar do
    const data = activeDrivers.map((d) => {
      const obj = d.toObject();
      obj.vehicle = obj.activeVehicle;
      return obj;
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== PAYMENTS =====

const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;

    // Ride hi payment record hai â€” fare/paymentMethod/paymentStatus usi mein hain
    const query = {};

    if (status) query.paymentStatus = status;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Ride.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone')
      .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] })
      .select('customer provider vehicleType fare finalFare paymentMethod paymentStatus status createdAt');

    const count = await Ride.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    const commissionPct = setting?.commission?.percentage ?? 0;

    const stats = await Ride.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$finalFare', '$fare'] } },
          totalTransactions: { $sum: 1 },
          cashPayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          onlinePayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAmount: 0,
      totalTransactions: 0,
      cashPayments: 0,
      onlinePayments: 0,
      successfulPayments: 0,
      failedPayments: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        totalCommission: Math.round(result.totalAmount * commissionPct / 100),
        commissionPercent: commissionPct,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getPendingWithdrawals = async (req, res) => {
  try {
    // Driver withdrawal requests Transaction collection mein store hote hain (type:'debit')
    const withdrawals = await Transaction.find({ type: 'debit', status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'provider',
        select: 'user activeVehicle wallet bankDetails',
        populate: { path: 'user', select: 'name phone' },
      });

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const processWithdrawal = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status 'completed' ya 'failed' hona chahiye" });
    }

    const txn = await Transaction.findOne({ _id: req.params.id, type: 'debit', status: 'pending' });
    if (!txn) {
      return res.status(404).json({ success: false, message: 'Pending withdrawal request nahi mili' });
    }

    txn.status = status;
    txn.processedAt = new Date();
    if (status === 'failed') txn.failureReason = remarks;
    await txn.save();

    if (status === 'completed') {
      // Pending amount clear karo, total withdrawals mein add karo
      await Driver.findByIdAndUpdate(txn.provider, {
        $inc: { 'wallet.pendingAmount': -txn.amount, 'wallet.totalWithdrawals': txn.amount },
      });
    } else {
      // Failed â€” amount wapas balance mein refund karo
      await Driver.findByIdAndUpdate(txn.provider, {
        $inc: { 'wallet.balance': txn.amount, 'wallet.pendingAmount': -txn.amount },
      });
    }

    res.json({
      success: true,
      message: `Withdrawal ${status}`,
      data: txn
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getCommissionReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    const setting = await Setting.findOne();
    const commissionPct = setting?.commission?.percentage ?? 0;

    const query = { status: 'completed' };
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) query.createdAt.$lte = new Date(to_date);
    }

    const daily = await Ride.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalAmount: { $sum: { $ifNull: ['$finalFare', '$fare'] } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyWithCommission = daily.map((d) => ({
      date: d._id,
      totalAmount: d.totalAmount,
      transactionCount: d.transactionCount,
      totalCommission: Math.round(d.totalAmount * commissionPct / 100),
    }));

    const totalRevenue = daily.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalTransactions = daily.reduce((sum, d) => sum + d.transactionCount, 0);

    res.json({
      success: true,
      data: {
        daily: dailyWithCommission,
        summary: {
          totalCommission: Math.round(totalRevenue * commissionPct / 100),
          totalRevenue,
          totalTransactions,
          commissionPercent: commissionPct,
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== USERS =====

const createUser = async (req, res) => {
  try {
    const { name, phone, email, city } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Naam aur phone required hai' });
    }

    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Is phone number se account already exist karta hai' });
    }

    const user = await User.create({
      name:       name.trim(),
      phone:      phone.trim(),
      email:      email ? email.trim().toLowerCase() : undefined,
      city:       city || '',
      role:       'customer',
      roles:      ['customer'],
      isVerified: true,
    });

    res.status(201).json({ success: true, message: 'User onboard ho gaya', data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Is phone/email se account already exist karta hai' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isBlocked, isVerified } = req.query;

    // 'customer' role wale ya dual-role mein customer wale users
    const customerFilter = { $or: [{ role: 'customer' }, { roles: 'customer' }] };
    const extra = {};
    if (isBlocked !== undefined) extra.isBlocked = isBlocked === 'true';
    if (isVerified !== undefined) extra.isVerified = isVerified === 'true';

    const query = search
      ? {
          $and: [
            customerFilter,
            extra,
            { $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } }
            ] }
          ]
        }
      : { ...customerFilter, ...extra };

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .select('-password');

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const rides = await Ride.find({ customer: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name' }, { path: 'activeVehicle' }] });

    const stats = await Ride.aggregate([
      { $match: { customer: user._id } },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$finalFare', '$fare'] } },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledRides: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user,
        recentRides: rides,
        stats: stats[0] || {
          totalRides: 0,
          totalSpent: 0,
          completedRides: 0,
          cancelledRides: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked: true,
        blockReason: reason,
        blockedAt: Date.now(),
        blockedBy: req.user._id
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User blocked successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isBlocked: false,
        blockReason: null,
        unblockedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User unblocked successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== SETTINGS =====

const { invalidateSettingsCache } = require('../utils/dynamicFare');

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne().lean();
    if (!settings) {
      settings = await Setting.create({});
      settings = settings.toObject();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Settings fetch error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// PUT /api/admin/settings
// Body: partial settings object â€” jo bhejo woh update hoga
const updateSettings = async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );

    // Cache invalidate karo â€” next request pe fresh data aayega
    await invalidateSettingsCache();

    res.json({ success: true, message: 'Settings update ho gayi!', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Settings update error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// PUT /api/admin/pricing
// Body: { vehicleType: 'auto', baseFare: 30, perKmRate: 14, minimumFare: 35 }
// Ya surge update: { surge: { highDemand: { enabled: true, multiplier: 1.5, reason: "Festival" } } }
const updatePricing = async (req, res) => {
  try {
    const { vehicleType, baseFare, perKmRate, minimumFare, surge, waiting, commission } = req.body;

    const updateObj = {};

    // Vehicle rate update
    if (vehicleType && baseFare !== undefined) {
      updateObj[`vehicleRates.${vehicleType}.baseFare`]    = baseFare;
      updateObj[`vehicleRates.${vehicleType}.perKmRate`]   = perKmRate;
      updateObj[`vehicleRates.${vehicleType}.minimumFare`] = minimumFare;
    }

    // Surge update
    if (surge) {
      Object.entries(surge).forEach(([key, val]) => {
        updateObj[`surge.${key}`] = val;
      });
    }

    // Waiting charge update
    if (waiting) {
      Object.entries(waiting).forEach(([key, val]) => {
        updateObj[`waiting.${key}`] = val;
      });
    }

    // Commission update
    if (commission?.percentage !== undefined) {
      updateObj['commission.percentage'] = commission.percentage;
    }

    if (!Object.keys(updateObj).length) {
      return res.status(400).json({ success: false, message: 'Kuch update karne ke liye body mein data do' });
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: updateObj },
      { new: true, upsert: true }
    );

    // Cache invalidate â€” fare calculator fresh rates lo
    await invalidateSettingsCache();

    res.json({ success: true, message: 'Pricing update ho gayi! ðŸŽ‰', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Pricing update error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// GET /api/admin/hourly-rates
// Tractor/JCB ke "Kaam ka Prakar" + "Service" rates â€” app mein isi se dikhte hain
const getHourlyRates = async (req, res) => {
  try {
    let settings = await Setting.findOne().lean();
    if (!settings) {
      settings = await Setting.create({});
      settings = settings.toObject();
    }
    res.json({ success: true, data: settings.hourlyRates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Hourly rates fetch error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// PUT /api/admin/hourly-rates
// Body: { vehicleType: 'tractor', categoryId: 'farming', serviceId: 'ploughing', rate: 850, minimumHours: 1, label: '...' }
const updateHourlyRate = async (req, res) => {
  try {
    const { vehicleType, categoryId, serviceId, rate, minimumHours, label } = req.body;

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    // hourlyRates is a Map now — dynamic keys, use .has()/.get() not bracket access
    if (!settings.hourlyRates.has(vehicleType)) {
      return res.status(400).json({ success: false, message: 'Is vehicle type ke liye hourly rates configured nahi hain' });
    }
    if (rate === undefined || rate === null || Number(rate) < 0) {
      return res.status(400).json({ success: false, message: 'Valid rate dena zaroori hai' });
    }

    const categories = settings.hourlyRates.get(vehicleType);
    const category    = categories?.find((c) => c.id === categoryId);
    const service      = category?.sub?.find((s) => s.id === serviceId);

    if (!category || !service) {
      return res.status(404).json({ success: false, message: 'Service ya category nahi mili' });
    }

    service.rate = Number(rate);
    if (minimumHours !== undefined) service.minimumHours = Number(minimumHours);
    if (label) service.label = label;

    // Mutating an array nested inside a Map value in place doesn't always
    // get picked up by Mongoose's dirty-tracking — mark the whole map dirty.
    settings.markModified('hourlyRates');
    await settings.save();

    // Cache invalidate â€” app mein fresh rates aaye
    await invalidateSettingsCache();

    res.json({ success: true, message: 'Rate update ho gaya! ðŸŽ‰', data: settings.hourlyRates.get(vehicleType) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Hourly rate update error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// GET /api/admin/vehicle-types
// Puri vehicle-type catalog — pricing table admin dashboard isi se banata hai
const getVehicleTypes = async (req, res) => {
  try {
    let settings = await Setting.findOne().lean();
    if (!settings) {
      settings = await Setting.create({});
      settings = settings.toObject();
    }

    const vehicleRates = settings.vehicleRates || {};
    const hourlyRates   = settings.hourlyRates  || {};

    const types = Object.entries(vehicleRates).map(([id, r]) => ({
      id,
      label:        r.label || id,
      icon:         r.icon || '',
      baseFare:     r.baseFare,
      perKmRate:    r.perKmRate,
      minimumFare:  r.minimumFare,
      isActive:     r.isActive !== false,
      supportsHourly: Array.isArray(hourlyRates[id]) && hourlyRates[id].length > 0,
    }));

    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vehicle types fetch error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// POST /api/admin/vehicle-types
// Body: { id: 'pickup', label: 'Pickup Truck', icon: '', baseFare, perKmRate, minimumFare, hourlyCategories? }
const createVehicleType = async (req, res) => {
  try {
    const { id, label, icon = '', baseFare, perKmRate, minimumFare, hourlyCategories } = req.body;

    if (!id || !/^[a-z0-9_]+$/.test(id)) {
      return res.status(400).json({ success: false, message: 'id sirf lowercase letters, numbers, underscore mein dena hai (jaise "pickup")' });
    }
    if (!label) {
      return res.status(400).json({ success: false, message: 'Label dena zaroori hai' });
    }
    if ([baseFare, perKmRate, minimumFare].some((v) => v === undefined || v === null || Number(v) < 0)) {
      return res.status(400).json({ success: false, message: 'Valid baseFare, perKmRate, minimumFare dena zaroori hai' });
    }

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    if (settings.vehicleRates.has(id)) {
      return res.status(409).json({ success: false, message: `"${id}" vehicle type pehle se maujood hai` });
    }

    settings.vehicleRates.set(id, {
      baseFare:    Number(baseFare),
      perKmRate:   Number(perKmRate),
      minimumFare: Number(minimumFare),
      isActive:    true,
      label,
      icon,
    });

    if (Array.isArray(hourlyCategories) && hourlyCategories.length > 0) {
      settings.hourlyRates.set(id, hourlyCategories);
    }

    settings.markModified('vehicleRates');
    settings.markModified('hourlyRates');
    await settings.save();
    await invalidateSettingsCache();

    res.status(201).json({ success: true, message: 'Vehicle type add ho gaya! ðŸŽ‰', data: { id, label, icon, baseFare, perKmRate, minimumFare } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vehicle type create error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// DELETE /api/admin/vehicle-types/:id
const deleteVehicleType = async (req, res) => {
  try {
    const { id } = req.params;

    let settings = await Setting.findOne();
    if (!settings || !settings.vehicleRates.has(id)) {
      return res.status(404).json({ success: false, message: 'Vehicle type nahi mila' });
    }

    // Registered vehicles use this type raw (no FK to Setting) — deleting the
    // catalog entry out from under them would silently fall back to 'auto'
    // pricing for their rides. Block until they're reassigned.
    const inUse = await Vehicle.exists({ type: id });
    if (inUse) {
      return res.status(400).json({ success: false, message: 'Is type ki vehicles registered hain, pehle unhe reassign karo' });
    }

    settings.vehicleRates.delete(id);
    settings.hourlyRates.delete(id);
    settings.markModified('vehicleRates');
    settings.markModified('hourlyRates');
    await settings.save();
    await invalidateSettingsCache();

    res.json({ success: true, message: 'Vehicle type delete ho gaya' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vehicle type delete error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// GET /api/admin/config
const getSystemConfig = async (req, res) => {
  try {
    const config = {
      version:     process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        payment:          true,
        notifications:    true,
        realTimeTracking: true,
        scheduling:       true,
        sos:              true,
        promoCode:        true,
        invoice:          true,
        rating:           true,
      },
      limits: {
        maxRideDistance:   100,  // km
        maxWaitingTime:    15,   // min
        maxDriverRadius:   15,   // km
        otpExpiry:         10,   // min
        accessTokenExpiry: 15,   // min
      },
    };
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Config fetch error' });
  }
};

// ===== ANALYTICS =====

const getAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch(period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const [rideAnalytics, userGrowth, driverGrowth] = await Promise.all([
      Ride.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRides: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            $or: [{ role: 'customer' }, { roles: 'customer' }],
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      Driver.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            newDrivers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        rides: rideAnalytics,
        userGrowth,
        driverGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const exportReport = async (req, res) => {
  try {
    const { type, from_date, to_date } = req.query;

    const query = {};
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) query.createdAt.$lte = new Date(to_date);
    }

    let data;
    let filename;

    switch(type) {
      case 'rides':
        data = await Ride.find(query)
          .populate('customer', 'name email phone')
          .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] })
          .lean();
        filename = 'rides-report.csv';
        break;

      case 'payments':
        data = await Ride.find({ ...query, status: 'completed' })
          .populate('customer', 'name email phone')
          .populate({ path: 'provider', select: 'user activeVehicle', populate: [{ path: 'user', select: 'name phone' }, { path: 'activeVehicle' }] })
          .select('customer provider vehicleType fare finalFare paymentMethod paymentStatus createdAt')
          .lean();
        filename = 'payments-report.csv';
        break;

      case 'drivers':
        data = await Driver.find()
          .select('-password')
          .lean();
        filename = 'drivers-report.csv';
        break;

      case 'users':
        data = await User.find({ $or: [{ role: 'customer' }, { roles: 'customer' }] })
          .select('-password')
          .lean();
        filename = 'users-report.csv';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Simple CSV conversion
    const fields = Object.keys(data[0] || {});
    const csv = [
      fields.join(','),
      ...data.map(row => fields.map(field => JSON.stringify(row[field] || '')).join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getDriverPerformance = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const driverId = req.params.id;
    
    let startDate;
    const now = new Date();
    
    switch(period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const driverObjectId = new mongoose.Types.ObjectId(driverId);

    const performance = await Ride.aggregate([
      {
        $match: {
          provider: driverObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          avgRating: { $avg: '$rating.driverRating' },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const overallStats = await Ride.aggregate([
      {
        $match: {
          provider: driverObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledRides: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, { $ifNull: ['$finalFare', '$fare'] }, 0] }
          },
          avgRating: { $avg: '$rating.driverRating' },
          totalDistance: { $sum: '$distance' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        daily: performance,
        overall: overallStats[0] || {
          totalRides: 0,
          completedRides: 0,
          cancelledRides: 0,
          totalEarnings: 0,
          avgRating: 0,
          totalDistance: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===== NOTIFICATIONS =====
const { notify, sendToDevice, sendToMultiple } = require('../utils/notifications');

// POST /api/admin/notifications/send
// Body: { recipientId, recipientType ('user'|'provider'), title, body }
const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientType, title, body, message } = req.body;
    const notifBody = body || message;

    if (!recipientId || !title || !notifBody) {
      return res.status(400).json({ success: false, message: 'recipientId, title, body required hai' });
    }

    let fcmToken = null;

    if (recipientType === 'provider') {
      const provider = await Provider.findById(recipientId).select('deviceInfo');
      fcmToken = provider?.deviceInfo?.fcmToken || null;
    } else {
      // Customer â€” future mein User model mein fcmToken add karna hoga
      const user = await User.findById(recipientId).select('fcmToken');
      fcmToken = user?.fcmToken || null;
    }

    if (!fcmToken) {
      return res.status(404).json({ success: false, message: 'FCM token nahi mila. User/Provider ka device token register nahi hai.' });
    }

    const sent = await sendToDevice(fcmToken, { title, body: notifBody, data: { type: 'ADMIN_MESSAGE' } });

    return res.json({
      success: true,
      message: sent ? 'Notification bhej diya gaya' : 'Notification fail hua (token invalid ho sakta hai)',
      sent,
    });
  } catch (error) {
    console.error('sendNotification Error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// POST /api/admin/notifications/bulk
// Body: { recipientType ('all'|'providers'|'customers'), title, body }
const sendBulkNotification = async (req, res) => {
  try {
    const { recipientType, title, body, message } = req.body;
    const notifBody = body || message;

    if (!title || !notifBody) {
      return res.status(400).json({ success: false, message: 'title aur body required hai' });
    }

    let tokens = [];

    if (recipientType === 'providers' || recipientType === 'all') {
      const providers = await Provider.find({ 'deviceInfo.fcmToken': { $exists: true, $ne: null } })
        .select('deviceInfo');
      const providerTokens = providers.map((p) => p.deviceInfo?.fcmToken).filter(Boolean);
      tokens.push(...providerTokens);
    }

    if (recipientType === 'customers' || recipientType === 'all') {
      // Future: User model mein fcmToken field add karo
      const users = await User.find({ fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
      const userTokens = users.map((u) => u.fcmToken).filter(Boolean);
      tokens.push(...userTokens);
    }

    if (!tokens.length) {
      return res.status(404).json({ success: false, message: 'Koi valid FCM token nahi mila' });
    }

    await sendToMultiple(tokens, { title, body: notifBody, data: { type: 'ADMIN_BROADCAST' } });

    return res.json({
      success: true,
      message: `${tokens.length} devices ko notification bheja gaya`,
      count: tokens.length,
    });
  } catch (error) {
    console.error('sendBulkNotification Error:', error);
    res.status(500).json({ success: false, message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: error.message }) });
  }
};

// ===== MANUAL DRIVER ASSIGN =====
const assignDriverToRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: 'driverId required hai' });

    const ride = await Ride.findById(req.params.id).populate('customer', 'name phone');
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });
    if (ride.status !== 'searching') return res.status(400).json({ success: false, message: `Ride abhi "${ride.status}" status mein hai — assign nahi ho sakti` });

    const driver = await Driver.findById(driverId).populate('user', 'name phone');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver nahi mila' });
    if (!driver.isApproved) return res.status(400).json({ success: false, message: 'Driver approved nahi hai' });
    if (driver.isBlocked) return res.status(400).json({ success: false, message: 'Driver blocked hai' });

    ride.provider = driverId;
    ride.status = 'accepted';
    await ride.save();

    res.json({ success: true, message: `${driver.user?.name || 'Driver'} ko ride assign kar diya!`, data: { driverName: driver.user?.name, driverPhone: driver.user?.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== EXPIRING DOCUMENTS =====
const getExpiringDocuments = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const Vehicle = require('../models/Vehicle');

    const vehicles = await Vehicle.find({ isActive: true })
      .populate({ path: 'providerId', populate: { path: 'user', select: 'name phone' } })
      .select('number type documents providerId');

    const DOC_LABELS = { rc: 'RC', insurance: 'Insurance', license: 'Driving License', permit: 'Permit', fitness: 'Fitness Certificate', machineRegistration: 'Machine Registration' };
    const alerts = [];

    for (const v of vehicles) {
      for (const [key, label] of Object.entries(DOC_LABELS)) {
        const doc = v.documents?.[key];
        if (!doc?.expiryDate) continue;
        const expiry = new Date(doc.expiryDate);
        if (expiry <= cutoff) {
          const daysLeft = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
          alerts.push({
            vehicleId: v._id,
            vehicleNumber: v.number,
            vehicleType: v.type,
            driverName: v.providerId?.user?.name || '—',
            driverPhone: v.providerId?.user?.phone || '—',
            driverId: v.providerId?._id,
            docType: label,
            docKey: key,
            expiryDate: expiry,
            daysLeft,
            expired: daysLeft < 0,
          });
        }
      }
    }

    alerts.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ success: true, data: alerts, total: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== COMPLAINTS =====
const Complaint = require('../models/Complaint');

const getAllComplaints = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('complainant', 'name phone')
      .populate('against', 'name phone')
      .populate('ride', 'status vehicleType fare');
    const total = await Complaint.countDocuments(filter);
    res.json({ success: true, data: complaints, total, totalPages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { description, category, type, complainantName, complainantPhone, againstName, priority, ride } = req.body;
    if (!description?.trim()) return res.status(400).json({ success: false, message: 'Description required hai' });
    const c = await Complaint.create({ description, category, type, complainantName, complainantPhone, againstName, priority, ride: ride || undefined });
    res.status(201).json({ success: true, message: 'Complaint register ho gayi!', data: c });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { status, resolution, priority } = req.body;
    const update = { status, priority };
    if (status === 'resolved' || status === 'dismissed') {
      update.resolution = resolution;
      update.resolvedBy = req.user._id;
      update.resolvedAt = new Date();
    }
    const c = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!c) return res.status(404).json({ success: false, message: 'Complaint nahi mili' });
    res.json({ success: true, message: `Complaint ${status} kar di!`, data: c });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const c = await Complaint.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint nahi mili' });
    res.json({ success: true, message: 'Complaint delete ho gayi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== PROMO CODES =====
const PromoCode = require('../models/PromoCode');

const getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const createPromo = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, maxDiscount, minFare, maxUses, maxUsesPerUser, firstRideOnly, applicableVehicles, validFrom, validUntil } = req.body;
    if (!code || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({ success: false, message: 'code, discountType, discountValue aur validUntil required hai' });
    }
    const promo = await PromoCode.create({
      code: String(code).toUpperCase().trim(),
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minFare: Number(minFare || 0),
      maxUses: maxUses ? Number(maxUses) : null,
      maxUsesPerUser: Number(maxUsesPerUser || 1),
      firstRideOnly: !!firstRideOnly,
      applicableVehicles: applicableVehicles || [],
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: new Date(validUntil),
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: `Promo code "${promo.code}" create ho gaya!`, data: promo });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Ye promo code already exist karta hai' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    res.json({ success: true, message: 'Promo updated!', data: promo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    res.json({ success: true, message: `Promo "${promo.code}" delete ho gaya` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DB FIX â€” roles array =====
const fixUserRoles = async (req, res) => {
  try {
    const User = require('../models/User');
    const providerFix = await User.updateMany(
      { role: 'provider', roles: { $nin: ['provider'] } },
      { $set: { roles: ['provider'] } }
    );
    const adminFix = await User.updateMany(
      { role: 'admin', roles: { $nin: ['admin'] } },
      { $set: { roles: ['admin'] } }
    );
    const customerFix = await User.updateMany(
      { role: 'customer', roles: { $nin: ['customer'] } },
      { $set: { roles: ['customer'] } }
    );
    res.json({
      success: true,
      message: 'Roles fix ho gaye!',
      fixed: { providers: providerFix.modifiedCount, admins: adminFix.modifiedCount, customers: customerFix.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all functions
module.exports = {
  getStats,
  getRecentActivity,
  getRevenueChart,
  getDashboardMetrics,
  getDashboardOverview,
  getAIAgentTasks,
  createDriver,
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
  blockDriver,
  unblockDriver,
  updateDriverStatus,
  deleteDriver,
  verifyDocument,
  verifyBankDetails,
  updateDriverProfileAdmin,
  updateBankDetailsAdmin,
  uploadDriverDocumentAdmin,
  getAllVehicles,
  addVehicleAdmin,
  getVehicleByIdAdmin,
  approveVehicle,
  rejectVehicle,
  deleteVehicleAdmin,
  verifyVehicleDocument,
  uploadVehicleDocumentAdmin,
  updateVehicleAdmin,
  resolveVehicleChangeRequest,
  getDriverStats,
  getAllRides,
  getRideDetails,
  cancelRideAdmin,
  getRideStats,
  getOngoingRides,
  trackRide,
  getActiveDriversLocation,
  getAllPayments,
  getPaymentStats,
  getPendingWithdrawals,
  processWithdrawal,
  getCommissionReport,
  createUser,
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  getSettings,
  updateSettings,
  updatePricing,
  getHourlyRates,
  updateHourlyRate,
  getVehicleTypes,
  createVehicleType,
  deleteVehicleType,
  getSystemConfig,
  getAnalytics,
  exportReport,
  getDriverPerformance,
  sendNotification,
  sendBulkNotification,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
  fixUserRoles,
  assignDriverToRide,
  getExpiringDocuments,
  getAllComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};
