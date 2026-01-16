// const Provider = require('../models/Provider');
// const User = require('../models/User');
// const Ride = require('../models/Ride');
// const multer = require('multer');
// const path = require('path');

// //  * GET NEARBY AVAILABLE PROVIDERS
//  // MULTER CONFIGURATION FOR PROFILE PHOTO
 
//  const photoStorage = multer.diskStorage({
//    destination: function (req, file, cb) {
//      cb(null, 'uploads/profile/');
//    },
//    filename: function (req, file, cb) {
//      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//      cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
//    }
//  });
 
//  const photoFilter = (req, file, cb) => {
//    const allowedTypes = /jpeg|jpg|png/;
//    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//    const mimetype = allowedTypes.test(file.mimetype);
 
//    if (mimetype && extname) {
//      return cb(null, true);
//    } else {
//      cb(new Error('Only JPG and PNG images are allowed!'));
//    }
//  };
 
//  const uploadPhoto = multer({
//    storage: photoStorage,
//    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//    fileFilter: photoFilter
//  }).single('photo');
 

//   //  UPLOAD PROFILE PHOTO
//   //  POST /api/provider/profile/photo

//  exports.uploadProfilePhoto = async (req, res) => {
//    try {
//      const provider = await Provider.findOne({ user: req.user.id });
     
//      if (!provider) {
//        return res.status(404).json({
//          success: false,
//          message: 'Provider not found'
//        });
//      }
 
//      if (!req.file) {
//        return res.status(400).json({
//          success: false,
//          message: 'Please upload a photo'
//        });
//      }
 
//      // Update profile photo
//      provider.profilePhoto = `/uploads/profile/${req.file.filename}`;
//      await provider.save();
 
//      return res.status(200).json({
//        success: true,
//        message: 'Profile photo updated successfully',
//        data: {
//          profilePhoto: provider.profilePhoto
//        }
//      });
 
//    } catch (error) {
//      console.error('Upload photo error:', error);
//      return res.status(500).json({
//        success: false,
//        message: 'Error uploading photo',
//        error: error.message
//      });
//    }
//  };
 
 
// exports.getAvailableProviders = async (req, res) => {
//   try {
//     let { lat, lng, radius = 5000, vehicleType } = req.query;

//     lat = parseFloat(lat);
//     lng = parseFloat(lng);
//     radius = parseInt(radius);

//     const baseQuery = {
//       status: 'available',
//       isApproved: true,
//       isOnline: true
//     };

//     // Filter by vehicle type if provided
//     if (vehicleType) {
//       baseQuery['vehicle.type'] = vehicleType;
//     }

//     let providersQuery = Provider.find(baseQuery)
//       .populate('user', 'name phone city profilePhoto')
//       .select('-documents.aadhaar -documents.license.number -documents.rc.number')
//       .lean();

//     // Apply geo filter if lat/lng available
//     if (!isNaN(lat) && !isNaN(lng)) {
//       providersQuery = providersQuery.where('currentLocation').near({
//         center: {
//           type: 'Point',
//           coordinates: [lng, lat]
//         },
//         maxDistance: radius,
//         spherical: true
//       });
//     }

//     const providers = await providersQuery.limit(20);

//     return res.status(200).json({
//       success: true,
//       count: providers.length,
//       providers
//     });

//   } catch (error) {
//     console.error('Get Available Providers Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching providers',
//       error: error.message
//     });
//   }
// };

// /**
//  * GET PROVIDER BY ID
//  */
// exports.getProviderById = async (req, res) => {
//   try {
//     const provider = await Provider.findById(req.params.id)
//       .populate('user', 'name phone city profilePhoto')
//       .select('-documents.aadhaar -bankDetails');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     return res.status(200).json({ success: true, provider });

//   } catch (error) {
//     console.error('Get Provider Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching provider',
//       error: error.message 
//     });
//   }
// };

// /**
//  * REGISTER PROVIDER
//  */
// exports.registerProvider = async (req, res) => {
//   try {
//     const { 
//       vehicleType, 
//       vehicleNumber, 
//       vehicleModel, 
//       vehicleColor,
//       licenseNumber,
//       rcNumber
//     } = req.body;

//     // Check if already registered
//     const exists = await Provider.findOne({ user: req.user.id });
//     if (exists)
//       return res.status(400).json({ success: false, message: 'Already registered as provider' });

//     // Check if vehicle number already exists
//     const vehicleExists = await Provider.findOne({ 'vehicle.number': vehicleNumber.toUpperCase() });
//     if (vehicleExists)
//       return res.status(400).json({ success: false, message: 'Vehicle number already registered' });

//     const provider = await Provider.create({
//       user: req.user.id,
//       vehicle: {
//         type: vehicleType,
//         number: vehicleNumber.toUpperCase(),
//         model: vehicleModel,
//         color: vehicleColor
//       },
//       documents: {
//         license: {
//           number: licenseNumber
//         },
//         rc: {
//           number: rcNumber
//         }
//       },
//       status: 'offline',
//       isOnline: false
//     });

//     // Update user role
//     await User.findByIdAndUpdate(req.user.id, { role: 'provider' });

//     return res.status(201).json({ 
//       success: true, 
//       message: 'Provider registered successfully. Awaiting approval.',
//       provider 
//     });

//   } catch (error) {
//     console.error('Register Provider Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error registering provider',
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPDATE PROVIDER STATUS / ONLINE
//  */
// exports.updateProviderStatus = async (req, res) => {
//   try {
//     const { status, isOnline } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     if (!provider.isApproved)
//       return res.status(403).json({ success: false, message: 'Provider not approved yet' });

//     if (status) provider.status = status;
//     if (typeof isOnline === 'boolean') {
//       provider.isOnline = isOnline;
      
//       if (isOnline) {
//         provider.onlineAt = new Date();
//         if (provider.status === 'offline') {
//           provider.status = 'available';
//         }
//       } else {
//         provider.offlineAt = new Date();
//         provider.status = 'offline';
//       }
//     }

//     await provider.save();

//     return res.status(200).json({ 
//       success: true, 
//       message: `Driver is now ${provider.isOnline ? 'online' : 'offline'}`,
//       provider: {
//         status: provider.status,
//         isOnline: provider.isOnline
//       }
//     });

//   } catch (error) {
//     console.error('Update Status Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating status',
//       error: error.message 
//     });
//   }
// };

// /**
//  * TOGGLE DUTY (ONLINE/OFFLINE)
//  */
// exports.toggleDuty = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider) 
//       return res.status(404).json({ success: false, message: "Provider not found" });

//     if (!provider.isApproved)
//       return res.status(403).json({ success: false, message: 'Provider not approved yet' });

//     provider.isOnline = !provider.isOnline;
//     provider.status = provider.isOnline ? "available" : "offline";

//     if (provider.isOnline) {
//       provider.onlineAt = new Date();
//     } else {
//       provider.offlineAt = new Date();
//     }

//     await provider.save();

//     res.json({
//       success: true,
//       message: `You are now ${provider.isOnline ? 'online' : 'offline'}`,
//       isOnline: provider.isOnline,
//       status: provider.status
//     });

//   } catch (error) {
//     console.error('Toggle Duty Error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Duty toggle failed",
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPDATE LIVE LOCATION
//  */
// exports.updateProviderLocation = async (req, res) => {
//   try {
//     let { lat, lng, address } = req.body;

//     lat = parseFloat(lat);
//     lng = parseFloat(lng);

//     if (isNaN(lat) || isNaN(lng)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid lat & lng required'
//       });
//     }

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.currentLocation = {
//       type: 'Point',
//       coordinates: [lng, lat],
//       address: address || provider.currentLocation.address,
//       updatedAt: new Date()
//     };

//     // Auto-mark online if updating location
//     if (!provider.isOnline) {
//       provider.isOnline = true;
//       provider.onlineAt = new Date();
//     }

//     if (provider.status === 'offline') {
//       provider.status = 'available';
//     }

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Location updated successfully',
//       location: provider.currentLocation
//     });

//   } catch (error) {
//     console.error('Update Location Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating location',
//       error: error.message 
//     });
//   }
// };

// /**
//  * GET PROVIDER STATS
//  */
// exports.getProviderStats = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id })
//       .select('stats rating status wallet');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     return res.status(200).json({
//       success: true,
//       data: {
//         stats: provider.stats,
//         rating: provider.rating,
//         wallet: provider.wallet,
//         status: provider.status
//       }
//     });

//   } catch (error) {
//     console.error('Get Stats Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching stats',
//       error: error.message 
//     });
//   }
// };

// /**
//  * GET PROVIDER PROFILE (DETAILED)
//  */
// // exports.getProviderProfile = async (req, res) => {
// //   try {
// //     const provider = await Provider.findOne({ user: req.user.id })
// //       .populate('user', 'name phone email city profilePhoto');

// //     if (!provider)
// //       return res.status(404).json({ success: false, message: 'Provider not found' });

// //     return res.status(200).json({
// //       success: true,
// //       data: provider
// //     });

// //   } catch (error) {
// //     console.error('Get Profile Error:', error);
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: 'Error fetching profile',
// //       error: error.message 
// //     });
// //   }
// // };


// exports.getProviderProfile = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id })
//       .populate("user", "name phone email city profilePhoto");

//     if (!provider)
//       return res.status(404).json({
//         success: false,
//         message: "Provider not found"
//       });

//     res.json({
//       success: true,
//       data: provider
//     });

//   } catch (err) {
//     console.error("Get Profile Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching profile"
//     });
//   }
// };

// /**
//  * UPDATE PROVIDER PROFILE
//  */
// exports.updateProviderProfile = async (req, res) => {
//   try {
//     const {
//       vehicleModel,
//       vehicleColor,
//       emergencyContactName,
//       emergencyContactPhone,
//       emergencyContactRelation
//     } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     // Update vehicle info
//     if (vehicleModel) provider.vehicle.model = vehicleModel;
//     if (vehicleColor) provider.vehicle.color = vehicleColor;

//     // Update emergency contact
//     if (emergencyContactName || emergencyContactPhone || emergencyContactRelation) {
//       provider.emergencyContact = {
//         name: emergencyContactName || provider.emergencyContact?.name,
//         phone: emergencyContactPhone || provider.emergencyContact?.phone,
//         relation: emergencyContactRelation || provider.emergencyContact?.relation
//       };
//     }

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       provider
//     });

//   } catch (error) {
//     console.error('Update Profile Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating profile',
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPDATE BANK DETAILS
//  */
// exports.updateBankDetails = async (req, res) => {
//   try {
//     const {
//       accountHolderName,
//       accountNumber,
//       ifscCode,
//       bankName
//     } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.bankDetails = {
//       accountHolderName,
//       accountNumber,
//       ifscCode,
//       bankName,
//       verified: false
//     };

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Bank details updated successfully',
//       bankDetails: provider.bankDetails
//     });

//   } catch (error) {
//     console.error('Update Bank Details Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating bank details',
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPDATE PREFERENCES
//  */
// exports.updatePreferences = async (req, res) => {
//   try {
//     const { language, notifications, autoAccept, maxDistance } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     if (language) provider.preferences.language = language;
//     if (notifications) provider.preferences.notifications = { ...provider.preferences.notifications, ...notifications };
//     if (typeof autoAccept === 'boolean') provider.preferences.autoAccept = autoAccept;
//     if (maxDistance) provider.preferences.maxDistance = maxDistance;

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Preferences updated successfully',
//       preferences: provider.preferences
//     });

//   } catch (error) {
//     console.error('Update Preferences Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating preferences',
//       error: error.message 
//     });
//   }
// };

// /**
//  * GET TODAY'S EARNINGS
//  */
// exports.getTodayEarnings = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     // Get today's completed rides
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayRides = await Ride.find({
//       provider: provider._id,
//       status: 'completed',
//       completedAt: { $gte: today }
//     });

//     const totalEarnings = todayRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
//     const totalRides = todayRides.length;

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalEarnings,
//         totalRides,
//         averagePerRide: totalRides > 0 ? totalEarnings / totalRides : 0
//       }
//     });

//   } catch (error) {
//     console.error('Get Today Earnings Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching earnings',
//       error: error.message 
//     });
//   }
// };

// /**
//  * GET WEEKLY EARNINGS
//  */
// exports.getWeeklyEarnings = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);

//     const weekRides = await Ride.find({
//       provider: provider._id,
//       status: 'completed',
//       completedAt: { $gte: weekAgo }
//     });

//     const totalEarnings = weekRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalEarnings,
//         totalRides: weekRides.length
//       }
//     });

//   } catch (error) {
//     console.error('Get Weekly Earnings Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error fetching earnings',
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPLOAD DOCUMENT
//  */
// exports.uploadDocument = async (req, res) => {
//   try {
//     const { documentType, documentNumber, expiryDate } = req.body;
//     const file = req.file; // Assuming multer middleware

//     if (!file) {
//       return res.status(400).json({ success: false, message: 'No file uploaded' });
//     }

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     const photoUrl = `/uploads/${file.filename}`; // Or your cloud storage URL

//     switch (documentType) {
//       case 'license':
//         provider.documents.license = {
//           ...provider.documents.license,
//           number: documentNumber,
//           photo: photoUrl,
//           expiryDate: expiryDate,
//           verified: false
//         };
//         break;
//       case 'rc':
//         provider.documents.rc = {
//           ...provider.documents.rc,
//           number: documentNumber,
//           photo: photoUrl,
//           verified: false
//         };
//         break;
//       case 'insurance':
//         provider.documents.insurance = {
//           ...provider.documents.insurance,
//           number: documentNumber,
//           photo: photoUrl,
//           expiryDate: expiryDate,
//           verified: false
//         };
//         break;
//       case 'aadhaar':
//         provider.documents.aadhaar = {
//           ...provider.documents.aadhaar,
//           number: documentNumber,
//           photo: photoUrl,
//           verified: false
//         };
//         break;
//       case 'photo':
//         provider.documents.photo = photoUrl;
//         break;
//       default:
//         return res.status(400).json({ success: false, message: 'Invalid document type' });
//     }

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Document uploaded successfully',
//       document: provider.documents[documentType]
//     });

//   } catch (error) {
//     console.error('Upload Document Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error uploading document',
//       error: error.message 
//     });
//   }
// };

// /**
//  * UPDATE FCM TOKEN (for push notifications)
//  */
// exports.updateFCMToken = async (req, res) => {
//   try {
//     const { fcmToken, deviceId, platform } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.deviceInfo = {
//       fcmToken,
//       deviceId,
//       platform
//     };

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: 'FCM token updated successfully'
//     });

//   } catch (error) {
//     console.error('Update FCM Token Error:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error updating token',
//       error: error.message 
//     });
//   }
// };



// module.exports = { uploadPhoto };


// const Provider = require('../models/Provider');
// const User = require('../models/User');
// const Ride = require('../models/Ride');
// const multer = require('multer');
// const path = require('path');


// // ================= PROFILE PHOTO UPLOAD HELPER =================

// const photoStorage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/profile/'),
//   filename: (req, file, cb) =>
//     cb(null, 'profile-' + Date.now() + path.extname(file.originalname))
// });

// const photoFilter = (req, file, cb) => {
//   const allowed = /jpeg|jpg|png/;
//   if (allowed.test(file.mimetype)) cb(null, true);
//   else cb(new Error('Only JPG/PNG allowed'));
// };

// exports.uploadPhoto = multer({
//   storage: photoStorage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: photoFilter
// }).single('photo');


// // ================= CONTROLLERS =================

// // Upload Profile Photo
// exports.uploadProfilePhoto = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     if (!req.file)
//       return res.status(400).json({ success: false, message: 'Please upload a photo' });

//     provider.profilePhoto = `/uploads/profile/${req.file.filename}`;
//     await provider.save();

//     res.json({
//       success: true,
//       message: 'Profile photo updated successfully',
//       data: { profilePhoto: provider.profilePhoto }
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // GET Available Providers
// exports.getAvailableProviders = async (req, res) => {
//   try {
//     let { lat, lng, radius = 5000, vehicleType } = req.query;

//     lat = parseFloat(lat);
//     lng = parseFloat(lng);
//     radius = parseInt(radius);

//     const baseQuery = {
//       status: 'available',
//       isApproved: true,
//       isOnline: true
//     };

//     if (vehicleType) baseQuery['vehicle.type'] = vehicleType;

//     let query = Provider.find(baseQuery)
//       .populate('user', 'name phone city profilePhoto')
//       .select('-documents.aadhaar -documents.license.number -documents.rc.number')
//       .lean();

//     if (!isNaN(lat) && !isNaN(lng)) {
//       query = query.where('currentLocation').near({
//         center: { type: 'Point', coordinates: [lng, lat] },
//         maxDistance: radius,
//         spherical: true
//       });
//     }

//     const providers = await query.limit(20);

//     res.json({ success: true, count: providers.length, providers });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // GET provider by ID
// exports.getProviderById = async (req, res) => {
//   try {
//     const provider = await Provider.findById(req.params.id)
//       .populate('user', 'name phone city profilePhoto')
//       .select('-documents.aadhaar -bankDetails');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     res.json({ success: true, provider });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Register Provider
// exports.registerProvider = async (req, res) => {
//   try {
//     const {
//       vehicleType,
//       vehicleNumber,
//       vehicleModel,
//       vehicleColor,
//       licenseNumber,
//       rcNumber
//     } = req.body;

//     const exists = await Provider.findOne({ user: req.user.id });
//     if (exists)
//       return res.status(400).json({ success: false, message: 'Already registered' });

//     const vehicleExists = await Provider.findOne({
//       'vehicle.number': vehicleNumber.toUpperCase()
//     });

//     if (vehicleExists)
//       return res.status(400).json({ success: false, message: 'Vehicle already registered' });

//     const provider = await Provider.create({
//       user: req.user.id,
//       vehicle: {
//         type: vehicleType,
//         number: vehicleNumber.toUpperCase(),
//         model: vehicleModel,
//         color: vehicleColor
//       },
//       documents: {
//         license: { number: licenseNumber },
//         rc: { number: rcNumber }
//       },
//       status: 'offline',
//       isOnline: false
//     });

//     await User.findByIdAndUpdate(req.user.id, { role: 'provider' });

//     res.status(201).json({
//       success: true,
//       message: 'Provider registered successfully',
//       provider
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Update Status
// exports.updateProviderStatus = async (req, res) => {
//   try {
//     const { status, isOnline } = req.body;

//     const provider = await Provider.findOne({ user: req.user.id });
//     if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

//     if (status) provider.status = status;
//     if (typeof isOnline === 'boolean') provider.isOnline = isOnline;

//     await provider.save();

//     res.json({
//       success: true,
//       provider: { status: provider.status, isOnline: provider.isOnline }
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Toggle Duty
// exports.toggleDuty = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.isOnline = !provider.isOnline;
//     provider.status = provider.isOnline ? 'available' : 'offline';

//     await provider.save();

//     res.json({
//       success: true,
//       isOnline: provider.isOnline,
//       status: provider.status
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Update Location
// exports.updateProviderLocation = async (req, res) => {
//   try {
//     let { lat, lng, address } = req.body;

//     lat = parseFloat(lat);
//     lng = parseFloat(lng);

//     if (isNaN(lat) || isNaN(lng))
//       return res.status(400).json({ success: false, message: 'Invalid lat/lng' });

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.currentLocation = {
//       type: 'Point',
//       coordinates: [lng, lat],
//       address,
//       updatedAt: new Date()
//     };

//     await provider.save();

//     res.json({ success: true, message: 'Location updated' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Get Stats
// exports.getProviderStats = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id })
//       .select('stats rating status wallet');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     res.json({ success: true, data: provider });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Get Profile
// exports.getProviderProfile = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id })
//       .populate('user', 'name phone email city profilePhoto');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     res.json({ success: true, data: provider });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Update Profile
// exports.updateProviderProfile = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     Object.assign(provider.vehicle, {
//       model: req.body.vehicleModel || provider.vehicle.model,
//       color: req.body.vehicleColor || provider.vehicle.color
//     });

//     await provider.save();

//     res.json({ success: true, message: 'Profile updated', provider });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Bank Details
// exports.updateBankDetails = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.bankDetails = { ...req.body, verified: false };

//     await provider.save();

//     res.json({ success: true, message: 'Bank updated' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Preferences
// exports.updatePreferences = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.preferences = { ...provider.preferences, ...req.body };

//     await provider.save();

//     res.json({ success: true, message: 'Preferences updated' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Today's Earnings
// exports.getTodayEarnings = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });
//     if (!provider) return res.status(404).json({ success: false });

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const rides = await Ride.find({
//       provider: provider._id,
//       status: 'completed',
//       completedAt: { $gte: today }
//     });

//     const total = rides.reduce((s, r) => s + (r.fare || 0), 0);

//     res.json({
//       success: true,
//       data: { totalEarnings: total, totalRides: rides.length }
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Weekly Earnings
// exports.getWeeklyEarnings = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });
//     if (!provider) return res.status(404).json({ success: false });

//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);

//     const rides = await Ride.find({
//       provider: provider._id,
//       status: 'completed',
//       completedAt: { $gte: weekAgo }
//     });

//     const total = rides.reduce((s, r) => s + (r.fare || 0), 0);

//     res.json({
//       success: true,
//       data: { totalEarnings: total, totalRides: rides.length }
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Upload Documents
// exports.uploadDocument = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     if (!req.file)
//       return res.status(400).json({ success: false, message: 'File required' });

//     res.json({ success: true, message: 'Document uploaded' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// // Update FCM Token
// exports.updateFCMToken = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.deviceInfo = req.body;

//     await provider.save();

//     res.json({ success: true, message: 'FCM token updated' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };





const Provider = require('../models/Provider');
const User = require('../models/User');
const Ride = require('../models/Ride');
const multer = require('multer');
const path = require('path');


// ================= PROFILE PHOTO UPLOAD HELPER =================

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No photo uploaded' 
      });
    }

    // Database mein save karo
    // const provider = await Provider.findByIdAndUpdate(
    //   req.user.id, 
    //   { profilePhoto: req.file.path },
    //   { new: true }
    // );

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        url: `/uploads/profile/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    
    // Agar error hai toh file delete kar do
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Photo upload failed', 
      error: error.message 
    });
  }
};


// ================= DOCUMENT UPLOAD HELPER =================

// controllers/documentController.js
// exports.uploadDoc = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     const documentData = {
//       documentType: req.body.documentType,
//       filePath: req.file.path,
//       filename: req.file.filename,
//       originalName: req.file.originalname,
//       size: req.file.size,
//       userId: req.user.id // from protect middleware
//     };

//     // Save to database or process further
    
//     res.status(200).json({
//       message: 'Document uploaded successfully',
//       document: documentData
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Upload failed', error: error.message });
//   }
// };


exports.uploadDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No document uploaded' 
      });
    }

    if (!req.body.documentType) {
      // File delete karo if documentType nahi hai
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        message: 'Document type is required' 
      });
    }

    // Database mein save karo
    // const document = await Document.create({
    //   userId: req.user.id,
    //   documentType: req.body.documentType,
    //   filePath: req.file.path,
    //   filename: req.file.filename,
    //   status: 'pending'
    // });

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        documentType: req.body.documentType,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        url: `/uploads/documents/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    
    // Agar error hai toh file delete kar do
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Document upload failed', 
      error: error.message 
    });
  }
};
// ================= CONTROLLERS =================

// Upload Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    if (!req.file)
      return res.status(400).json({ success: false, message: 'Please upload a photo' });

    provider.profilePhoto = `/uploads/profile/${req.file.filename}`;
    await provider.save();

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: { profilePhoto: provider.profilePhoto }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Upload Document
exports.uploadProviderDocument = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    const { documentType } = req.body;

    if (!documentType)
      return res.status(400).json({ success: false, message: 'Document type is required' });

    if (!req.file)
      return res.status(400).json({ success: false, message: 'Please upload a document' });

    // Validate document type
    const validTypes = ['license', 'rc', 'insurance', 'aadhaar'];
    if (!validTypes.includes(documentType))
      return res.status(400).json({ success: false, message: 'Invalid document type' });

    // Update document URL
    const documentUrl = `/uploads/documents/${req.file.filename}`;
    
    provider.documents[documentType].url = documentUrl;
    provider.documents[documentType].verified = false; // Reset verification

    await provider.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully. Waiting for admin verification.',
      data: {
        documentType,
        url: documentUrl,
        verified: false
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET Available Providers
exports.getAvailableProviders = async (req, res) => {
  try {
    let { lat, lng, radius = 5000, vehicleType } = req.query;

    lat = parseFloat(lat);
    lng = parseFloat(lng);
    radius = parseInt(radius);

    const baseQuery = {
      status: 'available',
      isApproved: true,
      isOnline: true
    };

    if (vehicleType) baseQuery['vehicle.type'] = vehicleType;

    let query = Provider.find(baseQuery)
      .populate('user', 'name phone city profilePhoto')
      .select('-documents.aadhaar -documents.license.number -documents.rc.number')
      .lean();

    if (!isNaN(lat) && !isNaN(lng)) {
      query = query.where('currentLocation').near({
        center: { type: 'Point', coordinates: [lng, lat] },
        maxDistance: radius,
        spherical: true
      });
    }

    const providers = await query.limit(20);

    res.json({ success: true, count: providers.length, providers });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET provider by ID
exports.getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('user', 'name phone city profilePhoto')
      .select('-documents.aadhaar -bankDetails');

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    res.json({ success: true, provider });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Register Provider
exports.registerProvider = async (req, res) => {
  try {
    const {
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleColor,
      licenseNumber,
      rcNumber
    } = req.body;

    const exists = await Provider.findOne({ user: req.user.id });
    if (exists)
      return res.status(400).json({ success: false, message: 'Already registered' });

    const vehicleExists = await Provider.findOne({
      'vehicle.number': vehicleNumber.toUpperCase()
    });

    if (vehicleExists)
      return res.status(400).json({ success: false, message: 'Vehicle already registered' });

    const provider = await Provider.create({
      user: req.user.id,
      vehicle: {
        type: vehicleType,
        number: vehicleNumber.toUpperCase(),
        model: vehicleModel,
        color: vehicleColor
      },
      documents: {
        license: { number: licenseNumber },
        rc: { number: rcNumber }
      },
      status: 'offline',
      isOnline: false
    });

    await User.findByIdAndUpdate(req.user.id, { role: 'provider' });

    res.status(201).json({
      success: true,
      message: 'Provider registered successfully',
      provider
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update Status
exports.updateProviderStatus = async (req, res) => {
  try {
    const { status, isOnline } = req.body;

    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    if (status) provider.status = status;
    if (typeof isOnline === 'boolean') provider.isOnline = isOnline;

    await provider.save();

    res.json({
      success: true,
      provider: { status: provider.status, isOnline: provider.isOnline }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Toggle Duty
exports.toggleDuty = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    if (!provider.isApproved)
      return res.status(403).json({ success: false, message: 'Provider not approved yet' });

    provider.isOnline = !provider.isOnline;
    provider.status = provider.isOnline ? 'available' : 'offline';

    await provider.save();

    res.json({
      success: true,
      isOnline: provider.isOnline,
      status: provider.status,
      message: `You are now ${provider.isOnline ? 'online' : 'offline'}`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update Location
// exports.updateProviderLocation = async (req, res) => {
//   try {
//     let { lat, lng, address } = req.body;

//     lat = parseFloat(lat);
//     lng = parseFloat(lng);

//     if (isNaN(lat) || isNaN(lng))
//       return res.status(400).json({ success: false, message: 'Invalid lat/lng' });

//     const provider = await Provider.findOne({ user: req.user.id });

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     provider.currentLocation = {
//       type: 'Point',
//       coordinates: [lng, lat],
//       address,
//       updatedAt: new Date()
//     };

//     await provider.save();

//     res.json({ success: true, message: 'Location updated' });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.updateProviderLocation = async (req, res) => {
  const { lat, lng } = req.body;

  const provider = await Provider.findOne({ user: req.user.id });

  provider.currentLocation = {
    type: 'Point',
    coordinates: [Number(lng), Number(lat)]
  };

  provider.isOnline = true;
  provider.status = 'available';

  await provider.save();

  res.json({ success: true });
};



// Get Stats
exports.getProviderStats = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id })
      .select('stats rating status wallet');

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    res.json({ success: true, data: provider });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get Profile
// exports.getProviderProfile = async (req, res) => {
//   try {
//     const provider = await Provider.findOne({ user: req.user.id })
//       .populate('user', 'name phone email city profilePhoto');

//     if (!provider)
//       return res.status(404).json({ success: false, message: 'Provider not found' });

//     res.json({ success: true, data: provider });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



exports.getProviderProfile = async (req, res) => {
  try {
    let provider = await Provider.findOne({ user: req.user.id })
      .populate('user', 'name phone email city profilePhoto');

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    provider = provider.toObject();

    provider.documents = provider.documents || {};
    provider.documents.license = provider.documents.license || {};
    provider.documents.rc = provider.documents.rc || {};
    provider.documents.insurance = provider.documents.insurance || {};
    provider.documents.aadhaar = provider.documents.aadhaar || {};
    provider.documents.photo = provider.documents.photo || "";

    res.json({ success: true, data: provider });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// Update Profile
exports.updateProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    Object.assign(provider.vehicle, {
      model: req.body.vehicleModel || provider.vehicle.model,
      color: req.body.vehicleColor || provider.vehicle.color
    });

    await provider.save();

    res.json({ success: true, message: 'Profile updated', provider });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Bank Details
exports.updateBankDetails = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    provider.bankDetails = { ...req.body, verified: false };

    await provider.save();

    res.json({ success: true, message: 'Bank updated' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Preferences
exports.updatePreferences = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    provider.preferences = { ...provider.preferences, ...req.body };

    await provider.save();

    res.json({ success: true, message: 'Preferences updated' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Today's Earnings
exports.getTodayEarnings = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rides = await Ride.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: today }
    });

    const total = rides.reduce((s, r) => s + (r.fare || 0), 0);

    res.json({
      success: true,
      data: { totalEarnings: total, totalRides: rides.length }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Weekly Earnings
exports.getWeeklyEarnings = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider) return res.status(404).json({ success: false });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const rides = await Ride.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: weekAgo }
    });

    const total = rides.reduce((s, r) => s + (r.fare || 0), 0);

    res.json({
      success: true,
      data: { totalEarnings: total, totalRides: rides.length }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Update FCM Token
exports.updateFCMToken = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.id });

    if (!provider)
      return res.status(404).json({ success: false, message: 'Provider not found' });

    provider.deviceInfo = req.body;

    await provider.save();

    res.json({ success: true, message: 'FCM token updated' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};