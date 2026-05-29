// src/components/admin/Analytics/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [period, setPeriod] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics(period);
      setAnalytics(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === 'week' ? 7 : period === 'month' ? 30 : 365));
      
      const response = await adminAPI.exportReport(
        'rides',
        startDate.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Rides Chart Data
  const ridesChartData = {
    labels: analytics?.rides?.map((item) => item._id) || [],
    datasets: [
      {
        label: 'Total Rides',
        data: analytics?.rides?.map((item) => item.totalRides) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Completed',
        data: analytics?.rides?.map((item) => item.completed) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Cancelled',
        data: analytics?.rides?.map((item) => item.cancelled) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.4,
      },
    ],
  };

  // User Growth Chart Data
  const userGrowthData = {
    labels: analytics?.userGrowth?.map((item) => item._id) || [],
    datasets: [
      {
        label: 'New Users',
        data: analytics?.userGrowth?.map((item) => item.newUsers) || [],
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
      },
    ],
  };

  // Driver Growth Chart Data
  const driverGrowthData = {
    labels: analytics?.driverGrowth?.map((item) => item._id) || [],
    datasets: [
      {
        label: 'New Drivers',
        data: analytics?.driverGrowth?.map((item) => item.newDrivers) || [],
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <div className="flex space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Rides Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Rides Analytics</h2>
        <Line data={ridesChartData} options={chartOptions} />
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">User Growth</h2>
          <Bar data={userGrowthData} options={chartOptions} />
        </div>

        {/* Driver Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Driver Growth</h2>
          <Bar data={driverGrowthData} options={chartOptions} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Rides
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {analytics?.rides?.reduce((sum, item) => sum + item.totalRides, 0) || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            New Users
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {analytics?.userGrowth?.reduce((sum, item) => sum + item.newUsers, 0) || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            New Drivers
          </h3>
          <p className="text-3xl font-bold text-orange-600">
            {analytics?.driverGrowth?.reduce((sum, item) => sum + item.newDrivers, 0) ||
              0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;