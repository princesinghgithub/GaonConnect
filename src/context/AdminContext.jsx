import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeDrivers: 0,
    todayRides: 0,
    commission: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activity
  const fetchRecentActivity = async (limit = 10) => {
    try {
      const response = await adminAPI.getRecentActivity(limit);
      return response.data;
    } catch (err) {
      console.error('Activity fetch error:', err);
      throw err;
    }
  };

  // Driver operations
  const approveDriver = async (driverId) => {
    try {
      const response = await adminAPI.approveDriver(driverId);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const blockDriver = async (driverId, reason) => {
    try {
      const response = await adminAPI.blockDriver(driverId, reason);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const unblockDriver = async (driverId) => {
    try {
      const response = await adminAPI.unblockDriver(driverId);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch all drivers
  const fetchDrivers = async (page = 1, limit = 20, status = '', search = '') => {
    try {
      const response = await adminAPI.getAllDrivers(page, limit, status, search);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch all rides
  const fetchRides = async (page = 1, limit = 20, filters = {}) => {
    try {
      const response = await adminAPI.getAllRides(page, limit, filters);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch live locations
  const fetchLiveLocations = async () => {
    try {
      const response = await adminAPI.getActiveDriversLocation();
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Fetch payments
  const fetchPayments = async (page = 1, limit = 20, filters = {}) => {
    try {
      const response = await adminAPI.getAllPayments(page, limit, filters);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Process withdrawal
  const processWithdrawal = async (withdrawalId, status, remarks) => {
    try {
      const response = await adminAPI.processWithdrawal(withdrawalId, status, remarks);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  const value = {
    stats,
    loading,
    error,
    fetchStats,
    fetchRecentActivity,
    approveDriver,
    blockDriver,
    unblockDriver,
    fetchDrivers,
    fetchRides,
    fetchLiveLocations,
    fetchPayments,
    processWithdrawal,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};