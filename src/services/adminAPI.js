// services/adminAPI.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const adminAPI = {
  // Dashboard
  getDashboardStats: () => axios.get(`${API_URL}/admin/dashboard/stats`, getAuthHeader()),
  
  // Drivers
  getAllDrivers: (params) => axios.get(`${API_URL}/admin/drivers`, { ...getAuthHeader(), params }),
  approveDriver: (driverId) => axios.put(`${API_URL}/admin/drivers/${driverId}/approve`, {}, getAuthHeader()),
  blockDriver: (driverId, reason) => axios.put(`${API_URL}/admin/drivers/${driverId}/status`, { status: 'blocked', reason }, getAuthHeader()),
  
  // Rides
  getAllRides: (params) => axios.get(`${API_URL}/admin/rides`, { ...getAuthHeader(), params }),
  
  // Payments
  getTransactions: (params) => axios.get(`${API_URL}/admin/payments/transactions`, { ...getAuthHeader(), params })
};