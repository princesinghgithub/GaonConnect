import React from "react";
import { useDashboard } from "../../hooks/useAdmin";
import {
  FaUsers, FaCar, FaRoute, FaMoneyBillWave,
  FaChartLine, FaClock, FaSync,
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-800",
  ongoing:   "bg-blue-100 text-blue-800",
  accepted:  "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  pending:   "bg-yellow-100 text-yellow-800",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] || "bg-gray-100 text-gray-700"}`}>
    {status || "—"}
  </span>
);

const StatCard = ({ icon, title, value, bg }) => (
  <div className={`${bg} text-white rounded-xl shadow p-5 flex items-center justify-between`}>
    <div>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
    </div>
    <div className="text-4xl opacity-70">{icon}</div>
  </div>
);

const MetricCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className="text-orange-500 text-2xl">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { stats, recentActivity, revenueChart, metrics, loading, error, refresh } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  const chartData = {
    labels: revenueChart?.map((d) => d._id) || [],
    datasets: [
      {
        label: "Revenue (₹)",
        data: revenueChart?.map((d) => d.revenue) || [],
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.12)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#f97316",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={refresh}
          className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          <FaSync /> Refresh
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FaUsers />}        title="Total Users"    value={stats?.totalUsers}    bg="bg-blue-500" />
        <StatCard icon={<FaCar />}          title="Total Drivers"  value={stats?.totalDrivers}  bg="bg-green-500" />
        <StatCard icon={<FaRoute />}        title="Total Rides"    value={stats?.totalRides}    bg="bg-purple-500" />
        <StatCard icon={<FaMoneyBillWave />} title="Today Revenue" value={`₹${stats?.todayRevenue ?? 0}`} bg="bg-orange-500" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FaChartLine />}    title="Monthly Revenue"  value={`₹${metrics?.monthlyRevenue ?? 0}`} />
        <MetricCard icon={<FaCar />}          title="Active Drivers"   value={metrics?.activeDrivers ?? stats?.activeDrivers ?? 0} />
        <MetricCard icon={<FaRoute />}        title="Live Rides"       value={stats?.activeRides ?? 0} />
        <MetricCard icon={<FaClock />}        title="Pending Approval" value={stats?.pendingDrivers ?? 0} />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Revenue — Last 7 Days</h2>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Today's Performance</h3>
          <div className="space-y-3">
            {[
              { label: "Completed Rides", value: stats?.completedToday ?? 0, color: "text-green-600" },
              { label: "Cancelled Rides", value: stats?.cancelledToday ?? 0, color: "text-red-500" },
              { label: "Avg Rating",      value: `${stats?.avgRating ?? "4.5"} ★`, color: "text-yellow-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Driver Status</h3>
          <div className="space-y-3">
            {[
              { label: "Online",   value: stats?.onlineDrivers ?? 0,  color: "text-green-600" },
              { label: "On Trip",  value: stats?.busyDrivers ?? 0,    color: "text-blue-600" },
              { label: "Offline",  value: stats?.offlineDrivers ?? 0, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Rides</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b">
                <th className="pb-3 text-left">Ride ID</th>
                <th className="pb-3 text-left">Customer</th>
                <th className="pb-3 text-left">Driver</th>
                <th className="pb-3 text-left">Status</th>
                <th className="pb-3 text-left">Fare</th>
                <th className="pb-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(recentActivity || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No recent activity</td>
                </tr>
              ) : (
                recentActivity.map((ride) => (
                  <tr key={ride._id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-gray-600">#{ride._id?.slice(-8)}</td>
                    <td className="py-3">{ride.user?.name || "—"}</td>
                    <td className="py-3">{ride.driver?.name || "—"}</td>
                    <td className="py-3"><StatusBadge status={ride.status} /></td>
                    <td className="py-3 font-semibold text-green-600">₹{ride.fare}</td>
                    <td className="py-3 text-gray-400 text-xs">
                      {ride.createdAt ? new Date(ride.createdAt).toLocaleString("en-IN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
