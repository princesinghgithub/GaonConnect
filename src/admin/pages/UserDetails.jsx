// src/components/admin/Users/UserDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import { FaArrowLeft, FaUser, FaRoute, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const response = await adminAPI.getUserDetails(id);
      setUserData(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch user details');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600">User not found</div>
      </div>
    );
  }

  const { user, recentRides, stats } = userData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6">
          <img
            src={user.profileImage || '/default-avatar.png'}
            alt={user.name}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">{user.phone}</p>
            <div className="mt-2">
              {user.isBlocked ? (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                  Blocked
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Active
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-semibold">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<FaRoute className="text-3xl" />}
          title="Total Rides"
          value={stats.totalRides || 0}
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={<FaMoneyBillWave className="text-3xl" />}
          title="Total Spent"
          value={`₹${stats.totalSpent || 0}`}
          bgColor="bg-green-500"
        />
        <StatCard
          icon={<FaClock className="text-3xl" />}
          title="Completed Rides"
          value={stats.completedRides || 0}
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={<FaClock className="text-3xl" />}
          title="Cancelled Rides"
          value={stats.cancelledRides || 0}
          bgColor="bg-red-500"
        />
      </div>

      {/* Recent Rides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Rides</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ride ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pickup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dropoff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentRides.map((ride) => (
                <tr key={ride._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ride._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ride.driver?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">
                    {ride.pickup?.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">
                    {ride.dropoff?.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ride.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    ₹{ride.fare}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Reason if blocked */}
      {user.isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-800 mb-2">Block Information</h3>
          <p className="text-gray-700">
            <strong>Reason:</strong> {user.blockReason || 'No reason provided'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Blocked At:</strong>{' '}
            {new Date(user.blockedAt).toLocaleString()}
          </p>
        </div>
      )}
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
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
};

export default UserDetails;