const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Provider = require('../models/Provider');
const Transaction = require('../models/Transaction');
const Ride = require('../models/Ride');
const User = require('../models/User');

const isDev = process.env.NODE_ENV !== 'production';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Top-up limits — chhoti raqam pe gateway fee hi zyada pad jaati hai, aur
// bahut badi raqam aksar galti se type hoti hai (ya money-laundering flag).
const MIN_TOPUP = 10;
const MAX_TOPUP = 10000;

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

    // Customers ke paas ab apni ledger hai (top-up, cancellation fee, tip),
    // isliye khaali list lautana galat hoga — unki transactions user field se
    // aati hain, provider field se nahi.
    if (req.user.role !== 'provider') {
      const custQuery = { user: req.user.id };
      if (type && ['credit', 'debit'].includes(type)) custQuery.type = type;

      const [custTxns, custCount] = await Promise.all([
        Transaction.find(custQuery)
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit),
        Transaction.countDocuments(custQuery),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          transactions: custTxns,
          pagination: {
            currentPage: Number(page),
            totalPages:  Math.ceil(custCount / limit),
            total:       custCount,
          },
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

/**
 * POST /api/wallet/topup/order
 * Wallet mein paisa daalne ke liye Razorpay order banao.
 *
 * Pehle customer wallet sirf padha ja sakta tha — paisa daalne ka koi rasta hi
 * nahi tha, isliye balance hamesha 0 rehta aur wallet feature bekaar tha.
 * Yahan sirf order banta hai; balance tab tak nahi badhta jab tak verify step
 * signature check na kar le — warna koi bhi bina paise diye wallet bhar leta.
 */
exports.createTopupOrder = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return res.status(400).json({
        success: false,
        message: `Amount ₹${MIN_TOPUP} se ₹${MAX_TOPUP} ke beech hona chahiye`,
      });
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `topup_${req.user.id}_${Date.now()}`,
      notes:    { userId: String(req.user.id), purpose: 'wallet_topup' },
    });

    // Transaction pehle hi 'pending' bana dete hain — agar user payment ke
    // beech app band kar de to bhi record rehta hai aur reconcile ho sakta hai.
    await Transaction.create({
      user:          req.user.id,
      type:          'credit',
      category:      'topup',
      amount,
      description:   'Wallet top-up',
      status:        'pending',
      transactionId: order.id,
    });

    return res.json({ success: true, order, key: process.env.RAZORPAY_KEY });
  } catch (err) {
    console.error('createTopupOrder Error:', err.message);
    return res.status(500).json({ success: false, message: 'Top-up order banane mein error' });
  }
};

/**
 * POST /api/wallet/topup/verify
 * Razorpay signature verify karke wallet credit karo.
 */
exports.verifyTopup = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment details adhoore hain' });
    }

    // Order ko us pending transaction se dhoondo jo humne banayi thi. Isse do
    // cheezein pakki hoti hain: order sach mein humne banaya tha, aur amount
    // client ke bheje hue number se nahi balki server ke record se aata hai —
    // warna koi ₹10 de kar ₹10,000 credit karwa leta.
    const txn = await Transaction.findOne({
      transactionId: razorpayOrderId,
      user:          req.user.id,
      category:      'topup',
    });

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Top-up order nahi mila' });
    }

    if (txn.status === 'completed') {
      // Double-submit (network retry ya user ka dobara tap) — dobara credit mat karo.
      const user = await User.findById(req.user.id).select('wallet');
      return res.json({ success: true, message: 'Top-up pehle hi ho chuka hai', balance: user?.wallet || 0 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      txn.status        = 'failed';
      txn.failureReason = 'Signature mismatch';
      await txn.save();
      return res.status(400).json({ success: false, message: 'Payment verify nahi ho paya' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { wallet: txn.amount } },
      { new: true },
    ).select('wallet');

    txn.status       = 'completed';
    txn.processedAt  = new Date();
    txn.balanceAfter = updated?.wallet;
    await txn.save();

    return res.json({
      success: true,
      message: `₹${txn.amount} wallet mein add ho gaye`,
      balance: updated?.wallet || 0,
    });
  } catch (err) {
    console.error('verifyTopup Error:', err.message);
    return res.status(500).json({ success: false, message: 'Top-up verify karne mein error' });
  }
};

/**
 * POST /api/wallet/tip
 * Ride khatam hone ke baad driver ko tip do — wallet se seedha driver ko.
 *
 * Tip Rapido/Uber dono pe hai aur driver ki kamai seedha badhata hai, platform
 * ka isme koi commission nahi — isliye poori raqam driver ke wallet mein jaati
 * hai. Sirf completed ride pe, aur ek ride pe ek hi baar.
 */
exports.tipDriver = async (req, res) => {
  try {
    const { rideId } = req.body;
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
      return res.status(400).json({ success: false, message: 'Tip ₹1 se ₹1000 ke beech hona chahiye' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride nahi mili' });

    if (ride.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yeh ride aapki nahi hai' });
    }
    if (ride.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Ride complete hone ke baad hi tip de sakte hain' });
    }
    if (!ride.provider) {
      return res.status(400).json({ success: false, message: 'Is ride pe koi driver nahi tha' });
    }

    // Ek ride pe ek hi tip — warna galti se dobara tap karne pe do baar kat jaata.
    const already = await Transaction.findOne({ ride: ride._id, category: 'tip', user: req.user.id });
    if (already) {
      return res.status(400).json({ success: false, message: 'Is ride pe tip pehle hi de chuke hain' });
    }

    const user = await User.findById(req.user.id).select('wallet');
    if ((user?.wallet || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: 'Wallet mein itna balance nahi hai. Pehle top-up karein.',
        code:    'INSUFFICIENT_BALANCE',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { wallet: -amount } },
      { new: true },
    ).select('wallet');

    const updatedProvider = await Provider.findByIdAndUpdate(
      ride.provider,
      { $inc: { 'wallet.balance': amount, 'stats.totalEarnings': amount } },
      { new: true },
    ).select('wallet');

    await Transaction.create([
      {
        user:         req.user.id,
        ride:         ride._id,
        type:         'debit',
        category:     'tip',
        amount,
        description:  'Driver ko tip',
        status:       'completed',
        balanceAfter: updatedUser?.wallet,
      },
      {
        provider:     ride.provider,
        ride:         ride._id,
        type:         'credit',
        category:     'tip',
        amount,
        description:  'Customer se tip',
        status:       'completed',
        balanceAfter: updatedProvider?.wallet?.balance,
      },
    ]);

    return res.json({
      success: true,
      message: `₹${amount} tip driver ko bhej diya. Shukriya!`,
      balance: updatedUser?.wallet || 0,
    });
  } catch (err) {
    console.error('tipDriver Error:', err.message);
    return res.status(500).json({ success: false, message: 'Tip bhejne mein error' });
  }
};
