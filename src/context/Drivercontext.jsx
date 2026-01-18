
// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
// } from "react";
// import { providerAPI, rideAPI, walletAPI } from "../services/api";

// const DriverContext = createContext();

// export const useDriver = () => {
//   const context = useContext(DriverContext);
//   if (!context) {
//     throw new Error("useDriver must be used within DriverProvider");
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

//   // 🔔 Ring
//   const ringRef = useRef(new Audio("/sounds/gaonConnect.mp3"));
//   ringRef.current.loop = true;

//   const hasLoaded = useRef(false);
//   const pollingRef = useRef(null);

//   /* ---------------- LOAD PROFILE ---------------- */
//   const loadDriverProfile = useCallback(async () => {
//     try {
//       const res = await providerAPI.getProfile();
//       setDriver(res.data.data);
//       setIsOnline(res.data.data.isOnline);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   /* ---------------- LOAD CURRENT RIDE ---------------- */
// // const loadCurrentRide = useCallback(async (silent = false) => {
// //   try {
// //     const res = await rideAPI.getCurrentRideDriver();

// //     const ride = res.data.data; // ✅ FIX HERE

// //     // 🔔 Ring only for new searching ride
// //     if (!currentRide && ride && ride.status === "searching") {
// //       ringRef.current?.play();
// //     }

// //     // 🔕 Stop ring when no ride
// //     if (!ride) {
// //       ringRef.current?.pause();
// //       ringRef.current.currentTime = 0;
// //     }

// //     setCurrentRide(ride);
// //   } catch (err) {
// //     if (!silent) console.error("Load ride error:", err);
// //   }
// // }, [currentRide]);

// const lastRideIdRef = useRef(null);
// const loadCurrentRide = useCallback(async (silent = false) => {
//   try {
//     const res = await rideAPI.getCurrentRideDriver();
//     const ride = res.data.data;

//     // 🔔 NEW ride aayi
//     if (
//       ride &&
//       ride.status === "searching" &&
//       ride._id !== lastRideIdRef.current
//     ) {
//       ringRef.current.play();
//       lastRideIdRef.current = ride._id;
//     }

//     // 🔕 Ride nahi hai
//     if (!ride) {
//       ringRef.current.pause();
//       ringRef.current.currentTime = 0;
//       lastRideIdRef.current = null;
//     }

//     setCurrentRide(ride);
//   } catch (err) {
//     if (!silent) console.error(err);
//   }
// }, []);

//   /* ---------------- INITIAL LOAD (ONLY ONE) ---------------- */
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token && !hasLoaded.current) {
//       loadDriverProfile();
//       loadCurrentRide();
//       hasLoaded.current = true;
//     } else {
//       setLoading(false);
//     }
//   }, [loadDriverProfile, loadCurrentRide]);

//   /* ---------------- POLLING ---------------- */
//   useEffect(() => {
//     if (isOnline) {
//       pollingRef.current = setInterval(() => {
//         loadCurrentRide(true);
//       }, 5000);
//     }

//     return () => pollingRef.current && clearInterval(pollingRef.current);
//   }, [isOnline, loadCurrentRide]);

//   /* ---------------- TOGGLE DUTY ---------------- */
//   const toggleDuty = useCallback(async () => {
//     const res = await providerAPI.toggleDuty();
//     setIsOnline(res.data.isOnline);

//     if (!res.data.isOnline) {
//       ringRef.current.pause();
//       ringRef.current.currentTime = 0;
//     }

//     return res.data;
//   }, []);

//   /* ---------------- ACCEPT / REJECT ---------------- */
//   const acceptRide = async (rideId) => {
//     ringRef.current.pause();
//     ringRef.current.currentTime = 0;
//     const res = await rideAPI.acceptRide(rideId);
//     setCurrentRide(res.data.ride);
//   };

//   const rejectRide = async (rideId, reason) => {
//     ringRef.current.pause();
//     ringRef.current.currentTime = 0;
//     await rideAPI.rejectRide(rideId, reason);
//     setCurrentRide(null);
//   };

//   /* ---------------- UPDATE STATUS ---------------- */
//   const updateRideStatus = async (rideId, status) => {
//     const res = await rideAPI.updateRideStatus(rideId, status);
//     setCurrentRide(res.data.ride);

//     if (status === "completed") {
//       const s = await providerAPI.getStats();
//       const w = await walletAPI.getBalance();
//       setStats(s.data.data);
//       setWallet(w.data.data);
//       setCurrentRide(null);
//     }
//   };

//   const verifyOTP = async (rideId, otp) => {
//     const res = await rideAPI.verifyOTP(rideId, otp);
//     setCurrentRide(res.data.ride);
//   };

//   return (
//     <DriverContext.Provider
//       value={{
//         driver,
//         currentRide,
//         stats,
//         wallet,
//         loading,
//         isOnline,
//         loadCurrentRide,
//         toggleDuty,
//         acceptRide,
//         rejectRide,
//         updateRideStatus,
//         verifyOTP,
//       }}
//     >
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

  /* 🔔 AUDIO */
  const ringRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  const hasLoaded = useRef(false);
  const pollingRef = useRef(null);
  const lastRideIdRef = useRef(null);

  /* 🔓 INIT AUDIO (ONCE) */
  useEffect(() => {
    ringRef.current = new Audio("/sounds/gaonConnect.mp3");
    ringRef.current.loop = true;
    ringRef.current.preload = "auto";
  }, []);

  /* 🔓 UNLOCK AUDIO (USER CLICK REQUIRED) */
  const unlockAudio = () => {
    if (!ringRef.current || audioUnlockedRef.current) return;

    ringRef.current
      .play()
      .then(() => {
        ringRef.current.pause();
        ringRef.current.currentTime = 0;
        audioUnlockedRef.current = true;
        console.log("🔓 Audio unlocked");
      })
      .catch(() => {});
  };

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
      const ride = res.data.data;

      // 🔔 New searching ride
      if (
        ride &&
        ride.status === "searching" &&
        ride._id !== lastRideIdRef.current &&
        audioUnlockedRef.current
      ) {
        ringRef.current.play();
        lastRideIdRef.current = ride._id;
      }

      // 🔕 No ride
      if (!ride) {
        ringRef.current.pause();
        ringRef.current.currentTime = 0;
        lastRideIdRef.current = null;
      }

      setCurrentRide(ride);
    } catch (err) {
      if (!silent) console.error(err);
    }
  }, []);

  /* ---------------- INITIAL LOAD ---------------- */
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
    unlockAudio(); // ✅ MOST IMPORTANT LINE

    const res = await providerAPI.toggleDuty();
    setIsOnline(res.data.isOnline);

    if (!res.data.isOnline && ringRef.current) {
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
