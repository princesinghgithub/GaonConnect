// src/hooks/useAdmin.js
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = async (apiCall, successMessage = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (successMessage) {
        toast.success(successMessage);
      }
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Something went wrong';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      throw err;
    }
  };

  return { loading, error, handleRequest };
};

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const { loading, error, handleRequest } = useAdmin();

  const fetchDashboardData = async () => {
    try {
      const [statsData, activityData, revenueData, metricsData] = await Promise.all([
        handleRequest(() => adminAPI.getStats()),
        handleRequest(() => adminAPI.getRecentActivity(10)),
        handleRequest(() => adminAPI.getRevenueChart('week')),
        handleRequest(() => adminAPI.getDashboardMetrics()),
      ]);

      setStats(statsData.data);
      setRecentActivity(activityData.data);
      setRevenueChart(revenueData.data);
      setMetrics(metricsData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { stats, recentActivity, revenueChart, metrics, loading, error, refresh: fetchDashboardData };
};

export const useDrivers = (page = 1, limit = 20, status = '', search = '') => {
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState({});
  const { loading, error, handleRequest } = useAdmin();

  const fetchDrivers = async () => {
    const data = await handleRequest(() => 
      adminAPI.getAllDrivers(page, limit, status, search)
    );
    setDrivers(data.data);
    setPagination({
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    });
  };

  const approveDriver = async (driverId) => {
    await handleRequest(
      () => adminAPI.approveDriver(driverId),
      'Driver approved successfully'
    );
    fetchDrivers();
  };

  const rejectDriver = async (driverId, reason) => {
    await handleRequest(
      () => adminAPI.rejectDriver(driverId, reason),
      'Driver rejected'
    );
    fetchDrivers();
  };

  const blockDriver = async (driverId, reason) => {
    await handleRequest(
      () => adminAPI.blockDriver(driverId, reason),
      'Driver blocked successfully'
    );
    fetchDrivers();
  };

  const unblockDriver = async (driverId) => {
    await handleRequest(
      () => adminAPI.unblockDriver(driverId),
      'Driver unblocked successfully'
    );
    fetchDrivers();
  };

  const deleteDriver = async (driverId) => {
    await handleRequest(
      () => adminAPI.deleteDriver(driverId),
      'Driver deleted successfully'
    );
    fetchDrivers();
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, limit, status, search]);

  return {
    drivers,
    pagination,
    loading,
    error,
    approveDriver,
    rejectDriver,
    blockDriver,
    unblockDriver,
    deleteDriver,
    refresh: fetchDrivers,
  };
};

export const useRides = (page = 1, limit = 20, filters = {}) => {
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({});
  const { loading, error, handleRequest } = useAdmin();

  const fetchRides = async () => {
    const data = await handleRequest(() => 
      adminAPI.getAllRides(page, limit, filters)
    );
    setRides(data.data);
    setPagination({
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    });
  };

  const cancelRide = async (rideId, reason) => {
    await handleRequest(
      () => adminAPI.cancelRideAdmin(rideId, reason),
      'Ride cancelled successfully'
    );
    fetchRides();
  };

  useEffect(() => {
    fetchRides();
  }, [page, limit, JSON.stringify(filters)]);

  return {
    rides,
    pagination,
    loading,
    error,
    cancelRide,
    refresh: fetchRides,
  };
};

export const useUsers = (page = 1, limit = 20, search = '') => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const { loading, error, handleRequest } = useAdmin();

  const fetchUsers = async () => {
    const data = await handleRequest(() => 
      adminAPI.getAllUsers(page, limit, search)
    );
    setUsers(data.data);
    setPagination({
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    });
  };

  const blockUser = async (userId, reason) => {
    await handleRequest(
      () => adminAPI.blockUser(userId, reason),
      'User blocked successfully'
    );
    fetchUsers();
  };

  const unblockUser = async (userId) => {
    await handleRequest(
      () => adminAPI.unblockUser(userId),
      'User unblocked successfully'
    );
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search]);

  return {
    users,
    pagination,
    loading,
    error,
    blockUser,
    unblockUser,
    refresh: fetchUsers,
  };
};

export const usePayments = (page = 1, limit = 20, filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const { loading, error, handleRequest } = useAdmin();

  const fetchPayments = async () => {
    const data = await handleRequest(() => 
      adminAPI.getAllPayments(page, limit, filters)
    );
    setPayments(data.data);
    setPagination({
      total: data.total,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
    });
  };

  const fetchPaymentStats = async () => {
    const data = await handleRequest(() => adminAPI.getPaymentStats());
    setStats(data.data);
  };

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [page, limit, JSON.stringify(filters)]);

  return {
    payments,
    pagination,
    stats,
    loading,
    error,
    refresh: fetchPayments,
  };
};