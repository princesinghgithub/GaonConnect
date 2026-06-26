
// import React, { useState } from "react";
// import { Phone, MapPin, Navigation, Clock, AlertCircle, MessageCircle } from "lucide-react";

// const rideSteps = [
//   "Ride Accepted",
//   "Arrived at Pickup",
//   "Ride Started",
//   "Ride Completed",
// ];

// const CurrentRideTab = () => {
//   const [step, setStep] = useState(1);
//   const [showOTP, setShowOTP] = useState(false);

//   const nextStep = () => {
//     if (step === 2) {
//       setShowOTP(true);
//       return;
//     }
    
//     if (step < rideSteps.length) {
//       setStep(step + 1);
//       setShowOTP(false);
//     } else {
//       alert("✅ Ride Completed! Earnings added to wallet.");
//     }
//   };

//   const verifyOTP = () => {
//     alert("✅ OTP Verified! Starting ride...");
//     setStep(3);
//     setShowOTP(false);
//   };

//   return (
//     <div className="space-y-4 pb-20">
      
//       {/* ✅ Status with Progress Bar */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-xl font-bold text-green-600">
//             {rideSteps[step - 1]}
//           </h2>
//           <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
//             Step {step}/4
//           </span>
//         </div>
        
//         {/* Progress Bar */}
//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div 
//             className="bg-green-600 h-2 rounded-full transition-all duration-300"
//             style={{ width: `${(step / 4) * 100}%` }}
//           ></div>
//         </div>
        
//         <p className="text-sm text-gray-500 mt-2">
//           Follow ride instructions carefully
//         </p>
//       </div>

//       {/* ✅ Timer (for active ride) */}
//       {step === 3 && (
//         <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-center gap-3">
//           <Clock className="text-orange-600" size={24} />
//           <div>
//             <p className="font-semibold text-orange-800">Ride in Progress</p>
//             <p className="text-sm text-orange-600">Duration: 12 min 34 sec</p>
//           </div>
//         </div>
//       )}

//       {/* Customer Info */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex justify-between items-start mb-3">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
//               AS
//             </div>
//             <div>
//               <h3 className="font-bold">Amit Sharma</h3>
//               <p className="text-sm text-gray-600">⭐ 4.7 rating</p>
//             </div>
//           </div>
          
//           <div className="flex gap-2">
//             <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow transition">
//               <Phone size={18} />
//             </button>
//             <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition">
//               <MessageCircle size={18} />
//             </button>
//           </div>
//         </div>
        
//         <p className="text-xs text-gray-500">📞 9XXXXXXXXX</p>
//       </div>

//       {/* ✅ OTP Verification (when at pickup) */}
//       {showOTP && (
//         <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl">
//           <div className="flex items-center gap-2 mb-3">
//             <AlertCircle className="text-yellow-600" size={20} />
//             <h4 className="font-bold text-yellow-800">Verify OTP to Start Ride</h4>
//           </div>
          
//           <p className="text-sm text-yellow-700 mb-3">
//             Ask customer for 4-digit OTP
//           </p>
          
//           <div className="flex gap-2 mb-3">
//             <input 
//               type="text" 
//               placeholder="Enter OTP"
//               maxLength="4"
//               className="flex-1 p-3 border-2 border-yellow-400 rounded-lg text-center text-xl font-bold"
//             />
//           </div>
          
//           <button
//             onClick={verifyOTP}
//             className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-bold transition"
//           >
//             Verify & Start Ride
//           </button>
//         </div>
//       )}

//       {/* Pickup & Drop */}
//       <div className="bg-white p-4 rounded-xl shadow space-y-3">
//         <div className="flex gap-3 items-start">
//           <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
//             <MapPin size={16} className="text-green-600" />
//           </div>
//           <div className="flex-1">
//             <p className="text-xs text-gray-500">Pickup Location</p>
//             <p className="font-semibold">Bus Stand, Village Road</p>
//           </div>
//         </div>
        
//         <div className="border-l-2 border-dashed border-gray-300 h-6 ml-4"></div>
        
//         <div className="flex gap-3 items-start">
//           <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
//             <MapPin size={16} className="text-red-600" />
//           </div>
//           <div className="flex-1">
//             <p className="text-xs text-gray-500">Drop Location</p>
//             <p className="font-semibold">Railway Station</p>
//           </div>
//         </div>
        
//         <div className="bg-gray-50 p-3 rounded-lg mt-3">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">Distance:</span>
//             <span className="font-semibold">8.5 km</span>
//           </div>
//           <div className="flex justify-between text-sm mt-1">
//             <span className="text-gray-600">Fare:</span>
//             <span className="font-bold text-green-600">₹135</span>
//           </div>
//           <div className="flex justify-between text-sm mt-1">
//             <span className="text-gray-600">Est. Time:</span>
//             <span className="font-semibold">~15 min</span>
//           </div>
//         </div>
//       </div>

//       {/* Map */}
//       <div className="rounded-xl overflow-hidden shadow-lg">
//         <iframe
//           title="driver-map"
//           src="https://maps.google.com/maps?q=bhopal&t=&z=13&ie=UTF8&iwloc=&output=embed"
//           className="w-full h-64 border-0"
//         />
//       </div>

//       {/* ✅ Navigation Button */}
//       <button
//         onClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=Railway+Station+Bhopal', '_blank')}
//         className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition"
//       >
//         <Navigation size={18} />
//         Open in Google Maps
//       </button>

//       {/* Action Button */}
//       <button
//         onClick={nextStep}
//         className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition text-lg"
//       >
//         {step === 1 && "📍 Arrived at Pickup"}
//         {step === 2 && "🚀 Start Ride"}
//         {step === 3 && "✅ Complete Ride"}
//         {step === 4 && "🏁 Finish Ride"}
//       </button>

//       {/* ✅ Emergency SOS */}
//       <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition">
//         <AlertCircle size={18} />
//         Emergency SOS
//       </button>
//     </div>
//   );
// };

// export default CurrentRideTab;



// import React, { useEffect, useState } from "react";
// import {
//   Phone,
//   MapPin,
//   Navigation,
//   Clock,
//   AlertCircle,
//   MessageCircle,
// } from "lucide-react";
// import { useDriver } from "../context/Drivercontext";

// const rideSteps = [
//   "Ride Accepted",
//   "Arrived at Pickup",
//   "Ride Started",
//   "Ride Completed",
// ];

// const STATUS_STEP_MAP = {
//   accepted: 1,
//   arrived: 2,
//   started: 3,
//   completed: 4,
// };

// const CurrentRideTab = () => {
//   const {
//     currentRide,
//     updateRideStatus,
//     verifyOTP,
//     loadCurrentRide,
//   } = useDriver();

//   const [step, setStep] = useState(1);
//   const [otp, setOtp] = useState("");
//   const [showOTP, setShowOTP] = useState(false);

//   // ✅ Load ride on mount
//   useEffect(() => {
//     loadCurrentRide();
//   }, []);

//   // ✅ Sync backend status → UI step
//   useEffect(() => {
//     if (currentRide?.status) {
//       setStep(STATUS_STEP_MAP[currentRide.status]);
//     }
//   }, [currentRide]);

//   if (!currentRide) {
//     return (
//       <div className="text-center py-10 text-gray-500">
//         🚫 No active ride
//       </div>
//     );
//   }

//   const {
//     _id,
//     customer,
//     pickup,
//     drop,
//     distance,
//     fare,
//     status,
//   } = currentRide;

//   // ---------------- ACTIONS ----------------

//   const handleNext = async () => {
//     if (step === 1) {
//       await updateRideStatus(_id, "arrived");
//     }

//     if (step === 2) {
//       setShowOTP(true);
//       return;
//     }

//     if (step === 3) {
//       await updateRideStatus(_id, "completed");
//     }
//   };

//   const handleVerifyOtp = async () => {
//     await verifyOTP(_id, otp);
//     setOtp("");
//     setShowOTP(false);
//   };

//   // ---------------- UI ----------------

//   return (
//     <div className="space-y-4 pb-20">
//       {/* STATUS */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex justify-between mb-2">
//           <h2 className="text-xl font-bold text-green-600">
//             {rideSteps[step - 1]}
//           </h2>
//           <span className="text-sm bg-green-100 px-3 py-1 rounded-full">
//             Step {step}/4
//           </span>
//         </div>

//         <div className="w-full bg-gray-200 h-2 rounded-full">
//           <div
//             className="bg-green-600 h-2 rounded-full"
//             style={{ width: `${(step / 4) * 100}%` }}
//           />
//         </div>
//       </div>

//       {/* TIMER */}
//       {status === "started" && (
//         <div className="bg-orange-50 border-l-4 border-orange-500 p-4 flex gap-3">
//           <Clock className="text-orange-600" />
//           <div>
//             <p className="font-semibold">Ride in Progress</p>
//             <p className="text-sm text-gray-600">Live tracking enabled</p>
//           </div>
//         </div>
//       )}

//       {/* CUSTOMER */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex justify-between">
//           <div>
//             <h3 className="font-bold">{customer.name}</h3>
//             <p className="text-sm text-gray-500">
//               📞 {customer.mobile}
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <a href={`tel:${customer.mobile}`} className="bg-green-600 p-2 rounded-full text-white">
//               <Phone size={18} />
//             </a>
//             <button className="bg-blue-600 p-2 rounded-full text-white">
//               <MessageCircle size={18} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* OTP */}
//       {showOTP && (
//         <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl">
//           <p className="font-bold mb-2">Enter OTP</p>
//           <input
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             maxLength="4"
//             className="w-full border p-3 rounded-lg text-center text-xl"
//           />
//           <button
//             onClick={handleVerifyOtp}
//             className="w-full mt-3 bg-yellow-600 text-white py-2 rounded-lg"
//           >
//             Verify OTP
//           </button>
//         </div>
//       )}

//       {/* LOCATIONS */}
//       <div className="bg-white p-4 rounded-xl shadow space-y-3">
//         <div className="flex gap-3">
//           <MapPin className="text-green-600" />
//           <div>
//             <p className="text-xs text-gray-500">Pickup</p>
//             <p className="font-semibold">{pickup.address}</p>
//           </div>
//         </div>

//         <div className="flex gap-3">
//           <MapPin className="text-red-600" />
//           <div>
//             <p className="text-xs text-gray-500">Drop</p>
//             <p className="font-semibold">{drop.address}</p>
//           </div>
//         </div>

//         <div className="bg-gray-50 p-3 rounded-lg">
//           <div className="flex justify-between">
//             <span>Distance</span>
//             <span>{distance} km</span>
//           </div>
//           <div className="flex justify-between">
//             <span>Fare</span>
//             <span className="font-bold text-green-600">₹{fare}</span>
//           </div>
//         </div>
//       </div>

//       {/* ACTION BUTTON */}
//       {status !== "completed" && (
//         <button
//           onClick={handleNext}
//           className="w-full bg-green-600 text-white py-4 rounded-xl text-lg"
//         >
//           {step === 1 && "Arrived at Pickup"}
//           {step === 2 && "Start Ride"}
//           {step === 3 && "Complete Ride"}
//         </button>
//       )}

//       {/* SOS */}
//       <button className="w-full bg-red-600 text-white py-3 rounded-xl">
//         <AlertCircle size={18} /> Emergency SOS
//       </button>
//     </div>
//   );
// };

// export default CurrentRideTab;




import React, { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useDriver } from "../context/Drivercontext";

/* ---------------- STEPS ---------------- */
const rideSteps = [
  "Ride Accepted",
  "Arrived at Pickup",
  "Ride Started",
  "Ride Completed",
];

const STATUS_STEP_MAP = {
  accepted: 1,
  arrived: 2,
  started: 3,
  completed: 4,
};

const CurrentRideTab = () => {
  const {
    currentRide,
    loadCurrentRide,
    acceptRide,
    rejectRide,
    updateRideStatus,
    verifyOTP,
    triggerSOS,
  } = useDriver();

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [sosSending, setSosSending] = useState(false);

  const handleSOS = async () => {
    if (sosSending) return;
    setSosSending(true);
    try {
      await triggerSOS(currentRide?._id);
      toast.success("🚨 SOS bhej diya gaya! Help raste mein hai.");
    } catch (err) {
      toast.error("SOS bhejne mein error. Location permission check karo.");
    } finally {
      setSosSending(false);
    }
  };

  /* ---------------- LOAD CURRENT RIDE ---------------- */
  useEffect(() => {
    loadCurrentRide();
  }, []);

  /* ---------------- SYNC STATUS → STEP ---------------- */
  useEffect(() => {
    if (
      currentRide?.status &&
      STATUS_STEP_MAP[currentRide.status]
    ) {
      setStep(STATUS_STEP_MAP[currentRide.status]);
    }
  }, [currentRide]);

  /* ---------------- NO RIDE ---------------- */
  if (!currentRide) {
    return (
      <div className="text-center py-10 text-gray-500">
        🚫 No active ride
      </div>
    );
  }

  const {
    _id,
    customer,
    pickup,
    drop,
    distance,
    fare,
    status,
  } = currentRide;

  /* ====================================================
      🚕 PHASE 1 : INCOMING RIDE (SEARCHING)
     ==================================================== */
  if (status === "searching") {
    return (
      <div className="space-y-4 p-4 pb-20">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold text-orange-600">
            🚕 New Ride Request
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <div>
            <p className="text-xs text-gray-500">Customer</p>
            <p className="font-bold">{customer.name}</p>
            <p className="text-sm">📞 {customer.phone}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="font-semibold">{pickup.address}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Drop</p>
            <p className="font-semibold">{drop.address}</p>
          </div>

          <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
            <span>Distance</span>
            <span>{distance} km</span>
          </div>

          <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
            <span>Fare</span>
            <span className="font-bold text-green-600">
              ₹{fare}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => acceptRide(_id)}
            className="w-full bg-green-600 text-white py-4 rounded-xl text-lg"
          >
            Accept
          </button>

          <button
            onClick={() =>
              rejectRide(_id, "Not available")
            }
            className="w-full bg-red-600 text-white py-4 rounded-xl text-lg"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  /* ====================================================
      🚖 PHASE 2 : ACCEPTED → COMPLETED
     ==================================================== */

  const handleNext = async () => {
    if (step === 1) {
      await updateRideStatus(_id, "arrived");
    }

    if (step === 2) {
      setShowOTP(true);
      return;
    }

    if (step === 3) {
      await updateRideStatus(_id, "completed");
    }
  };

  const handleVerifyOtp = async () => {
    await verifyOTP(_id, otp);
    setOtp("");
    setShowOTP(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* STATUS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-bold text-green-600">
            {rideSteps[step - 1]}
          </h2>
          <span className="text-sm bg-green-100 px-3 py-1 rounded-full">
            Step {step}/4
          </span>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: `${(step / 4) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* TIMER */}
      {status === "started" && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 flex gap-3">
          <Clock className="text-orange-600" />
          <div>
            <p className="font-semibold">
              Ride in Progress
            </p>
            <p className="text-sm text-gray-600">
              Live tracking enabled
            </p>
          </div>
        </div>
      )}

      {/* CUSTOMER */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between">
          <div>
            <h3 className="font-bold">
              {customer.name}
            </h3>
            <p className="text-sm text-gray-500">
              📞 {customer.phone}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="bg-green-600 p-2 rounded-full text-white"
            >
              <Phone size={18} />
            </a>
            <button className="bg-blue-600 p-2 rounded-full text-white">
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* OTP */}
      {showOTP && (
        <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl">
          <p className="font-bold mb-2">
            Enter OTP
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={4}
            className="w-full border p-3 rounded-lg text-center text-xl"
          />
          <button
            onClick={handleVerifyOtp}
            className="w-full mt-3 bg-yellow-600 text-white py-2 rounded-lg"
          >
            Verify OTP
          </button>
        </div>
      )}

      {/* LOCATIONS */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <div className="flex gap-3">
          <MapPin className="text-green-600" />
          <div>
            <p className="text-xs text-gray-500">
              Pickup
            </p>
            <p className="font-semibold">
              {pickup.address}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <MapPin className="text-red-600" />
          <div>
            <p className="text-xs text-gray-500">
              Drop
            </p>
            <p className="font-semibold">
              {drop.address}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between">
            <span>Distance</span>
            <span>{distance} km</span>
          </div>
          <div className="flex justify-between">
            <span>Fare</span>
            <span className="font-bold text-green-600">
              ₹{fare}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON */}
      {status !== "completed" && (
        <button
          onClick={handleNext}
          className="w-full bg-green-600 text-white py-4 rounded-xl text-lg"
        >
          {step === 1 && "Arrived at Pickup"}
          {step === 2 && "Start Ride"}
          {step === 3 && "Complete Ride"}
        </button>
      )}

      {/* SOS */}
      <button
        onClick={handleSOS}
        disabled={sosSending}
        className="w-full bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <AlertCircle size={18} /> {sosSending ? "Sending..." : "Emergency SOS"}
      </button>
    </div>
  );
};

export default CurrentRideTab;
