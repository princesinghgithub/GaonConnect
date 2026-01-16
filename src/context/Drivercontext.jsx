// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { providerAPI } from '../services/api';

// const DriverContext = createContext();

// export const useDriver = () => {
//   const context = useContext(DriverContext);
//   if (!context) {
//     throw new Error('useDriver must be used within DriverProvider');
//   }
//   return context;
// };

// export const DriverProvider = ({ children }) => {
//   const [driver, setDriver] = useState(null);
//   const [currentRide, setCurrentRide] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [wallet, setWallet] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(false);

//   // Load driver profile on mount
//   useEffect(() => {
//     loadDriverProfile();
//     loadCurrentRide();
//   }, []);

//   // Update location every 30 seconds when online
//   useEffect(() => {
//     let locationInterval;

//     if (isOnline && 'geolocation' in navigator) {
//       locationInterval = setInterval(() => {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             try {
//               await providerAPI.updateLocation(
//                 position.coords.latitude,
//                 position.coords.longitude
//               );
//             } catch (error) {
//               console.error('Location update error:', error);
//             }
//           },
//           (error) => console.error('Geolocation error:', error),
//           { enableHighAccuracy: true }
//         );
//       }, 30000); // 30 seconds
//     }

//     return () => {
//       if (locationInterval) clearInterval(locationInterval);
//     };
//   }, [isOnline]);

//   const loadDriverProfile = async () => {
//     try {
//       setLoading(true);
//       const response = await providerAPI.getProfile();
//       setDriver(response.data.data);
//       setIsOnline(response.data.data.isOnline);
//     } catch (error) {
//       console.error('Load profile error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadCurrentRide = async () => {
//     try {
//       const response = await rideAPI.getCurrentRideDriver();
//       setCurrentRide(response.data.ride);
//     } catch (error) {
//       console.error('Load current ride error:', error);
//     }
//   };

//   const loadStats = async () => {
//     try {
//       const response = await providerAPI.getStats();
//       setStats(response.data.data);
//     } catch (error) {
//       console.error('Load stats error:', error);
//     }
//   };

//   const loadWallet = async () => {
//     try {
//       const response = await walletAPI.getBalance();
//       setWallet(response.data.data);
//     } catch (error) {
//       console.error('Load wallet error:', error);
//     }
//   };

//   const toggleDuty = async () => {
//     try {
//       const response = await providerAPI.toggleDuty();
//       setIsOnline(response.data.isOnline);
      
//       // Update location when going online
//       if (response.data.isOnline && 'geolocation' in navigator) {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             await providerAPI.updateLocation(
//               position.coords.latitude,
//               position.coords.longitude
//             );
//           }
//         );
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('Toggle duty error:', error);
//       throw error;
//     }
//   };

//   const acceptRide = async (rideId) => {
//     try {
//       const response = await rideAPI.acceptRide(rideId);
//       setCurrentRide(response.data.ride);
//       return response.data;
//     } catch (error) {
//       console.error('Accept ride error:', error);
//       throw error;
//     }
//   };

//   const rejectRide = async (rideId, reason) => {
//     try {
//       await rideAPI.rejectRide(rideId, reason);
//     } catch (error) {
//       console.error('Reject ride error:', error);
//       throw error;
//     }
//   };

//   const updateRideStatus = async (rideId, status) => {
//     try {
//       const response = await rideAPI.updateRideStatus(rideId, status);
//       setCurrentRide(response.data.ride);
      
//       // Reload stats and wallet after completing ride
//       if (status === 'completed') {
//         await loadStats();
//         await loadWallet();
//         setCurrentRide(null);
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('Update ride status error:', error);
//       throw error;
//     }
//   };

//   const verifyOTP = async (rideId, otp) => {
//     try {
//       const response = await rideAPI.verifyOTP(rideId, otp);
//       setCurrentRide(response.data.ride);
//       return response.data;
//     } catch (error) {
//       console.error('Verify OTP error:', error);
//       throw error;
//     }
//   };

//   const value = {
//     driver,
//     currentRide,
//     stats,
//     wallet,
//     loading,
//     isOnline,
//     loadDriverProfile,
//     loadCurrentRide,
//     loadStats,
//     loadWallet,
//     toggleDuty,
//     acceptRide,
//     rejectRide,
//     updateRideStatus,
//     verifyOTP
//   };

//   return (
//     <DriverContext.Provider value={value}>
//       {children}
//     </DriverContext.Provider>
//   );
// };




// import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
// import { providerAPI, rideAPI, walletAPI } from '../services/api';

// const DriverContext = createContext();

// export const useDriver = () => {
//   const context = useContext(DriverContext);
//   if (!context) {
//     throw new Error('useDriver must be used within DriverProvider');
//   }
//   return context;
// };

// export const DriverProvider = ({ children }) => {
//   const [driver, setDriver] = useState(null);
//   const [currentRide, setCurrentRide] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [wallet, setWallet] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(false);
  
//   // ✅ FIX: Use refs to track if data has been loaded
//   const hasLoadedProfile = useRef(false);
//   const hasLoadedRide = useRef(false);

//   // ✅ FIX: Load driver profile only once on mount
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token && !hasLoadedProfile.current) {
//       loadDriverProfile();
//       loadCurrentRide();
//       hasLoadedProfile.current = true;
//     } else if (!token) {
//       setLoading(false);
//     }
//   }, []); // ← Empty dependency array = run once

//   // Update location every 30 seconds when online
//   useEffect(() => {
//     let locationInterval;

//     if (isOnline && 'geolocation' in navigator) {
//       locationInterval = setInterval(() => {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             try {
//               await providerAPI.updateLocation(
//                 position.coords.latitude,
//                 position.coords.longitude
//               );
//             } catch (error) {
//               console.error('Location update error:', error);
//             }
//           },
//           (error) => console.error('Geolocation error:', error),
//           { enableHighAccuracy: true }
//         );
//       }, 30000); // 30 seconds
//     }

//     return () => {
//       if (locationInterval) clearInterval(locationInterval);
//     };
//   }, [isOnline]);

//   // ✅ FIX: Use useCallback to memoize functions
//   const loadDriverProfile = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await providerAPI.getProfile();
//       setDriver(response.data.data);
//       setIsOnline(response.data.data.isOnline);
//     } catch (error) {
//       console.error('Load profile error:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadCurrentRide = useCallback(async () => {
//     try {
//       const response = await rideAPI.getCurrentRideDriver();
//       setCurrentRide(response.data.ride);
//     } catch (error) {
//       console.error('Load current ride error:', error);
//     }
//   }, []);

//   const loadStats = useCallback(async () => {
//     try {
//       const response = await providerAPI.getStats();
//       setStats(response.data.data);
//     } catch (error) {
//       console.error('Load stats error:', error);
//     }
//   }, []);

//   const loadWallet = useCallback(async () => {
//     try {
//       const response = await walletAPI.getBalance();
//       setWallet(response.data.data);
//     } catch (error) {
//       console.error('Load wallet error:', error);
//     }
//   }, []);

//   const toggleDuty = useCallback(async () => {
//     try {
//       const response = await providerAPI.toggleDuty();
//       setIsOnline(response.data.isOnline);
      
//       // Update location when going online
//       if (response.data.isOnline && 'geolocation' in navigator) {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             await providerAPI.updateLocation(
//               position.coords.latitude,
//               position.coords.longitude
//             );
//           }
//         );
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('Toggle duty error:', error);
//       throw error;
//     }
//   }, []);

//   const acceptRide = useCallback(async (rideId) => {
//     try {
//       const response = await rideAPI.acceptRide(rideId);
//       setCurrentRide(response.data.ride);
//       return response.data;
//     } catch (error) {
//       console.error('Accept ride error:', error);
//       throw error;
//     }
//   }, []);

//   const rejectRide = useCallback(async (rideId, reason) => {
//     try {
//       await rideAPI.rejectRide(rideId, reason);
//     } catch (error) {
//       console.error('Reject ride error:', error);
//       throw error;
//     }
//   }, []);

//   const updateRideStatus = useCallback(async (rideId, status) => {
//     try {
//       const response = await rideAPI.updateRideStatus(rideId, status);
//       setCurrentRide(response.data.ride);
      
//       // Reload stats and wallet after completing ride
//       if (status === 'completed') {
//         await loadStats();
//         await loadWallet();
//         setCurrentRide(null);
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('Update ride status error:', error);
//       throw error;
//     }
//   }, [loadStats, loadWallet]);

//   const verifyOTP = useCallback(async (rideId, otp) => {
//     try {
//       const response = await rideAPI.verifyOTP(rideId, otp);
//       setCurrentRide(response.data.ride);
//       return response.data;
//     } catch (error) {
//       console.error('Verify OTP error:', error);
//       throw error;
//     }
//   }, []);

//   const value = {
//     driver,
//     currentRide,
//     stats,
//     wallet,
//     loading,
//     isOnline,
//     loadDriverProfile,
//     loadCurrentRide,
//     loadStats,
//     loadWallet,
//     toggleDuty,
//     acceptRide,
//     rejectRide,
//     updateRideStatus,
//     verifyOTP
//   };

//   return (
//     <DriverContext.Provider value={value}>
//       {children}
//     </DriverContext.Provider>
//   );
// };





import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { providerAPI, rideAPI, walletAPI } from "../services/api";

const DriverContext = createContext();

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error("useDriver must be used within DriverProvider");
  }
  return context;
};

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // 🔔 Ring
  const ringRef = useRef(new Audio("/sounds/gaonConnect.mp3"));
  ringRef.current.loop = true;

  const hasLoaded = useRef(false);
  const pollingRef = useRef(null);

  /* ---------------- LOAD PROFILE ---------------- */
  const loadDriverProfile = useCallback(async () => {
    try {
      const res = await providerAPI.getProfile();
      setDriver(res.data.data);
      setIsOnline(res.data.data.isOnline);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- LOAD CURRENT RIDE ---------------- */
const loadCurrentRide = useCallback(async (silent = false) => {
  try {
    const res = await rideAPI.getCurrentRideDriver();

    const ride = res.data.data; // ✅ FIX HERE

    // 🔔 Ring only for new searching ride
    if (!currentRide && ride && ride.status === "searching") {
      ringRef.current?.play();
    }

    // 🔕 Stop ring when no ride
    if (!ride) {
      ringRef.current?.pause();
      ringRef.current.currentTime = 0;
    }

    setCurrentRide(ride);
  } catch (err) {
    if (!silent) console.error("Load ride error:", err);
  }
}, [currentRide]);


  /* ---------------- INITIAL LOAD (ONLY ONE) ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !hasLoaded.current) {
      loadDriverProfile();
      loadCurrentRide();
      hasLoaded.current = true;
    } else {
      setLoading(false);
    }
  }, [loadDriverProfile, loadCurrentRide]);

  /* ---------------- POLLING ---------------- */
  useEffect(() => {
    if (isOnline) {
      pollingRef.current = setInterval(() => {
        loadCurrentRide(true);
      }, 5000);
    }

    return () => pollingRef.current && clearInterval(pollingRef.current);
  }, [isOnline, loadCurrentRide]);

  /* ---------------- TOGGLE DUTY ---------------- */
  const toggleDuty = useCallback(async () => {
    const res = await providerAPI.toggleDuty();
    setIsOnline(res.data.isOnline);

    if (!res.data.isOnline) {
      ringRef.current.pause();
      ringRef.current.currentTime = 0;
    }

    return res.data;
  }, []);

  /* ---------------- ACCEPT / REJECT ---------------- */
  const acceptRide = async (rideId) => {
    ringRef.current.pause();
    ringRef.current.currentTime = 0;
    const res = await rideAPI.acceptRide(rideId);
    setCurrentRide(res.data.ride);
  };

  const rejectRide = async (rideId, reason) => {
    ringRef.current.pause();
    ringRef.current.currentTime = 0;
    await rideAPI.rejectRide(rideId, reason);
    setCurrentRide(null);
  };

  /* ---------------- UPDATE STATUS ---------------- */
  const updateRideStatus = async (rideId, status) => {
    const res = await rideAPI.updateRideStatus(rideId, status);
    setCurrentRide(res.data.ride);

    if (status === "completed") {
      const s = await providerAPI.getStats();
      const w = await walletAPI.getBalance();
      setStats(s.data.data);
      setWallet(w.data.data);
      setCurrentRide(null);
    }
  };

  const verifyOTP = async (rideId, otp) => {
    const res = await rideAPI.verifyOTP(rideId, otp);
    setCurrentRide(res.data.ride);
  };

  return (
    <DriverContext.Provider
      value={{
        driver,
        currentRide,
        stats,
        wallet,
        loading,
        isOnline,
        loadCurrentRide,
        toggleDuty,
        acceptRide,
        rejectRide,
        updateRideStatus,
        verifyOTP,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};
