// const ProfileTab = () => (
//   <div className="pb-20 space-y-3">
//     <div className="bg-white p-4 rounded shadow">
//       <p><b>Name:</b> Prince</p>
//       <p><b>Vehicle:</b> Auto Rickshaw</p>
//       <p><b>Vehicle No:</b> MP09 AB 1234</p>
//       <p><b>Documents:</b> ✅ Verified</p>
//     </div>
//   </div>
// );

// export default ProfileTab;



// import React from 'react';
// import { User, Car, FileText, Settings, HelpCircle, LogOut, Shield, Bell, Star } from 'lucide-react';

// const ProfileTab = () => {
//   return (
//     <div className="pb-20 space-y-4">
      
//       {/* ✅ Profile Header */}
//       <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
//         <div className="flex items-center gap-4 mb-4">
//           <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
//             PS
//           </div>
//           <div className="flex-1">
//             <h2 className="text-2xl font-bold">Prince Sharma</h2>
//             <p className="text-sm opacity-90">Driver ID: #DR12345</p>
//             <div className="flex items-center gap-1 mt-1">
//               <Star size={16} fill="white" />
//               <span className="font-semibold">4.8 Rating</span>
//               <span className="opacity-75">(156 rides)</span>
//             </div>
//           </div>
//         </div>
        
//         <div className="flex gap-3">
//           <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg font-semibold transition">
//             Edit Profile
//           </button>
//           <button className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-2 rounded-lg font-semibold transition">
//             Share Profile
//           </button>
//         </div>
//       </div>

//       {/* ✅ Vehicle Info */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center gap-2 mb-3">
//           <Car className="text-orange-600" size={20} />
//           <h3 className="font-bold text-lg">Vehicle Details</h3>
//         </div>
        
//         <div className="space-y-2 text-sm">
//           <div className="flex justify-between">
//             <span className="text-gray-600">Vehicle Type:</span>
//             <span className="font-semibold">Auto Rickshaw</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Vehicle Number:</span>
//             <span className="font-semibold">MP09 AB 1234</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Model:</span>
//             <span className="font-semibold">Bajaj RE Compact</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Color:</span>
//             <span className="font-semibold">Yellow & Black</span>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Documents Status */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center gap-2 mb-3">
//           <FileText className="text-orange-600" size={20} />
//           <h3 className="font-bold text-lg">Documents</h3>
//         </div>
        
//         <div className="space-y-3">
//           <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Shield className="text-green-600" size={18} />
//               <span className="text-sm font-semibold">Driving License</span>
//             </div>
//             <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">✓ Verified</span>
//           </div>
          
//           <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Shield className="text-green-600" size={18} />
//               <span className="text-sm font-semibold">Vehicle Registration</span>
//             </div>
//             <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">✓ Verified</span>
//           </div>
          
//           <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Shield className="text-green-600" size={18} />
//               <span className="text-sm font-semibold">Insurance</span>
//             </div>
//             <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">✓ Verified</span>
//           </div>
          
//           <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Shield className="text-green-600" size={18} />
//               <span className="text-sm font-semibold">Background Check</span>
//             </div>
//             <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full">✓ Verified</span>
//           </div>
//         </div>
        
//         <button className="w-full mt-3 text-orange-600 font-semibold text-sm py-2 hover:bg-orange-50 rounded-lg transition">
//           Upload New Document
//         </button>
//       </div>

//       {/* ✅ Settings Menu */}
//       <div className="bg-white rounded-xl shadow overflow-hidden">
//         <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b">
//           <Settings className="text-gray-600" size={20} />
//           <span className="flex-1 text-left font-semibold">Settings</span>
//           <span className="text-gray-400">›</span>
//         </button>
        
//         <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b">
//           <Bell className="text-gray-600" size={20} />
//           <span className="flex-1 text-left font-semibold">Notifications</span>
//           <span className="text-gray-400">›</span>
//         </button>
        
//         <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b">
//           <HelpCircle className="text-gray-600" size={20} />
//           <span className="flex-1 text-left font-semibold">Help & Support</span>
//           <span className="text-gray-400">›</span>
//         </button>
        
//         <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition">
//           <FileText className="text-gray-600" size={20} />
//           <span className="flex-1 text-left font-semibold">Terms & Privacy</span>
//           <span className="text-gray-400">›</span>
//         </button>
//       </div>

//       {/* ✅ Logout */}
//       <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
//         <LogOut size={18} />
//         Logout
//       </button>

//       {/* App Version */}
//       <p className="text-center text-xs text-gray-400">
//         Version 1.0.0 • © 2024 RideApp
//       </p>

//     </div>
//   );
// };

// export default ProfileTab;


// import React, { useState, useEffect } from 'react';
// import { 
//   User, Car, FileText, Settings, HelpCircle, LogOut, 
//   Shield, Bell, Star, Edit2, Camera, ChevronRight, TrendingUp,
//   Phone, Mail, MapPin, Calendar, Award
// } from 'lucide-react';

// import { useDriver } from '../context/Drivercontext';
// import { useAuth } from '../context/AuthContext';
// import { providerAPI } from '../services/api';

// const ProfileTab = () => {
//   const { refreshDriver } = useDriver();
//   const { logout } = useAuth();

//   const [profile, setProfile] = useState(null);
//   const [stats, setStats] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [uploadingPhoto, setUploadingPhoto] = useState(false);

//   // LOAD PROFILE
//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     try {
//       setLoading(true);

//       const res = await providerAPI.getProfile();
//       setProfile(res.data.data);

//       const statRes = await providerAPI.getStats();
//       setStats(statRes.data.data);

//     } catch (err) {
//       console.log(err);
//       alert("Failed to load profile");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UPLOAD PHOTO
//   const handlePhotoUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
    
//     // Validate file
//     if (!file.type.startsWith('image/')) {
//       alert('Please upload an image file');
//       return;
//     }
    
//     if (file.size > 10 * 1024 * 1024) {
//       alert('Image size should be less than 5MB');
//       return;
//     }
    
//     try {
//       setUploadingPhoto(true);
//       const fd = new FormData();
//       fd.append("photo", file);
//       await providerAPI.uploadProfilePhoto(fd);
//       await loadData();
//       await refreshDriver();
//       alert('Profile photo updated successfully!');
//     } catch (err) {
//       console.error(err);
//       alert("Upload failed");
//     } finally {
//       setUploadingPhoto(false);
//     }
//   };

//   const handleLogout = async () => {
//     if (!window.confirm("Are you sure you want to logout?")) return;
//     await logout();
//     window.location.href = "/";
//   };

//   if (loading || !profile) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin h-12 w-12 border-b-2 border-orange-600 rounded-full"></div>
//       </div>
//     );
//   }

//   const user = profile.user || {};
//   const vehicle = profile.vehicle || {};
//   const documents = profile.documents || {};
//   const rating = profile.rating || { average: 0, count: 0 };

//   const getInitials = (name) =>
//     name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "DR";

//   return (
//     <div className="pb-20 space-y-4">

//       {/* PROFILE HEADER */}
//       <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
//         <div className="flex items-center gap-4 mb-4">
          
//           {/* Profile Photo */}
//           <div className="relative">
//             {profile.profilePhoto ? (
//               <img 
//                 src={profile.profilePhoto}
//                 alt="Profile"
//                 className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
//               />
//             ) : (
//               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
//                 {getInitials(user.name)}
//               </div>
//             )}

//             {/* Upload Photo Button */}
//             <label className={`absolute bottom-0 right-0 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg cursor-pointer hover:bg-gray-100 transition ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
//               {uploadingPhoto ? (
//                 <div className="animate-spin h-3 w-3 border-2 border-orange-600 border-t-transparent rounded-full"></div>
//               ) : (
//                 <Camera size={14} className="text-orange-600" />
//               )}
//               <input 
//                 type="file" 
//                 accept="image/*"
//                 onChange={handlePhotoUpload}
//                 disabled={uploadingPhoto}
//                 className="hidden" 
//               />
//             </label>
//           </div>

//           {/* User Info */}
//           <div className="flex-1">
//             <h2 className="text-2xl font-bold">{user.name || 'Driver'}</h2>
//             <p className="text-sm opacity-90">ID #{profile._id?.slice(-6).toUpperCase() || 'N/A'}</p>
//             <div className="flex items-center gap-1 mt-1">
//               <Star size={16} fill="white" className="text-white" />
//               <span className="font-semibold">{rating.average?.toFixed(1) || '0.0'}</span>
//               <span className="opacity-75">({rating.count || 0} rides)</span>
//             </div>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div className="flex gap-3">
//           <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
//             <Edit2 size={16} />
//             Edit Profile
//           </button>
//           <button className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-2 rounded-lg font-semibold transition">
//             Share Profile
//           </button>
//         </div>
//       </div>

//       {/* CONTACT INFORMATION */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center gap-2 mb-4">
//           <User className="text-orange-600" size={20} />
//           <h3 className="font-bold text-lg">Contact Information</h3>
//         </div>
        
//         <div className="space-y-3">
//           <InfoRow 
//             icon={<Phone size={18} className="text-gray-500" />}
//             label="Phone Number"
//             value={user.phone || 'Not provided'}
//           />
//           <InfoRow 
//             icon={<Mail size={18} className="text-gray-500" />}
//             label="Email Address"
//             value={user.email || 'Not added'}
//           />
//           <InfoRow 
//             icon={<MapPin size={18} className="text-gray-500" />}
//             label="City"
//             value={profile.city || user.city || 'Not added'}
//           />
//           <InfoRow 
//             icon={<Calendar size={18} className="text-gray-500" />}
//             label="Member Since"
//             value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
//           />
//         </div>
//       </div>

//       {/* VEHICLE DETAILS */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <Car className="text-orange-600" size={20} />
//             <h3 className="font-bold text-lg">Vehicle Details</h3>
//           </div>
//           <button className="text-orange-600 text-sm font-semibold hover:underline">
//             Edit
//           </button>
//         </div>
        
//         <div className="space-y-3">
//           <InfoRow 
//             label="Vehicle Type"
//             value={vehicle.type ? vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1) : 'Not specified'}
//             badge={true}
//           />
//           <InfoRow 
//             label="Vehicle Number"
//             value={vehicle.number?.toUpperCase() || 'Not provided'}
//           />
//           <InfoRow 
//             label="Vehicle Model"
//             value={vehicle.model || 'Not specified'}
//           />
//           <InfoRow 
//             label="Vehicle Color"
//             value={vehicle.color || 'Not specified'}
//           />
//         </div>
//       </div>

//       {/* PERFORMANCE STATS */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center gap-2 mb-4">
//           <TrendingUp className="text-orange-600" size={20} />
//           <h3 className="font-bold text-lg">Performance Overview</h3>
//         </div>
        
//         <div className="grid grid-cols-2 gap-3">
//           <StatCard 
//             label="Total Rides"
//             value={stats.totalTrips || 0}
//             bgColor="bg-green-50"
//             textColor="text-green-700"
//             icon="🚗"
//           />
//           <StatCard 
//             label="Completed"
//             value={stats.completedTrips || 0}
//             bgColor="bg-blue-50"
//             textColor="text-blue-700"
//             icon="✓"
//           />
//           <StatCard 
//             label="Total Earnings"
//             value={`₹${stats.totalEarnings || 0}`}
//             bgColor="bg-purple-50"
//             textColor="text-purple-700"
//             icon="💰"
//           />
//           <StatCard 
//             label="Online Hours"
//             value={`${stats.onlineHours?.toFixed(0) || 0}h`}
//             bgColor="bg-orange-50"
//             textColor="text-orange-700"
//             icon="⏱️"
//           />
//         </div>
//       </div>

//       {/* DOCUMENTS STATUS */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center gap-2 mb-4">
//           <FileText className="text-orange-600" size={20} />
//           <h3 className="font-bold text-lg">Documents</h3>
//         </div>
        
//         <div className="space-y-3">
//           <DocumentStatus 
//             name="Driving License"
//             doc={documents.license}
//           />
//           <DocumentStatus 
//             name="Vehicle RC (Registration)"
//             doc={documents.rc}
//           />
//           <DocumentStatus 
//             name="Insurance Certificate"
//             doc={documents.insurance}
//           />
//           <DocumentStatus 
//             name="Aadhaar Card"
//             doc={documents.aadhaar}
//           />
//         </div>
        
//         <button className="w-full mt-4 text-orange-600 font-semibold text-sm py-3 hover:bg-orange-50 rounded-lg transition border-2 border-dashed border-orange-300">
//           + Upload New Document
//         </button>
//       </div>

//       {/* BANK DETAILS (if exists) */}
//       {profile.bankDetails && (
//         <div className="bg-white p-4 rounded-xl shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-2">
//               <Award className="text-orange-600" size={20} />
//               <h3 className="font-bold text-lg">Bank Details</h3>
//             </div>
//             <button className="text-orange-600 text-sm font-semibold hover:underline">
//               Edit
//             </button>
//           </div>
          
//           <div className="space-y-3">
//             <InfoRow 
//               label="Bank Name"
//               value={profile.bankDetails.bankName || 'N/A'}
//             />
//             <InfoRow 
//               label="Account Number"
//               value={'*'.repeat(8) + (profile.bankDetails.accountNumber?.slice(-4) || 'N/A')}
//             />
//             <InfoRow 
//               label="IFSC Code"
//               value={profile.bankDetails.ifsc || 'N/A'}
//             />
//           </div>
//         </div>
//       )}

//       {/* SETTINGS MENU */}
//       <div className="bg-white rounded-xl shadow overflow-hidden">
//         <MenuItem 
//           icon={Settings} 
//           label="Settings & Preferences" 
//           onClick={() => alert('Settings coming soon!')}
//         />
//         <MenuItem 
//           icon={Bell} 
//           label="Notifications" 
//           onClick={() => alert('Notifications coming soon!')}
//         />
//         <MenuItem 
//           icon={HelpCircle} 
//           label="Help & Support" 
//           onClick={() => alert('Help & Support coming soon!')}
//         />
//         <MenuItem 
//           icon={FileText} 
//           label="Terms & Privacy Policy" 
//           onClick={() => alert('Terms & Privacy coming soon!')}
//         />
//       </div>

//       {/* LOGOUT BUTTON */}
//       <button 
//         onClick={handleLogout}
//         className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow"
//       >
//         <LogOut size={18} />
//         Logout
//       </button>

//       {/* APP VERSION */}
//       <p className="text-center text-xs text-gray-400 pb-4">
//         Version 1.0.0 • © 2024 GaonConnect
//       </p>

//     </div>
//   );
// };

// // INFO ROW COMPONENT
// const InfoRow = ({ icon, label, value, badge }) => (
//   <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
//     <div className="flex items-center gap-2">
//       {icon && icon}
//       <span className="text-sm text-gray-600">{label}</span>
//     </div>
//     {badge ? (
//       <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
//         {value}
//       </span>
//     ) : (
//       <span className="text-sm font-semibold text-gray-800">{value}</span>
//     )}
//   </div>
// );

// // STAT CARD COMPONENT
// const StatCard = ({ label, value, bgColor, textColor, icon }) => (
//   <div className={`${bgColor} p-4 rounded-xl`}>
//     <div className="flex items-center justify-between mb-1">
//       <p className="text-xs text-gray-600">{label}</p>
//       <span className="text-xl">{icon}</span>
//     </div>
//     <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
//   </div>
// );

// // DOCUMENT STATUS COMPONENT
// const DocumentStatus = ({ name, doc }) => {
//   const getStatus = () => {
//     if (doc?.verified) {
//       return {
//         text: 'Verified',
//         bgColor: 'bg-green-50',
//         borderColor: 'border-green-200',
//         badgeColor: 'bg-green-600',
//         icon: <Shield size={18} className="text-green-600" />
//       };
//     }
//     if (doc?.url) {
//       return {
//         text: 'Pending Verification',
//         bgColor: 'bg-yellow-50',
//         borderColor: 'border-yellow-200',
//         badgeColor: 'bg-yellow-600',
//         icon: <Shield size={18} className="text-yellow-600" />
//       };
//     }
//     return {
//       text: 'Not Uploaded',
//       bgColor: 'bg-red-50',
//       borderColor: 'border-red-200',
//       badgeColor: 'bg-red-600',
//       icon: <Shield size={18} className="text-gray-400" />
//     };
//   };

//   const status = getStatus();

//   return (
//     <div className={`${status.bgColor} border-2 ${status.borderColor} p-3 rounded-lg flex items-center justify-between`}>
//       <div className="flex items-center gap-3">
//         {status.icon}
//         <span className="text-sm font-semibold text-gray-800">{name}</span>
//       </div>
//       <span className={`${status.badgeColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
//         {status.text}
//       </span>
//     </div>
//   );
// };

// // MENU ITEM COMPONENT
// const MenuItem = ({ icon: Icon, label, onClick }) => (
//   <button
//     onClick={onClick}
//     className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b last:border-b-0 group"
//   >
//     <Icon className="text-gray-600 group-hover:text-orange-600 transition" size={20} />
//     <span className="flex-1 text-left font-semibold text-gray-700 group-hover:text-orange-600 transition">
//       {label}
//     </span>
//     <ChevronRight className="text-gray-400 group-hover:text-orange-600 transition" size={20} />
//   </button>
// );

// export default ProfileTab;



import React, { useState, useEffect } from 'react';
import { 
  User, Car, FileText, Settings, HelpCircle, LogOut, 
  Shield, Bell, Star, Edit2, Camera, ChevronRight, TrendingUp,
  Phone, Mail, MapPin, Calendar, Award, Upload
} from 'lucide-react';

import { useDriver } from '../context/Drivercontext';
import { useAuth } from '../context/AuthContext';
import { providerAPI } from '../services/api';
import DocumentUploadModal from './DocumentUploadModal';

const ProfileTab = () => {
  const { refreshDriver } = useDriver();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // LOAD PROFILE
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await providerAPI.getProfile();
      setProfile(res.data.data);

      const statRes = await providerAPI.getStats();
      setStats(statRes.data.data);

    } catch (err) {
      console.log(err);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // UPLOAD PHOTO
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      const fd = new FormData();
      fd.append("photo", file);
      await providerAPI.uploadProfilePhoto(fd);
      await loadData();
      await refreshDriver();
      alert('Profile photo updated successfully!');
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    await logout();
    window.location.href = "/";
  };

  const handleUploadSuccess = () => {
    loadData(); // Refresh profile data after document upload
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-b-2 border-orange-600 rounded-full"></div>
      </div>
    );
  }

  const user = profile.user || {};
  const vehicle = profile.vehicle || {};
  const documents = profile.documents || {};
  const rating = profile.rating || { average: 0, count: 0 };

  const getInitials = (name) =>
    name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "DR";

  return (
    <div className="pb-20 space-y-4">

      {/* PROFILE HEADER */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          
          {/* Profile Photo */}
          <div className="relative">
            {profile.profilePhoto ? (
              <img 
                src={profile.profilePhoto}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {getInitials(user.name)}
              </div>
            )}

            {/* Upload Photo Button */}
            <label className={`absolute bottom-0 right-0 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg cursor-pointer hover:bg-gray-100 transition ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploadingPhoto ? (
                <div className="animate-spin h-3 w-3 border-2 border-orange-600 border-t-transparent rounded-full"></div>
              ) : (
                <Camera size={14} className="text-orange-600" />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden" 
              />
            </label>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name || 'Driver'}</h2>
            <p className="text-sm opacity-90">ID #{profile._id?.slice(-6).toUpperCase() || 'N/A'}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={16} fill="white" className="text-white" />
              <span className="font-semibold">{rating.average?.toFixed(1) || '0.0'}</span>
              <span className="opacity-75">({rating.count || 0} rides)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
            <Edit2 size={16} />
            Edit Profile
          </button>
          <button className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-2 rounded-lg font-semibold transition">
            Share Profile
          </button>
        </div>
      </div>

      {/* CONTACT INFORMATION */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-orange-600" size={20} />
          <h3 className="font-bold text-lg">Contact Information</h3>
        </div>
        
        <div className="space-y-3">
          <InfoRow 
            icon={<Phone size={18} className="text-gray-500" />}
            label="Phone Number"
            value={user.phone || 'Not provided'}
          />
          <InfoRow 
            icon={<Mail size={18} className="text-gray-500" />}
            label="Email Address"
            value={user.email || 'Not added'}
          />
          <InfoRow 
            icon={<MapPin size={18} className="text-gray-500" />}
            label="City"
            value={profile.city || user.city || 'Not added'}
          />
          <InfoRow 
            icon={<Calendar size={18} className="text-gray-500" />}
            label="Member Since"
            value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
          />
        </div>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="text-orange-600" size={20} />
            <h3 className="font-bold text-lg">Vehicle Details</h3>
          </div>
          <button className="text-orange-600 text-sm font-semibold hover:underline">
            Edit
          </button>
        </div>
        
        <div className="space-y-3">
          <InfoRow 
            label="Vehicle Type"
            value={vehicle.type ? vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1) : 'Not specified'}
            badge={true}
          />
          <InfoRow 
            label="Vehicle Number"
            value={vehicle.number?.toUpperCase() || 'Not provided'}
          />
          <InfoRow 
            label="Vehicle Model"
            value={vehicle.model || 'Not specified'}
          />
          <InfoRow 
            label="Vehicle Color"
            value={vehicle.color || 'Not specified'}
          />
        </div>
      </div>

      {/* PERFORMANCE STATS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-orange-600" size={20} />
          <h3 className="font-bold text-lg">Performance Overview</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="Total Rides"
            value={stats.totalTrips || 0}
            bgColor="bg-green-50"
            textColor="text-green-700"
            icon="🚗"
          />
          <StatCard 
            label="Completed"
            value={stats.completedTrips || 0}
            bgColor="bg-blue-50"
            textColor="text-blue-700"
            icon="✓"
          />
          <StatCard 
            label="Total Earnings"
            value={`₹${stats.totalEarnings || 0}`}
            bgColor="bg-purple-50"
            textColor="text-purple-700"
            icon="💰"
          />
          <StatCard 
            label="Online Hours"
            value={`${stats.onlineHours?.toFixed(0) || 0}h`}
            bgColor="bg-orange-50"
            textColor="text-orange-700"
            icon="⏱️"
          />
        </div>
      </div>

      {/* DOCUMENTS STATUS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-orange-600" size={20} />
          <h3 className="font-bold text-lg">Documents</h3>
        </div>
        
        <div className="space-y-3">
          <DocumentStatus 
            name="Driving License"
            doc={documents.license}
          />
          <DocumentStatus 
            name="Vehicle RC (Registration)"
            doc={documents.rc}
          />
          <DocumentStatus 
            name="Insurance Certificate"
            doc={documents.insurance}
          />
          <DocumentStatus 
            name="Aadhaar Card"
            doc={documents.aadhaar}
          />
        </div>
        
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full mt-4 text-orange-600 font-semibold text-sm py-3 hover:bg-orange-50 rounded-lg transition border-2 border-dashed border-orange-300 flex items-center justify-center gap-2"
        >
          <Upload size={18} />
          Upload New Document
        </button>
      </div>

      {/* BANK DETAILS (if exists) */}
      {profile.bankDetails && (
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="text-orange-600" size={20} />
              <h3 className="font-bold text-lg">Bank Details</h3>
            </div>
            <button className="text-orange-600 text-sm font-semibold hover:underline">
              Edit
            </button>
          </div>
          
          <div className="space-y-3">
            <InfoRow 
              label="Bank Name"
              value={profile.bankDetails.bankName || 'N/A'}
            />
            <InfoRow 
              label="Account Number"
              value={'*'.repeat(8) + (profile.bankDetails.accountNumber?.slice(-4) || 'N/A')}
            />
            <InfoRow 
              label="IFSC Code"
              value={profile.bankDetails.ifsc || 'N/A'}
            />
          </div>
        </div>
      )}

      {/* SETTINGS MENU */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <MenuItem 
          icon={Settings} 
          label="Settings & Preferences" 
          onClick={() => alert('Settings coming soon!')}
        />
        <MenuItem 
          icon={Bell} 
          label="Notifications" 
          onClick={() => alert('Notifications coming soon!')}
        />
        <MenuItem 
          icon={HelpCircle} 
          label="Help & Support" 
          onClick={() => alert('Help & Support coming soon!')}
        />
        <MenuItem 
          icon={FileText} 
          label="Terms & Privacy Policy" 
          onClick={() => alert('Terms & Privacy coming soon!')}
        />
      </div>

      {/* LOGOUT BUTTON */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow"
      >
        <LogOut size={18} />
        Logout
      </button>

      {/* APP VERSION */}
      <p className="text-center text-xs text-gray-400 pb-4">
        Version 1.0.0 • © 2024 GaonConnect
      </p>

      {/* DOCUMENT UPLOAD MODAL */}
      <DocumentUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

    </div>
  );
};

// INFO ROW COMPONENT
const InfoRow = ({ icon, label, value, badge }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      {icon && icon}
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    {badge ? (
      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
        {value}
      </span>
    ) : (
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    )}
  </div>
);

// STAT CARD COMPONENT
const StatCard = ({ label, value, bgColor, textColor, icon }) => (
  <div className={`${bgColor} p-4 rounded-xl`}>
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs text-gray-600">{label}</p>
      <span className="text-xl">{icon}</span>
    </div>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
  </div>
);

// DOCUMENT STATUS COMPONENT
const DocumentStatus = ({ name, doc }) => {
  const getStatus = () => {
    if (doc?.verified) {
      return {
        text: 'Verified',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-600',
        icon: <Shield size={18} className="text-green-600" />
      };
    }
    if (doc?.url) {
      return {
        text: 'Pending Verification',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeColor: 'bg-yellow-600',
        icon: <Shield size={18} className="text-yellow-600" />
      };
    }
    return {
      text: 'Not Uploaded',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-600',
      icon: <Shield size={18} className="text-gray-400" />
    };
  };

  const status = getStatus();

  return (
    <div className={`${status.bgColor} border-2 ${status.borderColor} p-3 rounded-lg flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {status.icon}
        <span className="text-sm font-semibold text-gray-800">{name}</span>
      </div>
      <span className={`${status.badgeColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
        {status.text}
      </span>
    </div>
  );
};

// MENU ITEM COMPONENT
const MenuItem = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition border-b last:border-b-0 group"
  >
    <Icon className="text-gray-600 group-hover:text-orange-600 transition" size={20} />
    <span className="flex-1 text-left font-semibold text-gray-700 group-hover:text-orange-600 transition">
      {label}
    </span>
    <ChevronRight className="text-gray-400 group-hover:text-orange-600 transition" size={20} />
  </button>
);

export default ProfileTab;
