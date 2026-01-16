// import React from 'react';
// import { DollarSign, Check, Star, TrendingUp } from 'lucide-react';
// import StatsCard from '../components/StatsCard';

// const ProviderTab = () => {
//   const stats = [
//     { label: 'Today Earnings', value: '₹2,450', icon: DollarSign },
//     { label: 'Completed Trips', value: '12', icon: Check },
//     { label: 'Rating', value: '4.8 ⭐', icon: Star },
//     { label: 'Total Earnings', value: '₹45,000', icon: TrendingUp }
//   ];

//   const weeklyData = [
//     { day: 'Mon', earnings: 1800 },
//     { day: 'Tue', earnings: 2200 },
//     { day: 'Wed', earnings: 1900 },
//     { day: 'Thu', earnings: 2450 },
//     { day: 'Fri', earnings: 2100 },
//     { day: 'Sat', earnings: 2800 },
//     { day: 'Sun', earnings: 2600 }
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {stats.map((stat, idx) => (
//           <StatsCard key={idx} {...stat} />
//         ))}
//       </div>

//       {/* Availability Toggle */}
//       <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-xl font-bold mb-1">You're Online! 🟢</h3>
//             <p className="text-green-100">Ready to accept bookings</p>
//           </div>
//           <label className="relative inline-flex items-center cursor-pointer">
//             <input type="checkbox" defaultChecked className="sr-only peer" />
//             <div className="w-14 h-7 bg-white rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-green-600 after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
//           </label>
//         </div>
//       </div>

//       {/* Booking Requests */}
//       <div>
//         <h2 className="text-2xl font-bold mb-4 text-gray-800">Booking Requests</h2>
//         <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-orange-500">
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h4 className="font-bold text-gray-800">New Booking Request</h4>
//               <p className="text-sm text-gray-600">Auto Rickshaw • 8.5 km</p>
//             </div>
//             <div className="text-right">
//               <p className="text-2xl font-bold text-orange-600">₹135</p>
//               <p className="text-xs text-gray-500">Estimated fare</p>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
//               Accept
//             </button>
//             <button className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
//               Reject
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Weekly Earnings Chart */}
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         <h3 className="text-xl font-bold mb-4 text-gray-800">Weekly Earnings</h3>
//         <div className="space-y-3">
//           {weeklyData.map((data) => {
//             const percentage = (data.earnings / 2800) * 100;
//             return (
//               <div key={data.day}>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span className="text-gray-600">{data.day}</span>
//                   <span className="font-bold text-gray-800">₹{data.earnings}</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all"
//                     style={{ width: `${percentage}%` }}
//                   ></div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProviderTab;






// import React, { useState } from 'react';
// import StatsCard from '../components/StatsCard';
// import { DollarSign, Check, Star, TrendingUp } from 'lucide-react';

// import CurrentRideCard from '../components/CurrentRideCard';
// import RideHistory from '../components/RideHistory';
// import WalletPanel from '../components/WalletPanel';
// import DriverProfile from '../components/DriverProfile';

// const ProviderTab = () => {
//   const [currentRide, setCurrentRide] = useState(null);

//   const stats = [
//     { label: 'Today Earnings', value: '₹2,450', icon: DollarSign },
//     { label: 'Completed Trips', value: '12', icon: Check },
//     { label: 'Rating', value: '4.8 ⭐', icon: Star },
//     { label: 'Total Earnings', value: '₹45,000', icon: TrendingUp }
//   ];

//   const rideHistory = [
//     { date: 'Today', route: 'Station → Market', fare: 120, status: 'Completed' },
//     { date: 'Yesterday', route: 'Bus Stand → Mall', fare: 180, status: 'Completed' }
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {stats.map((s, i) => <StatsCard key={i} {...s} />)}
//       </div>

//       {/* Current Ride */}
//       <CurrentRideCard
//         ride={currentRide}
//         onStart={() => setCurrentRide({ ...currentRide, started: true })}
//         onEnd={() => setCurrentRide(null)}
//       />

//       {/* Wallet + Profile */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <WalletPanel />
//         <DriverProfile />
//       </div>

//       {/* Ride History */}
//       <RideHistory rides={rideHistory} />
//     </div>
//   );
// };

// export default ProviderTab;



import React, { useState, useEffect } from 'react';
import { useRide } from "../context/RideContext";
import {
  Home, MapPin, Wallet, History, User
} from 'lucide-react';

import HomeTab from './HomeTab';
import CurrentRideTab from './CurrentRideTab';
import WalletTab from './WalletTab';
import HistoryTab from './HistoryTab';
import ProfileTab from './ProfileTab';

const ProviderTab = () => {
  const { currentRide } = useRide(); // 🔥 RideContext
  const [activeTab, setActiveTab] = useState('home');

  // 🔁 Auto-switch to Ride tab when ride is active
  useEffect(() => {
    if (currentRide && currentRide.status !== 'completed') {
      setActiveTab('ride');
    }
  }, [currentRide]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setActiveTab={setActiveTab} />;
      case 'ride':
        return <CurrentRideTab />;
      case 'wallet':
        return <WalletTab />;
      case 'history':
        return <HistoryTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="p-4">{renderTab()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around py-2">
        <Tab
          icon={<Home size={20} />}
          label="Home"
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <Tab
          icon={<MapPin size={20} />}
          label="Ride"
          active={activeTab === 'ride'}
          onClick={() => setActiveTab('ride')}
        />
        <Tab
          icon={<Wallet size={20} />}
          label="Wallet"
          active={activeTab === 'wallet'}
          onClick={() => setActiveTab('wallet')}
        />
        <Tab
          icon={<History size={20} />}
          label="History"
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
        <Tab
          icon={<User size={20} />}
          label="Profile"
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </div>
    </div>
  );
};

const Tab = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center text-xs ${
      active ? 'text-orange-600 font-bold' : 'text-gray-500'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default ProviderTab;
