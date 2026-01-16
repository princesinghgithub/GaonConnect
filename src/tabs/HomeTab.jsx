// import React, { useState } from 'react';

// const HomeTab = ({ setActiveTab }) => {
//   const [online, setOnline] = useState(true);
//   const [request, setRequest] = useState(true);

//   return (
//     <div className="space-y-4 pb-20">

//       {/* Online Toggle */}
//       <div className={`p-4 rounded-xl text-white ${online ? 'bg-green-600' : 'bg-gray-400'}`}>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-bold">{online ? 'You are Online 🟢' : 'You are Offline 🔴'}</h3>
//           </div>
//           <input
//             type="checkbox"
//             checked={online}
//             onChange={() => setOnline(!online)}
//             className="w-6 h-6"
//           />
//         </div>
//       </div>

//       {/* Incoming Ride */}
//       {request && (
//         <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
//           <h4 className="font-bold">New Ride Request</h4>
//           <p>Station → Market</p>
//           <p>8.5 km • ₹135</p>

//           <div className="flex gap-2 mt-3">
//             <button
//               onClick={() => {
//                 setRequest(false);
//                 setActiveTab('ride');
//               }}
//               className="flex-1 bg-green-600 text-white py-2 rounded"
//             >
//               Accept
//             </button>
//             <button
//               onClick={() => setRequest(false)}
//               className="flex-1 bg-gray-200 py-2 rounded"
//             >
//               Reject
//             </button>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default HomeTab;



// import React, { useState } from 'react';
// import { DollarSign, Star, TrendingUp, Clock, Phone, Headphones } from 'lucide-react';

// const HomeTab = ({ setActiveTab }) => {
//   const [online, setOnline] = useState(true);
//   const [request, setRequest] = useState(true);

//   return (
//     <div className="space-y-4 pb-20">

//       {/* Online Toggle */}
//       <div className={`p-4 rounded-xl text-white ${online ? 'bg-green-600' : 'bg-gray-400'}`}>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-bold">{online ? 'You are Online 🟢' : 'You are Offline 🔴'}</h3>
//             <p className="text-sm opacity-90">
//               {online ? 'Ready to accept rides' : 'Turn on to receive requests'}
//             </p>
//           </div>
//           <input
//             type="checkbox"
//             checked={online}
//             onChange={() => setOnline(!online)}
//             className="w-6 h-6"
//           />
//         </div>
//       </div>

//       {/* ✅ Today's Earnings Summary */}
//       <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <p className="text-sm opacity-90">Today's Earnings</p>
//             <h2 className="text-3xl font-bold">₹1,250</h2>
//           </div>
//           <DollarSign className="w-10 h-10 opacity-80" />
//         </div>
        
//         <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
//           <div>
//             <p className="text-xs opacity-80">Rides</p>
//             <p className="font-bold text-lg">12</p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Hours</p>
//             <p className="font-bold text-lg">5.2</p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Rating</p>
//             <p className="font-bold text-lg flex items-center gap-1">
//               4.8 <Star size={14} fill="white" />
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Weekly Stats */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-3">
//           <h4 className="font-bold text-gray-800">This Week</h4>
//           <TrendingUp className="text-green-600" size={20} />
//         </div>
        
//         <div className="grid grid-cols-2 gap-3">
//           <div className="bg-green-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Earnings</p>
//             <p className="font-bold text-lg text-green-700">₹8,450</p>
//           </div>
//           <div className="bg-blue-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Rides</p>
//             <p className="font-bold text-lg text-blue-700">67</p>
//           </div>
//         </div>
//       </div>

//       {/* Incoming Ride Request */}
//       {request && (
//         <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-orange-500 animate-pulse">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="font-bold text-lg text-gray-800">🔔 New Ride Request</h4>
//             <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
//               12 sec ago
//             </span>
//           </div>
          
//           <div className="space-y-2 mb-4">
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Pickup</p>
//                 <p className="font-semibold">Bus Stand, Village Road</p>
//               </div>
//             </div>
            
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Drop</p>
//                 <p className="font-semibold">Railway Station</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-50 p-3 rounded-lg mb-4">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-600">Distance:</span>
//               <span className="font-semibold">8.5 km</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Fare:</span>
//               <span className="font-bold text-green-600 text-lg">₹135</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Duration:</span>
//               <span className="font-semibold">~15 min</span>
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={() => {
//                 setRequest(false);
//                 setActiveTab('ride');
//               }}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✓ Accept Ride
//             </button>
//             <button
//               onClick={() => setRequest(false)}
//               className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✗ Reject
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ✅ Quick Actions */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <h4 className="font-bold text-gray-800 mb-3">Quick Actions</h4>
        
//         <div className="grid grid-cols-2 gap-3">
//           <button className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition">
//             <Phone className="text-blue-600" size={20} />
//             <span className="text-sm font-semibold text-blue-700">Emergency</span>
//           </button>
          
//           <button className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition">
//             <Headphones className="text-purple-600" size={20} />
//             <span className="text-sm font-semibold text-purple-700">Support</span>
//           </button>
//         </div>
//       </div>

//       {/* ✅ Tips Section */}
//       {!request && online && (
//         <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
//           <p className="text-sm text-blue-800">
//             <b>💡 Tip:</b> Stay in high-demand areas to get more ride requests!
//           </p>
//         </div>
//       )}

//     </div>
//   );
// };

// export default HomeTab;



// import React, { useState, useEffect } from 'react';
// import { DollarSign, Star, TrendingUp, Clock, Phone, Headphones } from 'lucide-react';
// import { useDriver } from '../context/Drivercontext';
// import { providerAPI } from '../services/api';

// const HomeTab = ({ setActiveTab }) => {
//   const { driver, isOnline, toggleDuty, stats, wallet, loadStats, loadWallet } = useDriver();
//   const [request, setRequest] = useState(null);
//   const [todayEarnings, setTodayEarnings] = useState(null);
//   const [weeklyEarnings, setWeeklyEarnings] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (driver) {
//       fetchEarnings();
//       loadStats();
//       loadWallet();
//     }
//   }, [driver]);

//   const fetchEarnings = async () => {
//     try {
//       const [todayRes, weekRes] = await Promise.all([
//         providerAPI.getTodayEarnings(),
//         providerAPI.getWeeklyEarnings()
//       ]);
      
//       setTodayEarnings(todayRes.data.data);
//       setWeeklyEarnings(weekRes.data.data);
//     } catch (error) {
//       console.error('Fetch earnings error:', error);
//     }
//   };

//   const handleToggleDuty = async () => {
//     try {
//       setLoading(true);
//       await toggleDuty();
//     } catch (error) {
//       alert('Failed to toggle duty status');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptRide = async () => {
//     try {
//       // Accept ride logic will come from WebSocket/context
//       setRequest(null);
//       setActiveTab('ride');
//     } catch (error) {
//       alert('Failed to accept ride');
//     }
//   };

//   return (
//     <div className="space-y-4 pb-20">

//       {/* Online Toggle */}
//       <div className={`p-4 rounded-xl text-white transition-colors ${
//         isOnline ? 'bg-green-600' : 'bg-gray-400'
//       }`}>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-bold">
//               {isOnline ? 'You are Online 🟢' : 'You are Offline 🔴'}
//             </h3>
//             <p className="text-sm opacity-90">
//               {isOnline ? 'Ready to accept rides' : 'Turn on to receive requests'}
//             </p>
//           </div>
//           <button
//             onClick={handleToggleDuty}
//             disabled={loading}
//             className={`w-14 h-8 rounded-full relative transition-colors ${
//               isOnline ? 'bg-white' : 'bg-gray-300'
//             }`}
//           >
//             <span className={`absolute w-6 h-6 bg-gray-800 rounded-full top-1 transition-all ${
//               isOnline ? 'right-1' : 'left-1'
//             }`} />
//           </button>
//         </div>
//       </div>

//       {/* Today's Earnings Summary */}
//       <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <p className="text-sm opacity-90">Today's Earnings</p>
//             <h2 className="text-3xl font-bold">
//               ₹{todayEarnings?.totalEarnings || 0}
//             </h2>
//           </div>
//           <DollarSign className="w-10 h-10 opacity-80" />
//         </div>
        
//         <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
//           <div>
//             <p className="text-xs opacity-80">Rides</p>
//             <p className="font-bold text-lg">{todayEarnings?.totalRides || 0}</p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Hours</p>
//             <p className="font-bold text-lg">
//               {stats?.onlineHours?.toFixed(1) || 0}
//             </p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Rating</p>
//             <p className="font-bold text-lg flex items-center gap-1">
//               {driver?.rating?.average?.toFixed(1) || 0} 
//               <Star size={14} fill="white" />
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Weekly Stats */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-3">
//           <h4 className="font-bold text-gray-800">This Week</h4>
//           <TrendingUp className="text-green-600" size={20} />
//         </div>
        
//         <div className="grid grid-cols-2 gap-3">
//           <div className="bg-green-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Earnings</p>
//             <p className="font-bold text-lg text-green-700">
//               ₹{weeklyEarnings?.totalEarnings || 0}
//             </p>
//           </div>
//           <div className="bg-blue-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Rides</p>
//             <p className="font-bold text-lg text-blue-700">
//               {weeklyEarnings?.totalRides || 0}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Incoming Ride Request - Will be populated via WebSocket */}
//       {request && (
//         <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-orange-500 animate-pulse">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="font-bold text-lg text-gray-800">🔔 New Ride Request</h4>
//             <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
//               {request.timeAgo}
//             </span>
//           </div>
          
//           <div className="space-y-2 mb-4">
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Pickup</p>
//                 <p className="font-semibold">{request.pickup}</p>
//               </div>
//             </div>
            
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Drop</p>
//                 <p className="font-semibold">{request.drop}</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-50 p-3 rounded-lg mb-4">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-600">Distance:</span>
//               <span className="font-semibold">{request.distance} km</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Fare:</span>
//               <span className="font-bold text-green-600 text-lg">₹{request.fare}</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Duration:</span>
//               <span className="font-semibold">~{request.duration} min</span>
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={handleAcceptRide}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✓ Accept Ride
//             </button>
//             <button
//               onClick={() => setRequest(null)}
//               className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✗ Reject
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Quick Actions */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <h4 className="font-bold text-gray-800 mb-3">Quick Actions</h4>
        
//         <div className="grid grid-cols-2 gap-3">
//           <button className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition">
//             <Phone className="text-blue-600" size={20} />
//             <span className="text-sm font-semibold text-blue-700">Emergency</span>
//           </button>
          
//           <button className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition">
//             <Headphones className="text-purple-600" size={20} />
//             <span className="text-sm font-semibold text-purple-700">Support</span>
//           </button>
//         </div>
//       </div>

//       {/* Tips Section */}
//       {!request && isOnline && (
//         <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
//           <p className="text-sm text-blue-800">
//             <b>💡 Tip:</b> Stay in high-demand areas to get more ride requests!
//           </p>
//         </div>
//       )}

//     </div>
//   );
// };

// export default HomeTab;





// import React, { useState, useEffect } from 'react';
// import { DollarSign, Star, TrendingUp, Phone, Headphones } from 'lucide-react';
// import { useDriver } from '../context/Drivercontext';
// import { providerAPI } from '../services/api';

// const HomeTab = ({ setActiveTab }) => {
//   const { 
//     driver, 
//     isOnline, 
//     toggleDuty, 
//     stats, 
//     wallet, 
//     loading: contextLoading 
//   } = useDriver();
  
//   const [request, setRequest] = useState(null);
//   const [todayEarnings, setTodayEarnings] = useState(null);
//   const [weeklyEarnings, setWeeklyEarnings] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [dataLoaded, setDataLoaded] = useState(false); // ← NEW: Track if data loaded

//   // ✅ FIX: Load data only once when component mounts
//   useEffect(() => {
//     if (driver && !dataLoaded) {
//       fetchEarnings();
//       setDataLoaded(true);
//     }
//   }, [driver, dataLoaded]);

//   const fetchEarnings = async () => {
//     try {
//       const [todayRes, weekRes] = await Promise.all([
//         providerAPI.getTodayEarnings(),
//         providerAPI.getWeeklyEarnings()
//       ]);
      
//       setTodayEarnings(todayRes.data.data);
//       setWeeklyEarnings(weekRes.data.data);
//     } catch (error) {
//       console.error('Fetch earnings error:', error);
//     }
//   };

//   const handleToggleDuty = async () => {
//     try {
//       setLoading(true);
//       await toggleDuty();
//     } catch (error) {
//       alert('Failed to toggle duty status');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptRide = async () => {
//     try {
//       setRequest(null);
//       setActiveTab('ride');
//     } catch (error) {
//       alert('Failed to accept ride');
//     }
//   };

//   if (contextLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!driver) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <p className="text-gray-600">Please login as a driver</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 pb-20">

//       {/* Online Toggle */}
//       <div className={`p-4 rounded-xl text-white transition-colors ${
//         isOnline ? 'bg-green-600' : 'bg-gray-400'
//       }`}>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-bold">
//               {isOnline ? 'You are Online 🟢' : 'You are Offline 🔴'}
//             </h3>
//             <p className="text-sm opacity-90">
//               {isOnline ? 'Ready to accept rides' : 'Turn on to receive requests'}
//             </p>
//           </div>
//           <button
//             onClick={handleToggleDuty}
//             disabled={loading}
//             className={`w-14 h-8 rounded-full relative transition-colors ${
//               isOnline ? 'bg-white' : 'bg-gray-300'
//             } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <span className={`absolute w-6 h-6 bg-gray-800 rounded-full top-1 transition-all ${
//               isOnline ? 'right-1' : 'left-1'
//             }`} />
//           </button>
//         </div>
//       </div>

//       {/* Today's Earnings Summary */}
//       <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <p className="text-sm opacity-90">Today's Earnings</p>
//             <h2 className="text-3xl font-bold">
//               ₹{todayEarnings?.totalEarnings || 0}
//             </h2>
//           </div>
//           <DollarSign className="w-10 h-10 opacity-80" />
//         </div>
        
//         <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
//           <div>
//             <p className="text-xs opacity-80">Rides</p>
//             <p className="font-bold text-lg">{todayEarnings?.totalRides || 0}</p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Hours</p>
//             <p className="font-bold text-lg">
//               {stats?.onlineHours?.toFixed(1) || 0}
//             </p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Rating</p>
//             <p className="font-bold text-lg flex items-center gap-1">
//               {driver?.rating?.average?.toFixed(1) || 0} 
//               <Star size={14} fill="white" />
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Weekly Stats */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-3">
//           <h4 className="font-bold text-gray-800">This Week</h4>
//           <TrendingUp className="text-green-600" size={20} />
//         </div>
        
//         <div className="grid grid-cols-2 gap-3">
//           <div className="bg-green-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Earnings</p>
//             <p className="font-bold text-lg text-green-700">
//               ₹{weeklyEarnings?.totalEarnings || 0}
//             </p>
//           </div>
//           <div className="bg-blue-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Rides</p>
//             <p className="font-bold text-lg text-blue-700">
//               {weeklyEarnings?.totalRides || 0}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Incoming Ride Request */}
//       {request && (
//         <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-orange-500 animate-pulse">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="font-bold text-lg text-gray-800">🔔 New Ride Request</h4>
//             <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
//               {request.timeAgo}
//             </span>
//           </div>
          
//           <div className="space-y-2 mb-4">
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Pickup</p>
//                 <p className="font-semibold">{request.pickup}</p>
//               </div>
//             </div>
            
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Drop</p>
//                 <p className="font-semibold">{request.drop}</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-50 p-3 rounded-lg mb-4">
//             <div className="flex justify-between text-sm">
//               <span className="text-gray-600">Distance:</span>
//               <span className="font-semibold">{request.distance} km</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Fare:</span>
//               <span className="font-bold text-green-600 text-lg">₹{request.fare}</span>
//             </div>
//             <div className="flex justify-between text-sm mt-1">
//               <span className="text-gray-600">Duration:</span>
//               <span className="font-semibold">~{request.duration} min</span>
//             </div>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={handleAcceptRide}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✓ Accept Ride
//             </button>
//             <button
//               onClick={() => setRequest(null)}
//               className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold shadow-md transition"
//             >
//               ✗ Reject
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Quick Actions */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <h4 className="font-bold text-gray-800 mb-3">Quick Actions</h4>
        
//         <div className="grid grid-cols-2 gap-3">
//           <button className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition">
//             <Phone className="text-blue-600" size={20} />
//             <span className="text-sm font-semibold text-blue-700">Emergency</span>
//           </button>
          
//           <button className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition">
//             <Headphones className="text-purple-600" size={20} />
//             <span className="text-sm font-semibold text-purple-700">Support</span>
//           </button>
//         </div>
//       </div>

//       {/* Tips Section */}
//       {!request && isOnline && (
//         <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
//           <p className="text-sm text-blue-800">
//             <b>💡 Tip:</b> Stay in high-demand areas to get more ride requests!
//           </p>
//         </div>
//       )}

//     </div>
//   );
// };

// export default HomeTab;

// import React, { useState, useEffect } from 'react';
// import { DollarSign, Star, TrendingUp, Phone, Headphones } from 'lucide-react';
// import { useDriver } from '../context/Drivercontext';
// import { providerAPI, rideAPI } from '../services/api';

// const HomeTab = ({ setActiveTab }) => {
//   const { 
//     driver, 
//     isOnline, 
//     toggleDuty, 
//     stats,  
//     loading: contextLoading 
//   } = useDriver();
  
//   const [request, setRequest] = useState(null);
//   const [todayEarnings, setTodayEarnings] = useState(null);
//   const [weeklyEarnings, setWeeklyEarnings] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [dataLoaded, setDataLoaded] = useState(false);

//   // Load earnings once when driver is available
//   useEffect(() => {
//     if (driver && !dataLoaded) {
//       fetchEarnings();
//       setDataLoaded(true);
//     }
//   }, [driver, dataLoaded]);

//   const fetchEarnings = async () => {
//     try {
//       const [todayRes, weekRes] = await Promise.all([
//         providerAPI.getTodayEarnings(),
//         providerAPI.getWeeklyEarnings()
//       ]);
      
//       setTodayEarnings(todayRes.data.data);
//       setWeeklyEarnings(weekRes.data.data);
//     } catch (error) {
//       console.error('Fetch earnings error:', error);
//     }
//   };

//   const handleToggleDuty = async () => {
//     try {
//       setLoading(true);
//       await toggleDuty();
//     } catch (error) {
//       alert('Failed to toggle duty status');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---- Accept Ride ----
//   const handleAcceptRide = async () => {
//     try {
//       if (!request?.rideId) return alert("Ride ID missing!");

//       await rideAPI.acceptRide(request.rideId);

//       setRequest(null);
//       setActiveTab('ride'); // Go to ride screen
//     } catch (error) {
//       console.error(error);
//       alert('Failed to accept ride');
//     }
//   };

//   // ---- Reject Ride ----
//   const handleRejectRide = async () => {
//     try {
//       if (!request?.rideId) return alert("Ride ID missing!");

//       await rideAPI.rejectRide(request.rideId, "Not Available");

//       setRequest(null);
//     } catch (error) {
//       console.error(error);
//       alert('Failed to reject ride');
//     }
//   };

//   // Loading UI
//   if (contextLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // If not logged in
//   if (!driver) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <p className="text-gray-600">Please login as a driver</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 pb-20">

//       {/* Online Toggle */}
//       <div className={`p-4 rounded-xl text-white transition-colors ${
//         isOnline ? 'bg-green-600' : 'bg-gray-400'
//       }`}>
//         <div className="flex justify-between items-center">
//           <div>
//             <h3 className="font-bold">
//               {isOnline ? 'You are Online 🟢' : 'You are Offline 🔴'}
//             </h3>
//             <p className="text-sm opacity-90">
//               {isOnline ? 'Ready to accept rides' : 'Turn on to receive requests'}
//             </p>
//           </div>

//           <button
//             onClick={handleToggleDuty}
//             disabled={loading}
//             className={`w-14 h-8 rounded-full relative transition-colors ${
//               isOnline ? 'bg-white' : 'bg-gray-300'
//             } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <span className={`absolute w-6 h-6 bg-gray-800 rounded-full top-1 transition-all ${
//               isOnline ? 'right-1' : 'left-1'
//             }`} />
//           </button>
//         </div>
//       </div>

//       {/* Today's Earnings */}
//       <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
//         <div className="flex justify-between items-start mb-4">
//           <div>
//             <p className="text-sm opacity-90">Today's Earnings</p>
//             <h2 className="text-3xl font-bold">
//               ₹{todayEarnings?.totalEarnings || 0}
//             </h2>
//           </div>
//           <DollarSign className="w-10 h-10 opacity-80" />
//         </div>
        
//         <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
//           <div>
//             <p className="text-xs opacity-80">Rides</p>
//             <p className="font-bold text-lg">{todayEarnings?.totalRides || 0}</p>
//           </div>

//           <div>
//             <p className="text-xs opacity-80">Hours</p>
//             <p className="font-bold text-lg">
//               {stats?.onlineHours?.toFixed(1) || 0}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs opacity-80">Rating</p>
//             <p className="font-bold text-lg flex items-center gap-1">
//               {driver?.rating?.average?.toFixed(1) || 0}
//               <Star size={14} fill="white" />
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Weekly Earnings */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-3">
//           <h4 className="font-bold text-gray-800">This Week</h4>
//           <TrendingUp className="text-green-600" size={20} />
//         </div>
        
//         <div className="grid grid-cols-2 gap-3">
//           <div className="bg-green-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Earnings</p>
//             <p className="font-bold text-lg text-green-700">
//               ₹{weeklyEarnings?.totalEarnings || 0}
//             </p>
//           </div>

//           <div className="bg-blue-50 p-3 rounded-lg">
//             <p className="text-xs text-gray-600">Total Rides</p>
//             <p className="font-bold text-lg text-blue-700">
//               {weeklyEarnings?.totalRides || 0}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Incoming Ride Request */}
//       {request && (
//         <div className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-orange-500">
//           <h4 className="font-bold text-lg text-gray-800 mb-2">
//             🔔 New Ride Request
//           </h4>

//           <div className="bg-gray-50 p-3 rounded-lg mb-4">
//             <p>Pickup: <b>{request.pickup}</b></p>
//             <p>Drop: <b>{request.drop}</b></p>
//             <p>Fare: <b>₹{request.fare}</b></p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={handleAcceptRide}
//               className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
//             >
//               ✓ Accept Ride
//             </button>

//             <button
//               onClick={handleRejectRide}
//               className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold"
//             >
//               ✗ Reject
//             </button>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default HomeTab;



import React, { useState, useEffect } from 'react';
import { DollarSign, Star, TrendingUp } from 'lucide-react';
import { useDriver } from '../context/Drivercontext';
import { providerAPI, rideAPI } from '../services/api';

const HomeTab = ({ setActiveTab }) => {
  const { 
    driver, 
    isOnline, 
    toggleDuty, 
    stats, 
    currentRide,
    loading: contextLoading 
  } = useDriver();
  
  const [request, setRequest] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(null);
  const [weeklyEarnings, setWeeklyEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // ✅ Timer for ride request

  // Load earnings once when driver is available
  useEffect(() => {
    if (driver && !dataLoaded) {
      fetchEarnings();
      setDataLoaded(true);
    }
  }, [driver, dataLoaded]);

  // ✅ NEW: Poll for ride requests when online
  useEffect(() => {
    if (isOnline && !currentRide && !request) {
      console.log('🔍 Starting to poll for ride requests...');
      
      const interval = setInterval(() => {
        checkForRideRequests();
      }, 3000); // Check every 3 seconds

      return () => {
        console.log('⏹️ Stopped polling for ride requests');
        clearInterval(interval);
      };
    }
  }, [isOnline, currentRide, request]);

  // ✅ NEW: Auto-reject timer
  useEffect(() => {
    if (request) {
      setTimeLeft(30); // Reset to 30 seconds
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto reject when timer hits 0
            handleRejectRide();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [request]);

  // ✅ NEW: Check for pending ride requests
  const checkForRideRequests = async () => {
    try {
      // First check if driver already has a current ride
      const currentRideResponse = await rideAPI.getCurrentRideDriver();
      
      if (currentRideResponse.data.data) {
        console.log('✅ Driver already has an active ride');
        // Navigate to ride tab if there's an active ride
        setActiveTab('ride');
        return;
      }

      // If no current ride, check for pending requests
      // This would be a new API endpoint you need to add
      // For now, we'll use a workaround
      
    } catch (error) {
      if (error.response?.status === 404) {
        // No current ride, which is fine
        console.log('No active ride found');
      } else {
        console.error('Check ride requests error:', error);
      }
    }
  };

  const fetchEarnings = async () => {
    try {
      const [todayRes, weekRes] = await Promise.all([
        providerAPI.getTodayEarnings(),
        providerAPI.getWeeklyEarnings()
      ]);
      
      setTodayEarnings(todayRes.data.data);
      setWeeklyEarnings(weekRes.data.data);
    } catch (error) {
      console.error('Fetch earnings error:', error);
    }
  };

  const handleToggleDuty = async () => {
    try {
      setLoading(true);
      await toggleDuty();
    } catch (error) {
      alert('Failed to toggle duty status');
    } finally {
      setLoading(false);
    }
  };

  // ---- Accept Ride ----
  const handleAcceptRide = async () => {
    try {
      if (!request?.rideId) {
        alert("Ride ID missing!");
        return;
      }

      console.log('✅ Accepting ride:', request.rideId);
      await rideAPI.acceptRide(request.rideId);

      setRequest(null);
      setActiveTab('ride'); // Go to ride screen
      
      // Show success notification
      alert('Ride accepted successfully!');
    } catch (error) {
      console.error('Accept ride error:', error);
      alert(error.response?.data?.message || 'Failed to accept ride');
    }
  };

  // ---- Reject Ride ----
  const handleRejectRide = async () => {
    try {
      if (!request?.rideId) {
        console.log('No ride to reject');
        setRequest(null);
        return;
      }

      console.log('❌ Rejecting ride:', request.rideId);
      await rideAPI.rejectRide(request.rideId, "Not Available");

      setRequest(null);
      setTimeLeft(30);
    } catch (error) {
      console.error('Reject ride error:', error);
      setRequest(null); // Clear anyway
    }
  };

  // Loading UI
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in
  if (!driver) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Please login as a driver</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">

      {/* Online Toggle */}
      <div className={`p-4 rounded-xl text-white transition-colors ${
        isOnline ? 'bg-green-600' : 'bg-gray-400'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">
              {isOnline ? 'You are Online 🟢' : 'You are Offline 🔴'}
            </h3>
            <p className="text-sm opacity-90">
              {isOnline ? 'Ready to accept rides' : 'Turn on to receive requests'}
            </p>
          </div>

          <button
            onClick={handleToggleDuty}
            disabled={loading}
            className={`w-14 h-8 rounded-full relative transition-colors ${
              isOnline ? 'bg-white' : 'bg-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`absolute w-6 h-6 bg-gray-800 rounded-full top-1 transition-all ${
              isOnline ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Incoming Ride Request - MOVED TO TOP for visibility */}
      {request && (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border-2 border-orange-500 animate-pulse-slow">
          {/* Timer Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Respond in <span className="font-bold text-red-600">{timeLeft}s</span>
            </p>
          </div>

          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🚗</span>
            </div>
            <h4 className="font-bold text-2xl text-gray-800 mb-1">
              New Ride Request!
            </h4>
            <p className="text-gray-600 text-sm">Customer is waiting</p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg mb-4 space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">📍</span>
              <div className="flex-1">
                <p className="text-xs text-gray-600">Pickup</p>
                <p className="font-semibold text-gray-900">{request.pickup || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <span className="text-red-600 font-bold">📍</span>
              <div className="flex-1">
                <p className="text-xs text-gray-600">Drop</p>
                <p className="font-semibold text-gray-900">{request.drop || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-orange-200">
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="font-bold text-gray-900">
                  {request.distance ? `${(request.distance / 1000).toFixed(1)} km` : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Fare</p>
                <p className="font-bold text-2xl text-green-600">₹{request.fare || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRejectRide}
              className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition"
            >
              ✗ Reject
            </button>

            <button
              onClick={handleAcceptRide}
              className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition"
            >
              ✓ Accept
            </button>
          </div>
        </div>
      )}

      {/* Today's Earnings */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm opacity-90">Today's Earnings</p>
            <h2 className="text-3xl font-bold">
              ₹{todayEarnings?.totalEarnings || 0}
            </h2>
          </div>
          <DollarSign className="w-10 h-10 opacity-80" />
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs opacity-80">Rides</p>
            <p className="font-bold text-lg">{todayEarnings?.totalRides || 0}</p>
          </div>

          <div>
            <p className="text-xs opacity-80">Hours</p>
            <p className="font-bold text-lg">
              {stats?.onlineHours?.toFixed(1) || 0}
            </p>
          </div>

          <div>
            <p className="text-xs opacity-80">Rating</p>
            <p className="font-bold text-lg flex items-center gap-1">
              {driver?.rating?.average?.toFixed(1) || 0}
              <Star size={14} fill="white" />
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Earnings */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-800">This Week</h4>
          <TrendingUp className="text-green-600" size={20} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total Earnings</p>
            <p className="font-bold text-lg text-green-700">
              ₹{weeklyEarnings?.totalEarnings || 0}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total Rides</p>
            <p className="font-bold text-lg text-blue-700">
              {weeklyEarnings?.totalRides || 0}
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Polling indicator (only when online and no request) */}
      {isOnline && !request && !currentRide && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-800">
            🔍 Searching for ride requests...
          </p>
        </div>
      )}

    </div>
  );
};

export default HomeTab;