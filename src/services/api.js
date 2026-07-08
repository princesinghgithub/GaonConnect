



// import axios from "axios";
// import config from "../config/config";   // <<--- IMPORTANT

// // Create axios instance
// const api = axios.create({
//   baseURL: config.apiUrl,         // <<--- use config
//   timeout: config.apiTimeout,     // <<--- use config
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ================= Request Interceptor =================
// api.interceptors.request.use(
//   (requestConfig) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       requestConfig.headers.Authorization = `Bearer ${token}`;
//     }

//     // Debug only in dev
//     if (config.debug) {
//       console.log(
//         "🚀 API Request:",
//         requestConfig.method?.toUpperCase(),
//         requestConfig.url
//       );
//     }

//     return requestConfig;
//   },
//   (error) => Promise.reject(error)
// );

// // ================= Response Interceptor =================
// api.interceptors.response.use(
//   (response) => {
//     if (config.debug) {
//       console.log("✅ API Response:", response.config.url, response.data);
//     }
//     return response;
//   },
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }

//     if (config.debug) {
//       console.error("❌ API Error:", error?.response || error?.message);
//     }

//     return Promise.reject(error);
//   }
// );


// //
// // ================= AUTH APIs =================
// //
// export const authAPI = {
//   sendOTP: (phone) => api.post("/auth/send-otp", { phone }),

//   verifyOTP: (phone, otp) => api.post("/auth/verify-otp", { phone, otp }),

//   register: (data) => api.post("/auth/register", data),

//   getProfile: () => api.get("/auth/profile"),

//   logout: () => api.post("/auth/logout"),
// };


// //
// // ================= PROVIDER APIs =================
// //
// export const providerAPI = {
//   register: (data) => api.post("/provider/register", data),
//   getProfile: () => api.get("/provider/profile/me"),
//   updateProfile: (data) => api.put("/provider/profile/update", data),
//  uploadProfilePhoto: (file) => {
//   const formData = new FormData();
//   formData.append("photo", file);  

//   return api.post("/provider/profile/photo", formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//     //  withCredentials: true, 
//   });
// },


//   toggleDuty: () => api.put("/provider/duty-toggle"),
//   updateStatus: (status, isOnline) =>
//     api.put("/provider/status", { status, isOnline }),

//   updateLocation: (lat, lng, address) =>
//     api.put("/provider/location", { lat, lng, address }),

//   getStats: () => api.get("/provider/stats/me"),
//   getTodayEarnings: () => api.get("/provider/earnings/today"),
//   getWeeklyEarnings: () => api.get("/provider/earnings/weekly"),

//   updateBankDetails: (data) => api.put("/provider/bank-details", data),
//   updatePreferences: (data) => api.put("/provider/preferences", data),

//   uploadDocument: (formData) =>
//     api.post("/provider/documents/upload", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   updateFCMToken: (fcmToken, deviceId, platform) =>
//     api.post("/provider/fcm-token", { fcmToken, deviceId, platform }),

//   getAvailable: (lat, lng, radius, vehicleType) =>
//     api.get("/provider/available", {
//       params: { lat, lng, radius, vehicleType },
//     }),
// };


// //
// // ================= RIDE APIs =================
// //
// export const rideAPI = {
//   createRide: (data) => api.post("/ride/create", data),

//   getCurrentRideCustomer: () => api.get("/ride/current/customer"),
//   getCurrentRideDriver: () => api.get("/ride/current/driver"),

//   acceptRide: (rideId) => api.post("/ride/accept", { rideId }),
//   rejectRide: (rideId, reason) => api.post("/ride/reject", { rideId, reason }),

//   updateRideStatus: (rideId, status) =>
//     api.put("/ride/status", { rideId, status }),

//   verifyOTP: (rideId, otp) => api.post("/ride/verify-otp", { rideId, otp }),

//   cancelRide: (rideId, reason) =>
//     api.post("/ride/cancel", { rideId, reason }),

//   getRideById: (id) => api.get(`/ride/${id}`),

//   getRideHistoryCustomer: (page = 1, limit = 20, status) =>
//     api.get("/ride/history/customer", { params: { page, limit, status } }),

//   getRideHistoryDriver: (page = 1, limit = 20, status, from_date) =>
//     api.get("/ride/history/driver", {
//       params: { page, limit, status, from_date },
//     }),
// };


// //
// // ================= WALLET APIs =================
// //
// export const walletAPI = {
//   getBalance: () => api.get("/wallet/balance"),

//   getTransactions: (page = 1, limit = 20, type) =>
//     api.get("/wallet/transactions", { params: { page, limit, type } }),

//   requestWithdrawal: (amount) =>
//     api.post("/wallet/withdraw", { amount }),

//   getEarningsReport: (period = "week") =>
//     api.get("/wallet/earnings/report", { params: { period } }),
// };


// //
// // ================= RATING APIs =================
// //
// export const ratingAPI = {
//   rateCustomer: (rideId, rating, feedback) =>
//     api.post("/rating/rate-customer", { rideId, rating, feedback }),

//   rateDriver: (rideId, rating, feedback) =>
//     api.post("/rating/rate-driver", { rideId, rating, feedback }),

//   getDriverRatings: () => api.get("/rating/driver/me"),
// };

// export default api;



import axios from "axios";
import config from "../config/config";

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= Request Interceptor =================
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem("token");

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    if (config.debug) {
      console.log(
        "🚀 API Request:",
        requestConfig.method?.toUpperCase(),
        requestConfig.url
      );
    }

    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// ================= Response Interceptor =================
api.interceptors.response.use(
  (response) => {
    if (config.debug) {
      console.log("✅ API Response:", response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (config.debug) {
      console.error("❌ API Error:", error?.response || error?.message);
    }

    return Promise.reject(error);
  }
);


//
// ================= AUTH APIs =================
//
export const authAPI = {
  sendOTP: (email) => api.post("/auth/send-email-otp", { email }),
  verifyOTP: (email, otp, extra = {}) =>
    api.post("/auth/verify-email-otp", { email, otp, role: "customer", ...extra }),
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
};


//
// ================= PROVIDER APIs =================
//
export const providerAPI = {
  register: (formData) =>
    api.post("/provider/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProfile: () => api.get("/provider/profile/me"),
  updateProfile: (data) => api.put("/provider/profile/update", data),
  // uploadProfilePhoto: (file) => {
  //   const formData = new FormData();
  //   formData.append("photo", file);
  //   return api.post("/provider/profile/photo", formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   });
  // },

// uploadProfilePhoto: async (file) => {
//     const formData = new FormData();
//     formData.append("photo", file); 

//     return api.post("/provider/profile/photo", formData);
//   },

uploadProfilePhoto: (formData) => {
  return api.post("/provider/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
},


  toggleDuty: () => api.put("/provider/duty-toggle"),
  updateStatus: (status, isOnline) =>
    api.put("/provider/status", { status, isOnline }),
  updateLocation: (lat, lng, address) =>
    api.put("/provider/location", { lat, lng, address }),

  getStats: () => api.get("/provider/stats/me"),
  getTodayEarnings: () => api.get("/provider/earnings/today"),
  getWeeklyEarnings: () => api.get("/provider/earnings/weekly"),

  updateBankDetails: (data) => api.put("/provider/bank-details", data),
  updatePreferences: (data) => api.put("/provider/preferences", data),

  uploadDocument: (formData) =>
    api.post("/provider/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateFCMToken: (fcmToken, deviceId, platform) =>
    api.post("/provider/fcm-token", { fcmToken, deviceId, platform }),

  getAvailable: (lat, lng, radius, vehicleType) =>
    api.get("/provider/available", {
      params: { lat, lng, radius, vehicleType },
    }),
};


//
// ================= RIDE APIs =================

export const rideAPI = {
  createRide: (data) => api.post("/ride/create", data),

  getCurrentRideCustomer: () => api.get("/ride/current/customer"),
  getCurrentRideDriver: () => api.get("/ride/current/driver"),

  acceptRide: (rideId) => api.post("/ride/accept", { rideId }),
  rejectRide: (rideId, reason) => api.post("/ride/reject", { rideId, reason }),

  updateRideStatus: (rideId, status) =>
    api.put("/ride/status", { rideId, status }),

  verifyOTP: (rideId, otp) => api.post("/ride/verify-otp", { rideId, otp }),

  cancelRide: (rideId, reason) =>
    api.post("/ride/cancel", { rideId, reason }),

  getRideById: (id) => api.get(`/ride/${id}`),

  getRideHistoryCustomer: (page = 1, limit = 20, status) =>
    api.get("/ride/history/customer", { params: { page, limit, status } }),

  getRideHistoryDriver: (page = 1, limit = 20, status, from_date) =>
    api.get("/ride/history/driver", {
      params: { page, limit, status, from_date },
    }),
  getSearchingRides: () => api.get("/ride/searching"),

  createRazorpayOrder: (rideId) => api.post(`/ride/${rideId}/razorpay-order`),
  verifyRazorpayPayment: (data) => api.post("/ride/razorpay-verify", data),
};


//
// ================= SOS API =================
//
export const sosAPI = {
  trigger: (rideId, latitude, longitude, address) =>
    api.post("/sos/trigger", { rideId, latitude, longitude, address }),
};



//
// ================= WALLET APIs =================
//
export const walletAPI = {
  getBalance: () => api.get("/wallet/balance"),

  getTransactions: (page = 1, limit = 20, type) =>
    api.get("/wallet/transactions", { params: { page, limit, type } }),

  requestWithdrawal: (amount) =>
    api.post("/wallet/withdraw", { amount }),

  getEarningsReport: (period = "week") =>
    api.get("/wallet/earnings/report", { params: { period } }),
};


//
// ================= RATING APIs =================
//
export const ratingAPI = {
  // Customer -> driver or driver -> customer; raterType is inferred server-side from req.user
  submitRating: (rideId, stars, review, tags) =>
    api.post("/ratings/submit", { rideId, stars, review, tags }),

  getProviderRatings: (providerId, page = 1, limit = 20) =>
    api.get(`/ratings/provider/${providerId}`, { params: { page, limit } }),

  getRideRatings: (rideId) => api.get(`/ratings/ride/${rideId}`),

  getPendingRatings: () => api.get("/ratings/pending"),
};


//
// ================= ADMIN APIs =================
//
export const adminAPI = {
  // ===== DASHBOARD =====
  getStats: () => api.get("/admin/stats/overview"),
  getRecentActivity: (limit = 10) =>
    api.get("/admin/activity/recent", { params: { limit } }),
  getRevenueChart: (period = "week") =>
    api.get("/admin/revenue/chart", { params: { period } }),
  getDashboardMetrics: () => api.get("/admin/dashboard/metrics"),

  // ===== DRIVERS MANAGEMENT =====
  getAllDrivers: (page = 1, limit = 20, status, search) =>
    api.get("/admin/drivers", { params: { page, limit, status, search } }),
  getDriverById: (id) => api.get(`/admin/drivers/${id}`),
  
  approveDriver: (driverId) =>
    api.put(`/admin/drivers/${driverId}/approve`),
  rejectDriver: (driverId, reason) =>
    api.put(`/admin/drivers/${driverId}/reject`, { reason }),
  blockDriver: (driverId, reason) =>
    api.put(`/admin/drivers/${driverId}/block`, { reason }),
  unblockDriver: (driverId) =>
    api.put(`/admin/drivers/${driverId}/unblock`),
  
  updateDriverStatus: (driverId, status) =>
    api.put(`/admin/drivers/${driverId}/status`, { status }),
  deleteDriver: (driverId) =>
    api.delete(`/admin/drivers/${driverId}`),
  
  verifyDocument: (driverId, documentType, status) =>
    api.put(`/admin/drivers/${driverId}/documents/verify`, 
      { documentType, status }),
  getDriverStats: (driverId) =>
    api.get(`/admin/drivers/${driverId}/stats`),

  // ===== RIDES MANAGEMENT =====
  getAllRides: (page = 1, limit = 20, filters = {}) =>
    api.get("/admin/rides", { params: { page, limit, ...filters } }),
  getRideDetails: (rideId) => api.get(`/admin/rides`),
  cancelRideAdmin: (rideId, reason) =>
    api.post(`/admin/rides/${rideId}/cancel`, { reason }),
  getRideStats: (period = "today") =>
    api.get("/admin/rides/stats", { params: { period } }),
  
  // ===== LIVE MAP =====
  getActiveDriversLocation: () =>
    api.get("/admin/drivers/live-locations"),
  getOngoingRides: () =>
    api.get("/admin/rides/ongoing"),
  trackRide: (rideId) =>
    api.get(`/admin/rides/${rideId}/track`),

  // ===== PAYMENTS =====
  getAllPayments: (page = 1, limit = 20, filters = {}) =>
    api.get("/admin/payments", { params: { page, limit, ...filters } }),
  getPaymentStats: () =>
    api.get("/admin/payments/stats"),
  
  getPendingWithdrawals: () =>
    api.get("/admin/payments/withdrawals/pending"),
  processWithdrawal: (withdrawalId, status, remarks) =>
    api.put(`/admin/payments/withdrawal/${withdrawalId}`, { status, remarks }),
  
  getCommissionReport: (from_date, to_date) =>
    api.get("/admin/payments/commission", 
      { params: { from_date, to_date } }),

  // ===== USERS/CUSTOMERS =====
  getAllUsers: (page = 1, limit = 20, search) =>
    api.get("/admin/users", { params: { page, limit, search } }),
  getUserDetails: (userId) =>
    api.get(`/admin/users/${userId}`),
  blockUser: (userId, reason) =>
    api.put(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) =>
    api.put(`/admin/users/${userId}/unblock`),

  // ===== SETTINGS =====
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
  getSystemConfig: () => api.get("/admin/config"),

  // ===== PRICING =====
  getPricing: () => api.get("/admin/pricing"),
  updateVehiclePricing: (vehicleType, baseFare, perKmRate, minimumFare) =>
    api.put("/admin/pricing", { vehicleType, baseFare, perKmRate, minimumFare }),
  updateSurge: (enabled, multiplier, reason) =>
    api.put("/admin/pricing", {
      surge: { highDemand: { enabled, ...(enabled && { multiplier, reason }) } },
    }),
  updateCommission: (percentage) =>
    api.put("/admin/pricing", { commission: { percentage } }),

  // ===== REPORTS & ANALYTICS =====
  getAnalytics: (period = "week") =>
    api.get("/admin/analytics", { params: { period } }),
  exportReport: (type, from_date, to_date) =>
    api.get("/admin/reports/export", 
      { params: { type, from_date, to_date }, responseType: 'blob' }),
  getDriverPerformance: (driverId, period) =>
    api.get(`/admin/drivers/${driverId}/performance`, 
      { params: { period } }),

  // ===== NOTIFICATIONS =====
  sendNotification: (data) =>
    api.post("/admin/notifications/send", data),
  sendBulkNotification: (data) =>
    api.post("/admin/notifications/bulk", data),
};



// src/services/api.js

export const locationAPI = {
  // Search locations (autocomplete)
  searchLocation: (query, latitude, longitude) =>
    api.get('/location/search', {
      params: { query, latitude, longitude }
    }),

  // Get place details
  getPlaceDetails: (placeId) =>
    api.get(`/location/details/${placeId}`),

  // Reverse geocode
  reverseGeocode: (latitude, longitude) =>
    api.get('/location/reverse', {
      params: { latitude, longitude }
    }),

  // Calculate distance
  calculateDistance: (origin, destination, vehicleType) =>
    api.post('/location/distance', { origin, destination, vehicleType }),
};

//
// ================= NOTIFICATION APIs =================
//
export const notificationAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get("/notifications", { params: { page, limit } }),

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put("/notifications/read-all"),
};

export default api;