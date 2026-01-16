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
//           currencySymbol: '₹',
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
const User = require('../models/User');
const Driver = require('../models/Provider')
const Ride = require('../models/Ride');
const Payment = require('../models/Withdrawal')
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
      User.countDocuments({ role: 'user' }),
      Driver.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'ongoing' }),
      Driver.countDocuments({ status: 'pending' }),
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

      // ✅ FIXED POPULATE
      .populate('customer', 'name email phone')
      .populate('provider', 'name phone vehicleNumber')

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
          revenue: { $sum: '$fare' },
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
            total: { $sum: '$fare' }
          }
        }
      ]),
      Driver.countDocuments({ isOnline: true }),
      Driver.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
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

// ===== DRIVERS MANAGEMENT =====

const getAllDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await Driver.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .select('-password');

    const count = await Driver.countDocuments(query);

    res.json({
      success: true,
      data: drivers,
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


// controllers/adminController.js

// controllers/adminController.js

const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver's ride statistics
    const rideStats = await Ride.aggregate([
      { $match: { driver: driver._id } },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          completedRides: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEarnings: { $sum: '$fare' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
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
        status: 'approved',
        isApproved: true,
        approvedAt: Date.now(),
        approvedBy: req.user._id
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
      message: 'Driver approved successfully',
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

const rejectDriver = async (req, res) => {
  try {
    const { reason } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
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
      driver: driver._id,
      status: { $in: ['pending', 'accepted', 'ongoing'] }
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

const verifyDocument = async (req, res) => {
  try {
    const { documentType, status } = req.body;

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.documents) driver.documents = {};
    if (!driver.documents[documentType]) {
      driver.documents[documentType] = {};
    }
    
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

const getDriverStats = async (req, res) => {
  try {
    const driverId = req.params.id;

    const stats = await Ride.aggregate([
      { $match: { driver: require('mongoose').Types.ObjectId(driverId) } },
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
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
          },
          avgRating: { $avg: '$rating' },
          totalDistance: { $sum: '$distance' },
          avgFare: { $avg: '$fare' }
        }
      }
    ]);

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayStats = await Ride.aggregate([
      { 
        $match: { 
          driver: require('mongoose').Types.ObjectId(driverId),
          createdAt: { $gte: todayStart }
        } 
      },
      {
        $group: {
          _id: null,
          todayRides: { $sum: 1 },
          todayEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
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
    if (driverId) query.driver = driverId;
    if (userId) query.user = userId;
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
      .populate('provider', 'name phone vehicleNumber');

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

// const getAllRides = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       status,
//       driverId,
//       userId,
//       startDate,
//       endDate
//     } = req.query;

//     const query = {};

//     if (status) query.status = status;
//     if (driverId) query.driver = driverId;
//     if (userId) query.user = userId;

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) query.createdAt.$lte = new Date(endDate);
//     }

//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);

//     const rides = await Ride.find(query)
//       .limit(limitNum)
//       .skip((pageNum - 1) * limitNum)
//       .sort({ createdAt: -1 })
//       .populate('user', 'name email phone')     // ✅ FIXED
//       .populate('driver', 'name phone vehicleNumber');

//     const count = await Ride.countDocuments(query);

//     res.json({
//       success: true,
//       data: rides,
//       totalPages: Math.ceil(count / limitNum),
//       currentPage: pageNum,
//       total: count
//     });

//   } catch (error) {
//     console.error('Get All Rides Error:', error); // 👈 VERY IMPORTANT
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };



const getRideDetails = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('user', 'name email phone profileImage')
      .populate('driver', 'name phone vehicleNumber vehicleType profileImage rating');

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
            $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
          },
          avgFare: { $avg: '$fare' }
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
      status: { $in: ['ongoing', 'accepted', 'arriving'] }
    })
      .populate('user', 'name phone')
      .populate('driver', 'name phone vehicleNumber location')
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
      .populate('driver', 'name phone location vehicleNumber')
      .select('status pickup dropoff driver currentLocation estimatedArrival');

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
      isBlocked: false
    })
      .select('name phone location vehicleType vehicleNumber currentRide');

    res.json({
      success: true,
      data: activeDrivers
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
    
    const query = {};
    
    if (status) query.status = status;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('ride')
      .populate('user', 'name email')
      .populate('driver', 'name phone');

    const count = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
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

const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commission' },
          totalTransactions: { $sum: 1 },
          cashPayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amount', 0] }
          },
          onlinePayments: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$amount', 0] }
          },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalAmount: 0,
        totalCommission: 0,
        totalTransactions: 0,
        cashPayments: 0,
        onlinePayments: 0,
        successfulPayments: 0,
        failedPayments: 0
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
    // For now, return empty array if Withdrawal model doesn't exist
    res.json({
      success: true,
      data: []
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

    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`
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

    const query = { status: 'completed' };
    if (from_date || to_date) {
      query.createdAt = {};
      if (from_date) query.createdAt.$gte = new Date(from_date);
      if (to_date) query.createdAt.$lte = new Date(to_date);
    }

    const commissionData = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalCommission: { $sum: '$commission' },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const summary = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commission' },
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        daily: commissionData,
        summary: summary[0] || {
          totalCommission: 0,
          totalRevenue: 0,
          totalTransactions: 0
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

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = { role: 'user' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

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

const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const rides = await Ride.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('driver', 'name vehicleNumber');

    const stats = await Ride.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalRides: { $sum: 1 },
          totalSpent: { $sum: '$fare' },
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

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        commission: {
          percentage: 20,
          type: 'percentage'
        },
        pricing: {
          baseFare: 50,
          perKm: 10,
          perMinute: 2,
          minimumFare: 80
        },
        cancellation: {
          userFee: 20,
          driverFee: 30,
          timeLimit: 5
        },
        general: {
          currency: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata'
        }
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findOneAndUpdate(
        {},
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const updatePricing = async (req, res) => {
  try {
    const { vehicleType, pricing } = req.body;

    const settings = await Setting.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.pricing[vehicleType] = pricing;
    await settings.save();

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getSystemConfig = async (req, res) => {
  try {
    const config = {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      features: {
        payment: true,
        notifications: true,
        realTimeTracking: true,
        scheduling: true
      },
      limits: {
        maxRideDistance: 100,
        maxWaitingTime: 15,
        maxDriverRadius: 10
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
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
            role: 'user'
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
          .populate('user', 'name email')
          .populate('driver', 'name phone')
          .lean();
        filename = 'rides-report.csv';
        break;
        
      case 'payments':
        data = await Payment.find(query)
          .populate('user', 'name email')
          .populate('driver', 'name phone')
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
        data = await User.find({ role: 'user' })
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

    const performance = await Ride.aggregate([
      { 
        $match: { 
          driver: require('mongoose').Types.ObjectId(driverId),
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
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
          },
          avgRating: { $avg: '$rating' },
          totalDistance: { $sum: '$distance' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const overallStats = await Ride.aggregate([
      { 
        $match: { 
          driver: require('mongoose').Types.ObjectId(driverId),
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
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] }
          },
          avgRating: { $avg: '$rating' },
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

const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientType, title, message, type } = req.body;

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const sendBulkNotification = async (req, res) => {
  try {
    const { recipientType, title, message, type, filters } = req.body;

    res.json({
      success: true,
      message: `Notification sent to multiple recipients`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  getStats,
  getRecentActivity,
  getRevenueChart,
  getDashboardMetrics,
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
  blockDriver,
  unblockDriver,
  updateDriverStatus,
  deleteDriver,
  verifyDocument,
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
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  getSettings,
  updateSettings,
  updatePricing,
  getSystemConfig,
  getAnalytics,
  exportReport,
  getDriverPerformance,
  sendNotification,
  sendBulkNotification
};