// const HistoryTab = () => (
//   <div className="pb-20 space-y-3">
//     <h3 className="font-bold">Ride History</h3>

//     <div className="bg-white p-3 rounded shadow">
//       Station → Market • ₹120
//       <span className="text-green-600 float-right">Completed</span>
//     </div>

//     <div className="bg-white p-3 rounded shadow">
//       Bus Stand → Mall • ₹180
//       <span className="text-green-600 float-right">Completed</span>
//     </div>
//   </div>
// );

// export default HistoryTab;



// import React from 'react';
// import { Calendar, MapPin, Star, Filter } from 'lucide-react';

// const HistoryTab = () => {
//   const rideHistory = [
//     { 
//       id: 1, 
//       from: 'Railway Station', 
//       to: 'City Market', 
//       fare: 120, 
//       date: '29 Dec 2024',
//       time: '10:30 AM',
//       distance: '8.5 km',
//       rating: 5,
//       status: 'completed'
//     },
//     { 
//       id: 2, 
//       from: 'Bus Stand', 
//       to: 'Shopping Mall', 
//       fare: 180, 
//       date: '29 Dec 2024',
//       time: '09:15 AM',
//       distance: '12 km',
//       rating: 4,
//       status: 'completed'
//     },
//     { 
//       id: 3, 
//       from: 'College Gate', 
//       to: 'Residential Area', 
//       fare: 95, 
//       date: '28 Dec 2024',
//       time: '04:20 PM',
//       distance: '5.2 km',
//       rating: 5,
//       status: 'completed'
//     },
//     { 
//       id: 4, 
//       from: 'Airport', 
//       to: 'Hotel Downtown', 
//       fare: 250, 
//       date: '28 Dec 2024',
//       time: '11:00 AM',
//       distance: '18 km',
//       rating: 5,
//       status: 'completed'
//     },
//   ];

//   return (
//     <div className="pb-20 space-y-4">
      
//       {/* ✅ Header with Filter */}
//       <div className="flex items-center justify-between">
//         <h3 className="text-2xl font-bold text-gray-800">Ride History</h3>
//         <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow hover:bg-gray-50 transition">
//           <Filter size={18} className="text-gray-600" />
//           <span className="text-sm font-semibold">Filter</span>
//         </button>
//       </div>

//       {/* ✅ Summary Cards */}
//       <div className="grid grid-cols-3 gap-3">
//         <div className="bg-white p-3 rounded-xl shadow text-center">
//           <p className="text-xs text-gray-600">Total Rides</p>
//           <p className="text-xl font-bold text-gray-800">156</p>
//         </div>
//         <div className="bg-white p-3 rounded-xl shadow text-center">
//           <p className="text-xs text-gray-600">Total Earned</p>
//           <p className="text-xl font-bold text-green-600">₹23,450</p>
//         </div>
//         <div className="bg-white p-3 rounded-xl shadow text-center">
//           <p className="text-xs text-gray-600">Avg Rating</p>
//           <p className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
//             4.8 <Star size={14} fill="currentColor" />
//           </p>
//         </div>
//       </div>

//       {/* ✅ Ride Cards */}
//       {rideHistory.map((ride) => (
//         <div key={ride.id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          
//           {/* Date & Status */}
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-2 text-gray-600 text-sm">
//               <Calendar size={14} />
//               <span>{ride.date} • {ride.time}</span>
//             </div>
//             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
//               Completed
//             </span>
//           </div>

//           {/* Route */}
//           <div className="space-y-2 mb-3">
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Pickup</p>
//                 <p className="font-semibold">{ride.from}</p>
//               </div>
//             </div>
            
//             <div className="border-l-2 border-dashed border-gray-300 h-4 ml-1"></div>
            
//             <div className="flex items-start gap-2">
//               <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
//               <div className="flex-1">
//                 <p className="text-xs text-gray-500">Drop</p>
//                 <p className="font-semibold">{ride.to}</p>
//               </div>
//             </div>
//           </div>

//           {/* Details */}
//           <div className="flex items-center justify-between pt-3 border-t border-gray-100">
//             <div className="flex items-center gap-4">
//               <div>
//                 <p className="text-xs text-gray-500">Distance</p>
//                 <p className="font-semibold">{ride.distance}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500">Fare</p>
//                 <p className="font-bold text-green-600 text-lg">₹{ride.fare}</p>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-1">
//               {[...Array(ride.rating)].map((_, i) => (
//                 <Star key={i} size={16} fill="#FFC107" className="text-yellow-500" />
//               ))}
//             </div>
//           </div>
//         </div>
//       ))}

//     </div>
//   );
// };

// export default HistoryTab;




// import React, { useState, useEffect } from 'react';
// import { 
//   MapPin, Calendar, Clock, DollarSign, Star, 
//   Filter, Search, ChevronDown, User
// } from 'lucide-react';
// import axios from 'axios';

// const API_URL =  'http://localhost:5000/api';

// const HistoryTab = () => {
//   const [rides, setRides] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all'); // all, completed, cancelled
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   useEffect(() => {
//     fetchRideHistory();
//   }, [filter, page]);

//   const fetchRideHistory = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       const response = await axios.get(`${API_URL}/ride/history/driver`, {
//         headers: { Authorization: `Bearer ${token}` },
//         params: {
//           status: filter === 'all' ? undefined : filter,
//           page,
//           limit: 10
//         }
//       });
      
//       setRides(response.data.data || []);
//       setTotalPages(response.data.pagination?.totalPages || 1);
//     } catch (error) {
//       console.error('Ride history fetch error:', error);
//       // Mock data for demo
//       setRides([
//         {
//           _id: '1',
//           rideId: 'TRK12345',
//           customer: { name: 'Rahul Sharma', phone: '9876543210' },
//           pickup: { address: 'Panaji Bus Stand' },
//           drop: { address: 'Margao Railway Station' },
//           distance: 32,
//           fare: 450,
//           commission: 68,
//           status: 'completed',
//           rating: 5,
//           createdAt: new Date(),
//           completedAt: new Date()
//         },
//         {
//           _id: '2',
//           rideId: 'TRK12346',
//           customer: { name: 'Priya Patel', phone: '9876543211' },
//           pickup: { address: 'Mapusa Market' },
//           drop: { address: 'Calangute Beach' },
//           distance: 15,
//           fare: 200,
//           commission: 30,
//           status: 'cancelled',
//           cancelledBy: 'customer',
//           cancelReason: 'Changed plans',
//           createdAt: new Date(Date.now() - 86400000)
//         }
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredRides = rides.filter(ride => {
//     if (!searchTerm) return true;
//     const search = searchTerm.toLowerCase();
//     return (
//       ride.rideId?.toLowerCase().includes(search) ||
//       ride.customer?.name?.toLowerCase().includes(search) ||
//       ride.pickup?.address?.toLowerCase().includes(search) ||
//       ride.drop?.address?.toLowerCase().includes(search)
//     );
//   });

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'completed':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const totalEarnings = rides
//     .filter(r => r.status === 'completed')
//     .reduce((sum, r) => sum + (r.fare - r.commission), 0);

//   if (loading && rides.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="pb-20 space-y-4">
      
//       {/* Stats Summary */}
//       <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
//         <h2 className="text-sm opacity-90 mb-2">Total Earnings (All Time)</h2>
//         <h1 className="text-4xl font-bold mb-4">₹{totalEarnings.toFixed(2)}</h1>
        
//         <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
//           <div>
//             <p className="text-xs opacity-80">Total Rides</p>
//             <p className="text-xl font-bold">{rides.length}</p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Completed</p>
//             <p className="text-xl font-bold">
//               {rides.filter(r => r.status === 'completed').length}
//             </p>
//           </div>
//           <div>
//             <p className="text-xs opacity-80">Cancelled</p>
//             <p className="text-xl font-bold">
//               {rides.filter(r => r.status === 'cancelled').length}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Search & Filter */}
//       <div className="space-y-3">
//         <div className="relative">
//           <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="Search by Ride ID, customer, location..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
//           />
//         </div>

//         <div className="flex gap-2">
//           <button
//             onClick={() => setFilter('all')}
//             className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
//               filter === 'all'
//                 ? 'bg-orange-600 text-white'
//                 : 'bg-white text-gray-600 border-2 border-gray-200'
//             }`}
//           >
//             All Rides
//           </button>
//           <button
//             onClick={() => setFilter('completed')}
//             className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
//               filter === 'completed'
//                 ? 'bg-green-600 text-white'
//                 : 'bg-white text-gray-600 border-2 border-gray-200'
//             }`}
//           >
//             Completed
//           </button>
//           <button
//             onClick={() => setFilter('cancelled')}
//             className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
//               filter === 'cancelled'
//                 ? 'bg-red-600 text-white'
//                 : 'bg-white text-gray-600 border-2 border-gray-200'
//             }`}
//           >
//             Cancelled
//           </button>
//         </div>
//       </div>

//       {/* Rides List */}
//       <div className="space-y-3">
//         {filteredRides.length > 0 ? (
//           filteredRides.map((ride) => (
//             <RideCard key={ride._id} ride={ride} />
//           ))
//         ) : (
//           <div className="bg-white p-8 rounded-xl shadow text-center">
//             <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
//             <p className="text-gray-500">No rides found</p>
//           </div>
//         )}
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-2">
//           <button
//             onClick={() => setPage(p => Math.max(1, p - 1))}
//             disabled={page === 1}
//             className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200"
//           >
//             Previous
//           </button>
//           <span className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold">
//             {page} / {totalPages}
//           </span>
//           <button
//             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
//             disabled={page === totalPages}
//             className="px-4 py-2 bg-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200"
//           >
//             Next
//           </button>
//         </div>
//       )}

//     </div>
//   );
// };

// // Ride Card Component
// const RideCard = ({ ride }) => {
//   const [expanded, setExpanded] = useState(false);
  
//   const earnings = ride.fare - (ride.commission || 0);
//   const duration = ride.completedAt 
//     ? Math.round((new Date(ride.completedAt) - new Date(ride.createdAt)) / 60000)
//     : 0;

//   return (
//     <div className="bg-white rounded-xl shadow overflow-hidden">
//       <div 
//         onClick={() => setExpanded(!expanded)}
//         className="p-4 cursor-pointer hover:bg-gray-50 transition"
//       >
//         <div className="flex items-start justify-between mb-3">
//           <div>
//             <h3 className="font-bold text-lg text-gray-800">
//               #{ride.rideId || ride._id?.slice(-6).toUpperCase()}
//             </h3>
//             <p className="text-xs text-gray-500">
//               {new Date(ride.createdAt).toLocaleString('en-IN')}
//             </p>
//           </div>
          
//           <div className="flex flex-col items-end gap-2">
//             <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//               ride.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//             }`}>
//               {ride.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
//             </span>
//             {ride.status === 'completed' && (
//               <div className="flex items-center gap-1">
//                 <Star size={14} fill="#FFA500" className="text-orange-500" />
//                 <span className="text-sm font-semibold">{ride.rating || 'N/A'}</span>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="space-y-2 mb-3">
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
//             <div className="flex-1">
//               <p className="text-xs text-gray-500">Pickup</p>
//               <p className="font-semibold text-sm">{ride.pickup?.address}</p>
//             </div>
//           </div>
          
//           <div className="flex items-start gap-2">
//             <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
//             <div className="flex-1">
//               <p className="text-xs text-gray-500">Drop</p>
//               <p className="font-semibold text-sm">{ride.drop?.address}</p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center justify-between pt-3 border-t">
//           <div className="flex items-center gap-4 text-sm text-gray-600">
//             <span>{ride.distance} km</span>
//             {duration > 0 && <span>{duration} min</span>}
//           </div>
          
//           <div className="text-right">
//             {ride.status === 'completed' ? (
//               <>
//                 <p className="text-xs text-gray-500">You earned</p>
//                 <p className="text-xl font-bold text-green-600">₹{earnings}</p>
//               </>
//             ) : (
//               <p className="text-sm text-red-600 font-semibold">
//                 Cancelled by {ride.cancelledBy}
//               </p>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center justify-center mt-2 text-gray-400">
//           <ChevronDown 
//             size={20} 
//             className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
//           />
//         </div>
//       </div>

//       {/* Expanded Details */}
//       {expanded && (
//         <div className="px-4 pb-4 border-t bg-gray-50">
//           <div className="space-y-3 pt-3">
//             <div className="flex items-center gap-2">
//               <User size={16} className="text-gray-400" />
//               <span className="text-sm">
//                 <strong>Customer:</strong> {ride.customer?.name}
//               </span>
//             </div>
            
//             {ride.status === 'completed' && (
//               <>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Fare:</span>
//                   <span className="font-semibold">₹{ride.fare}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Commission (15%):</span>
//                   <span className="font-semibold text-red-600">-₹{ride.commission}</span>
//                 </div>
//                 <div className="flex justify-between text-sm pt-2 border-t">
//                   <span className="text-gray-600 font-bold">Your Earnings:</span>
//                   <span className="font-bold text-green-600">₹{earnings}</span>
//                 </div>
//               </>
//             )}

//             {ride.status === 'cancelled' && ride.cancelReason && (
//               <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
//                 <p className="text-xs font-semibold text-red-800 mb-1">Cancel Reason:</p>
//                 <p className="text-sm text-red-700">{ride.cancelReason}</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default HistoryTab;
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Search,
  ChevronDown,
  User,
} from "lucide-react";
import { rideAPI } from "../services/api";

const HistoryTab = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRideHistory();
  }, [filter, page]);

  const fetchRideHistory = async () => {
    try {
      setLoading(true);

      const res = await rideAPI.getRideHistoryDriver(
        page,
        10,
        filter === "all" ? undefined : filter
      );

      const apiData = res.data;
      let rideArray =
        apiData?.data?.rides || apiData?.rides || apiData?.data || [];

      if (!Array.isArray(rideArray)) rideArray = [];

      setRides(rideArray);
      setTotalPages(apiData?.totalPages || 1);
    } catch (e) {
      console.log(e);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRides = rides.filter((r) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r?.rideId?.toLowerCase().includes(s) ||
      r?.customer?.name?.toLowerCase().includes(s) ||
      r?.pickup?.address?.toLowerCase().includes(s) ||
      r?.drop?.address?.toLowerCase().includes(s)
    );
  });

  const totalEarnings = rides
    .filter((r) => r.status === "completed")
    .reduce((a, b) => a + (b?.fare - (b?.commission || 0)), 0);

  return (
    <div className="pb-24 space-y-4">

      {/* Header gradient card */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-2xl shadow-xl">
        <p className="opacity-80 text-xs">Total Earnings</p>
        <h1 className="text-4xl font-bold mt-1 mb-4">
          ₹{totalEarnings.toFixed(0)}
        </h1>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Rides" value={rides.length} />
          <Stat
            label="Completed"
            value={rides.filter((r) => r.status === "completed").length}
          />
          <Stat
            label="Cancelled"
            value={rides.filter((r) => r.status === "cancelled").length}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          className="w-full bg-white shadow-sm pl-10 pr-4 py-3 rounded-xl border"
          placeholder="Search Ride ID, Name or Location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {["all", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 rounded-xl font-semibold text-sm shadow ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-white border text-gray-600"
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Ride Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center p-20">
            <div className="animate-spin h-10 w-10 border-b-2 mx-auto rounded-full border-indigo-600" />
          </div>
        ) : filteredRides.length ? (
          filteredRides.map((r) => <RideCard key={r._id} ride={r} />)
        ) : (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <MapPin size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No rides found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl">
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-white/15 backdrop-blur p-3 rounded-xl">
    <p className="text-xs opacity-80">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const RideCard = ({ ride }) => {
  const [show, setShow] = useState(false);
  const earnings = ride?.fare - (ride?.commission || 0);

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div
        onClick={() => setShow(!show)}
        className="cursor-pointer space-y-2"
      >
        <div className="flex justify-between">
          <h3 className="font-bold text-gray-800">
            #{ride?.rideId || ride?._id?.slice(-6).toUpperCase()}
          </h3>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              ride.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {ride.status}
          </span>
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar size={14} />
          {new Date(ride?.createdAt).toLocaleString()}
        </p>

        <div className="flex gap-2 items-start">
          <div className="w-1 bg-green-500 rounded-full" />
          <p className="text-sm font-semibold">{ride?.pickup?.address}</p>
        </div>

        <div className="flex gap-2 items-start">
          <div className="w-1 bg-red-500 rounded-full" />
          <p className="text-sm font-semibold">{ride?.drop?.address}</p>
        </div>

        <div className="flex justify-between border-t pt-2">
          <p className="text-gray-500 text-sm flex gap-2">
            <Clock size={16} /> {ride?.distance} km
          </p>

          {ride.status === "completed" && (
            <p className="text-green-600 font-bold flex gap-1">
              <DollarSign size={16} /> {earnings}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <ChevronDown
            size={18}
            className={`transition ${show ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {show && (
        <div className="bg-gray-50 rounded-xl p-3 mt-2 space-y-2">
          <p className="text-sm flex gap-2">
            <User size={16} /> {ride?.customer?.name}
          </p>

          {ride.status === "completed" && (
            <p className="text-sm">
              Fare: ₹{ride?.fare} | Commission: ₹{ride?.commission}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
