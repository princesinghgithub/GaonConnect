const Provider = require('../models/Provider');
const Transaction = require('../models/Transaction');
const Ride = require('../models/Ride');
const User = require('../models/User');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * GET WALLET BALANCE
 * Customers only have a flat balance (User.wallet) — no earnings/withdrawal
 * concepts apply to them, so they get a smaller response shape.
 */
exports.getWalletBalance = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      const user = await User.findById(req.user.id).select('wallet');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      return res.status(200).json({
        success: true,
        data: { balance: user.wallet },
      });
    }

    const provider = await Provider.findOne({ user: req.user.id })
      .select('wallet stats');

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Calculate today's and week's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayRides = await Ride.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: today }
    });

    const weekRides = await Ride.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: weekAgo }
    });

    const todayEarnings = todayRides.reduce((sum, ride) => {
      const commission = ride.fare * 0; // abhi 0% commission
      return sum + (ride.fare - commission);
    }, 0);

    const weekEarnings = weekRides.reduce((sum, ride) => {
      const commission = ride.fare * 0; // abhi 0% commission
      return sum + (ride.fare - commission);
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        balance: provider.wallet.balance,
        pendingAmount: provider.wallet.pendingAmount,
        totalEarnings: provider.stats.totalEarnings,
        totalWithdrawals: provider.wallet.totalWithdrawals,
        todayEarnings,
        weekEarnings
      }
    });

  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching wallet balance',
      ...(isDev && { error: error.message }),
    });
  }
};

/**
 * GET TRANSACTION HISTORY
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    // Customers don't have a transaction ledger yet (Transaction model is
    // provider-earnings only) — return an empty list instead of 404.
    if (req.user.role !== 'provider') {
      return res.status(200).json({
        success: true,
        data: {
          transactions: [],
          pagination: { currentPage: Number(page), totalPages: 0, total: 0 },
        },
      });
    }

    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const query = { provider: provider._id };

    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          total: count
        }
      }
    });

  } catch (error) {
    console.error('Get Transaction History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      ...(isDev && { error: error.message }),
    });
  }
};

/**
 * REQUEST WITHDRAWAL
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Check if bank details are added
    if (!provider.bankDetails || !provider.bankDetails.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please add bank details first'
      });
    }

    // Check if bank details are verified
    if (!provider.bankDetails.verified) {
      return res.status(400).json({
        success: false,
        message: 'Bank details not verified yet'
      });
    }

    // Minimum withdrawal amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    // Balance check + deduct ek hi atomic operation mein — do concurrent
    // withdrawal requests (2 devices, double-tap) alag-alag "read balance,
    // check, save" steps se dono pass ho ke wallet negative kar sakte the.
    // $gte guard yeh ensure karta hai ki dusra request tabhi fail ho jab
    // balance already pehle waale ne le liya ho.
    const updatedProvider = await Provider.findOneAndUpdate(
      { _id: provider._id, 'wallet.balance': { $gte: amount } },
      { $inc: { 'wallet.balance': -amount, 'wallet.pendingAmount': amount } },
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      provider: provider._id,
      type: 'debit',
      amount,
      description: 'Withdrawal to bank account',
      status: 'pending',
      bankDetails: {
        accountNumber: provider.bankDetails.accountNumber,
        ifscCode: provider.bankDetails.ifscCode,
        bankName: provider.bankDetails.bankName
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction,
        estimatedTime: '2-3 business days'
      }
    });

  } catch (error) {
    console.error('Request Withdrawal Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing withdrawal',
      ...(isDev && { error: error.message }),
    });
  }
};

/**
 * GET EARNINGS REPORT
 */
exports.getEarningsReport = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, year

    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const rides = await Ride.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: startDate }
    });

    const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalCommission = totalEarnings * 0; // abhi 0% commission
    const netEarnings = totalEarnings - totalCommission;

    const avgFare = rides.length > 0 ? totalEarnings / rides.length : 0;

    // Group by day
    const earningsByDay = {};
    rides.forEach(ride => {
      const day = ride.completedAt.toISOString().split('T')[0];
      if (!earningsByDay[day]) {
        earningsByDay[day] = { rides: 0, earnings: 0 };
      }
      earningsByDay[day].rides += 1;
      earningsByDay[day].earnings += ride.fare;
    });

    return res.status(200).json({
      success: true,
      data: {
        period,
        totalRides: rides.length,
        totalEarnings,
        totalCommission,
        netEarnings,
        avgFare: Math.round(avgFare),
        earningsByDay
      }
    });

  } catch (error) {
    console.error('Get Earnings Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching earnings report',
      ...(isDev && { error: error.message }),
    });
  }
};

