// import React, { useState, useEffect } from "react";
// import { useAdmin } from "../../context/AdminContext";

// const Dashboard = () => {
//   const { stats, loading, error, fetchRecentActivity } = useAdmin();
//   const [activities, setActivities] = useState([]);
//   const [activityLoading, setActivityLoading] = useState(false);

//   useEffect(() => {
//     loadActivity();
//   }, []);

//   const loadActivity = async () => {
//     try {
//       setActivityLoading(true);
//       const data = await fetchRecentActivity(10);
//       setActivities(data.activities || []);
//     } catch (err) {
//       console.error('Failed to load activity:', err);
//     } finally {
//       setActivityLoading(false);
//     }
//   };

//   const statsCards = [
//     { 
//       title: "Total Revenue", 
//       value: `₹${stats.totalRevenue ? (stats.totalRevenue / 100000).toFixed(1) : 0}L`,
//       color: "bg-blue-500" 
//     },
//     { 
//       title: "Active Drivers", 
//       value: stats.activeDrivers || 0,
//       color: "bg-green-500" 
//     },
//     { 
//       title: "Today's Rides", 
//       value: stats.todayRides || 0,
//       color: "bg-orange-500" 
//     },
//     { 
//       title: "Commission", 
//       value: `₹${stats.commission ? (stats.commission / 1000).toFixed(0) : 0}K`,
//       color: "bg-purple-500" 
//     }
//   ];

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {statsCards.map((stat, i) => (
//           <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500 text-sm">{stat.title}</p>
//                 <p className="text-3xl font-bold mt-2">{stat.value}</p>
//               </div>
//               <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-10`}></div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white rounded-xl p-6 shadow-md">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-xl font-bold">Recent Activity</h3>
//           <button 
//             onClick={loadActivity}
//             className="text-sm text-orange-500 hover:text-orange-600"
//           >
//             Refresh
//           </button>
//         </div>

//         {activityLoading ? (
//           <div className="text-center py-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
//           </div>
//         ) : activities.length === 0 ? (
//           <p className="text-gray-400 text-center py-8">No recent activity</p>
//         ) : (
//           <ul className="space-y-3">
//             {activities.map((activity, i) => (
//               <li key={i} className="flex justify-between items-center text-sm border-b pb-3 last:border-0">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-2 h-2 rounded-full ${
//                     activity.type === 'driver' ? 'bg-green-500' :
//                     activity.type === 'ride' ? 'bg-blue-500' :
//                     'bg-orange-500'
//                   }`}></div>
//                   <span>{activity.text}</span>
//                 </div>
//                 <span className="text-gray-400">{activity.time}</span>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="bg-white p-6 rounded-xl shadow-md">
//           <h4 className="font-bold mb-4">Today's Performance</h4>
//           <div className="space-y-2">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Completed Rides</span>
//               <span className="font-semibold">{stats.completedToday || 0}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Cancelled Rides</span>
//               <span className="font-semibold text-red-500">{stats.cancelledToday || 0}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Average Rating</span>
//               <span className="font-semibold">{stats.avgRating || '4.5'} ⭐</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-xl shadow-md">
//           <h4 className="font-bold mb-4">Driver Status</h4>
//           <div className="space-y-2">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Online</span>
//               <span className="font-semibold text-green-500">{stats.onlineDrivers || 0}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">On Trip</span>
//               <span className="font-semibold text-blue-500">{stats.busyDrivers || 0}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Offline</span>
//               <span className="font-semibold text-gray-400">{stats.offlineDrivers || 0}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


// src/components/admin/Dashboard/Dashboard.jsx
import React from 'react';
import { useDashboard } from '../../hooks/useAdmin';
import { 
  FaUsers, 
  FaCar, 
  FaRoute, 
  FaMoneyBillWave,
  FaChartLine,
  FaClock
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { stats, recentActivity, revenueChart, metrics, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  const chartData = {
    labels: revenueChart?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Revenue',
        data: revenueChart?.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue Chart (Last 7 Days)',
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaUsers className="text-3xl" />}
          title="Total Users"
          value={stats?.totalUsers || 0}
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={<FaCar className="text-3xl" />}
          title="Total Drivers"
          value={stats?.totalDrivers || 0}
          bgColor="bg-green-500"
        />
        <StatCard
          icon={<FaRoute className="text-3xl" />}
          title="Total Rides"
          value={stats?.totalRides || 0}
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={<FaMoneyBillWave className="text-3xl" />}
          title="Today Revenue"
          value={`₹${stats?.todayRevenue || 0}`}
          bgColor="bg-orange-500"
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<FaChartLine />}
          title="Monthly Revenue"
          value={`₹${metrics?.monthlyRevenue || 0}`}
        />
        <MetricCard
          icon={<FaCar />}
          title="Active Drivers"
          value={metrics?.activeDrivers || 0}
        />
        <MetricCard
          icon={<FaClock />}
          title="Active Rides"
          value={stats?.activeRides || 0}
        />
        <MetricCard
          icon={<FaClock />}
          title="Pending Drivers"
          value={stats?.pendingDrivers || 0}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ride ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity?.map((ride) => (
                <tr key={ride._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ride._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ride.user?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ride.driver?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ride.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ₹{ride.fare}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ride.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, bgColor }) => {
  return (
    <div className={`${bgColor} text-white rounded-lg shadow-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-4">
        <div className="text-blue-600 text-2xl">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default Dashboard;