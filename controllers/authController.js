// // const User = require('../models/User');
// // const jwt = require('jsonwebtoken');

// const nodemailer = require('nodemailer');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// // Generate JWT Token
// // const generateToken = (id) => {
// //   return jwt.sign({ id }, process.env.JWT_SECRET, {
// //     expiresIn: '30d'
// //   });
// // };

// // // Generate OTP (6 digits)
// // const generateOTP = () => {
// //   return Math.floor(100000 + Math.random() * 900000).toString();
// // };

// // @desc    Send OTP
// // @route   POST /api/auth/send-otp
// // @access  Public
// // exports.sendOTP = async (req, res) => {
// //   try {
// //     const { phone } = req.body;

// //     if (!phone || phone.length !== 10) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Please provide a valid 10-digit phone number' ,
// //         otp
// //       });
// //     }

// //     // Generate OTP
// //     const otp = generateOTP();
// //     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

// //     // Check if user exists
// //     let user = await User.findOne({ phone });

// //     if (user) {
// //       // Update existing user
// //       user.otp = otp;
// //       user.otpExpiry = otpExpiry;
// //       await user.save();
// //     } else {
// //       // Create new user
// //       user = await User.create({
// //         phone,
// //         name: `User${phone.slice(-4)}`,
// //         otp,
// //         otpExpiry
// //       });
// //     }

// //     // TODO: Send OTP via SMS/WhatsApp
// //     console.log(`📱 OTP for ${phone}: ${otp}`);

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only in dev mode
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: 'Error sending OTP',
// //       error: error.message 
// //     });
// //   }
// // };


// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // OTP generator
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// // Send OTP via Email
// // const sendOtpViaEmail = async (email, otp) => {
// //   const transporter = nodemailer.createTransport({
// //     service: 'gmail',
// //     auth: {
// //       user: process.env.EMAIL_USER,
// //       pass: process.env.EMAIL_PASS
// //     }
// //   });

// //   await transporter.sendMail({
// //     from: `"GaonConnect" <${process.env.EMAIL_USER}>`,
// //     to: email,
// //     subject: 'Your OTP for GaonConnect',
// //     text: `Your OTP is: ${otp}`
// //   });

// //   console.log(`📧 OTP sent to ${email}: ${otp}`);
// // };

// exports.sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ success: false, message: 'Email required' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     const otp = generateOTP();
//     user.otp = otp;
//     user.otpExpiry = new Date(Date.now() + 10*60*1000);
//     await user.save();

//     await sendOtpViaEmail(email, otp);

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent to your email',
//       otp: process.env.NODE_ENV === 'development' ? otp : undefined
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
//   }
// };

// // exports.sendOTP = async (req, res) => {
// //   try {
// //     const { phone } = req.body;

// //     // Validate phone
// //     if (!phone || phone.toString().length !== 10) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Please provide a valid 10-digit phone number'
// //       });
// //     }

// //     // Generate OTP
// //     const otp = generateOTP();
// //     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

// //     // Check if user exists
// //     let user = await User.findOne({ phone });

// //     if (user) {
// //       // Update existing user
// //       user.otp = otp;
// //       user.otpExpiry = otpExpiry;
// //       await user.save();
// //     } else {
// //       // Create new user
// //       user = await User.create({
// //         phone,
// //         name: `User${phone.toString().slice(-4)}`,
// //         otp,
// //         otpExpiry
// //       });
// //     }

// //     // Dev: console log OTP
// //     if (process.env.NODE_ENV === 'development') {
// //       console.log(`📱 OTP for ${phone}: ${otp}`);
// //     }

// //     // Production: call SMS API here (Twilio/MSG91)
// //     // await sendOtpViaSMS(phone, otp);

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent successfully',
// //       otp: process.env.NODE_ENV === 'development' ? otp : undefined
// //     });

// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: 'Error sending OTP',
// //       error: error.message 
// //     });
// //   }
// // };

// // OTP generator function

// // @desc    Verify OTP & Login
// // @route   POST /api/auth/verify-otp
// // @access  Public
// // exports.verifyOTP = async (req, res) => {
// //   try {
// //     const { phone, otp } = req.body;

// //     if (!phone || !otp) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Please provide phone and OTP' 
// //       });
// //     }

// //     // Find user
// //     const user = await User.findOne({ phone });

// //     if (!user) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: 'User not found' 
// //       });
// //     }

// //     // Check OTP
// //     if (user.otp !== otp) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Invalid OTP' 
// //       });
// //     }

// //     // Check OTP expiry
// //     if (new Date() > user.otpExpiry) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'OTP expired' 
// //       });
// //     }

// //     // Mark user as verified
// //     user.isVerified = true;
// //     user.otp = undefined;
// //     user.otpExpiry = undefined;
// //     await user.save();

// //     // Generate token
// //     const token = generateToken(user._id);

// //     res.status(200).json({
// //       success: true,
// //       message: 'Login successful',
// //       token,
// //       user: {
// //         id: user._id,
// //         name: user.name,
// //         phone: user.phone,
// //         email: user.email,
// //         role: user.role,
// //         wallet: user.wallet
// //       }
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: 'Error verifying OTP',
// //       error: error.message 
// //     });
// //   }
// // };

// // @desc    Register new user
// // @route   POST /api/auth/register
// // @access  Public

// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

//     if (new Date() > user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP expired' });

//     // OTP verified
//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: 'Email verified successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         wallet: user.wallet
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
//   }
// };

// exports.register = async (req, res) => {
//   try {
//     const { name, phone, email, city, role } = req.body;

//     if (!email || !phone || !name) {
//       return res.status(400).json({ success: false, message: 'All fields required' });
//     }

//     const existingUser = await User.findOne({ phone });
//     if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

//     // Create user
//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

//     const user = await User.create({
//       name,
//       phone,
//       email,
//       city,
//       role: role || 'customer',
//       otp,
//       otpExpiry,
//       isVerified: false
//     });

//     // Send OTP to email
//     await sendOtpViaEmail(email, otp);

//     res.status(201).json({
//       success: true,
//       message: 'User registered. OTP sent to your email.',
//       otp: process.env.NODE_ENV === 'development' ? otp : undefined
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
//   }
// };
// // exports.register = async (req, res) => {
// //   try {
// //     const { name, phone, email, city, role } = req.body;

// //     // Check if user exists
// //     const userExists = await User.findOne({ phone });

// //     if (userExists) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'User already exists' 
// //       });
// //     }

// //     // Create user
// //     const user = await User.create({
// //       name,
// //       phone,
// //       email,
// //       city,
// //       role: role || 'customer'
// //     });

// //     // Generate OTP for verification
// //     const otp = generateOTP();
// //     user.otp = otp;
// //     user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
// //     await user.save();

// //     console.log(`📱 OTP for ${phone}: ${otp}`);

// //     res.status(201).json({
// //       success: true,
// //       message: 'User registered. OTP sent for verification',
// //       otp: process.env.NODE_ENV === 'development' ? otp : undefined
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: 'Error registering user',
// //       error: error.message 
// //     });
// //   }
// // };

// // @desc    Get user profile
// // @route   GET /api/auth/profile
// // @access  Private
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password -otp');

//     res.status(200).json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching profile',
//       error: error.message 
//     });
//   }
// };

// // @desc    Update user profile
// // @route   PUT /api/auth/profile
// // @access  Private
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, city } = req.body;

//     const user = await User.findById(req.user.id);

//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (city) user.city = city;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       user
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error updating profile',
//       error: error.message 
//     });
//   }
// };






// const nodemailer = require('nodemailer');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// // Generate JWT Token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // OTP generator
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// // Send OTP via Email
// const sendOtpViaEmail = async (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   await transporter.sendMail({
//     from: `"GaonConnect" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: 'Your OTP for GaonConnect',
//     text: `Your OTP is: ${otp}`
//   });

//   console.log(`📧 OTP sent to ${email}: ${otp}`);
// };

// // =======================================
// // SEND OTP (if needed separately)
// // exports.sendOTP = async (req, res) => {
// //   try {
// //     const { email } = req.body;
// //     if (!email) return res.status(400).json({ success: false, message: 'Email required' });

// //     const user = await User.findOne({ email });
// //     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

// //     const otp = generateOTP();
// //     user.otp = otp;
// //     user.otpExpiry = new Date(Date.now() + 10*60*1000);
// //     await user.save();

// //     await sendOtpViaEmail(email, otp);

// //     res.status(200).json({
// //       success: true,
// //       message: 'OTP sent to your email',
// //       otp: process.env.NODE_ENV === 'development' ? otp : undefined
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
// //   }
// // };

// exports.sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ success: false, message: 'Email required' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     const otp = generateOTP();
//     user.otp = otp;
//     user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
//     await user.save();

//     // **Send email only in production**
//     if (process.env.NODE_ENV === 'production') {
//       await sendOtpViaEmail(email, otp);
//     } else {
//       console.log(`📱 [DEV] OTP for ${email}: ${otp}`); // dev me console log
//     }

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent successfully',
//       otp: process.env.NODE_ENV === 'development' ? otp : undefined
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
//   }
// };
// // =======================================
// // REGISTER NEW USER
// exports.register = async (req, res) => {
//   try {
//     const { name, phone, email, city, role } = req.body;
//     if (!name || !phone || !email) return res.status(400).json({ success: false, message: 'All fields required' });

//     const existingUser = await User.findOne({ phone });
//     if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 10*60*1000); // 10 minutes

//     const user = await User.create({
//       name,
//       phone,
//       email,
//       city,
//       role: role || 'customer',
//       otp,
//       otpExpiry,
//       isVerified: false
//     });

//     // Send OTP to email
//     await sendOtpViaEmail(email, otp);

//     res.status(201).json({
//       success: true,
//       message: 'User registered. OTP sent to your email.',
//       otp: process.env.NODE_ENV === 'development' ? otp : undefined
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
//   }
// };

// // =======================================
// // VERIFY OTP
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
//     if (new Date() > user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP expired' });

//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: 'Email verified successfully',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         wallet: user.wallet
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
//   }
// };

// // =======================================
// // GET PROFILE
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password -otp');
//     res.status(200).json({ success: true, user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
//   }
// };

// // =======================================
// // UPDATE PROFILE
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, email, city } = req.body;
//     const user = await User.findById(req.user.id);

//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (city) user.city = city;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       user
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
//   }
// };



// controllers/authController.js
// POORA FILE REPLACE KARO IS SE

const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// OTP generator
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP via Email
const sendOtpViaEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"GaonConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for GaonConnect',
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`
  });

  console.log(`📧 OTP sent to ${email}`);
};

// =======================================
// SEND OTP
// exports.sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ success: false, message: 'Email required' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found. Pehle register karo.' });

//     const otp = generateOTP();
//     user.otp = otp;
//     user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
//     await user.save();

//     // ✅ Dev mode mein email mat bhejo — sirf console mein print karo
//     if (process.env.NODE_ENV === 'production') {
//       await sendOtpViaEmail(email, otp);
//     } else {
//       console.log(`\n📱 [DEV MODE] OTP for ${email}: ${otp}\n`);
//     }

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent successfully',
//       // Dev mode mein OTP response mein bhi bhejo (app mein popup dikhega)
//       otp: process.env.NODE_ENV === 'development' ? otp : undefined
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
//   }
// };

// =======================================
// REGISTER NEW USER
exports.register = async (req, res) => {
  try {
    const { name, phone, email, city, role } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Name, phone aur email required hai' });
    }

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Is phone ya email se account already exist karta hai' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      phone,
      email,
      city: city || '',
      role: role || 'customer',
      otp,
      otpExpiry,
      isVerified: false
    });

    // ✅ Dev mode mein email mat bhejo — sirf console mein print karo
    if (process.env.NODE_ENV === 'production') {
      await sendOtpViaEmail(email, otp);
    } else {
      console.log(`\n🎉 [DEV MODE] New User Registered: ${name}`);
      console.log(`📱 [DEV MODE] OTP for ${email}: ${otp}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      // Dev mode mein OTP response mein bhejo
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
  }
};

// =======================================
// VERIFY OTP
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (!email || !otp) {
//       return res.status(400).json({ success: false, message: 'Email aur OTP dono required hain' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     if (user.otp !== otp) {
//       return res.status(400).json({ success: false, message: 'OTP galat hai' });
//     }

//     if (new Date() > user.otpExpiry) {
//       return res.status(400).json({ success: false, message: 'OTP expire ho gaya. Dobara bhejo.' });
//     }

//     // OTP verified!
//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     const token = generateToken(user._id);

//     console.log(`✅ User verified: ${email}`);

//     res.status(200).json({
//       success: true,
//       message: 'Login successful!',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
//   }
// };

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required hai' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Koi account nahi mila. Pehle register karo.' });
    }

    // ✅ Provider hai toh approved check karo
    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: user._id });
      if (!provider) {
        return res.status(404).json({ success: false, message: 'Provider profile nahi mili' });
      }
      if (!provider.isApproved) {
        return res.status(403).json({
          success: false,
          message: '⏳ Aapka account abhi admin se approve nahi hua. Thoda intezaar karo.'
        });
      }
    }

    const otp = generateOTP();
    user.otp       = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV === 'production') {
      await sendOtpViaEmail(email, otp);
    } else {
      console.log(`\n📱 [DEV] OTP for ${email}: ${otp}\n`);
    }

    res.status(200).json({
      success: true,
      message: 'OTP bhej diya gaya',
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });

  } catch (error) {
    console.error('SendOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP bhejne mein error', error: error.message });
  }
};

// VERIFY OTP — Customer aur Provider Driver dono ke liye
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email aur OTP dono chahiye' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User nahi mila' });

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'OTP galat hai' });
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expire ho gaya. Dobara bhejo.' });
    }

    user.isVerified = true;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    await user.save();

    const token = generateToken(user._id);

    // ✅ Provider ka data bhi bhejo — Driver App ko chahiye
    let providerData = null;
    if (user.role === 'provider') {
      providerData = await Provider.findOne({ user: user._id })
        .select('vehicle documents rating stats status isApproved isOnline wallet');
    }

    console.log(`✅ Login: ${email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
        city:  user.city,
      },
      provider: providerData || undefined,  // Driver App ke liye
    });

  } catch (error) {
    console.error('VerifyOTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP verify karne mein error', error: error.message });
  }
};


// =======================================
// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

// =======================================
// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, city } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (city) user.city = city;

    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};