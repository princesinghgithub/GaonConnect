

// import React, { useState, useEffect } from "react";
// import L from "leaflet";

// const CustomerBooking = ({ onConfirm }) => {
//   const [pickup, setPickup] = useState("");
//   const [drop, setDrop] = useState("");

//   const [pickupLoc, setPickupLoc] = useState(null);
//   const [dropLoc, setDropLoc] = useState(null);

//   const [pickupResults, setPickupResults] = useState([]);
//   const [dropResults, setDropResults] = useState([]);

//   const [vehicle, setVehicle] = useState("Auto");
//   const [distance, setDistance] = useState(0);
//   const [eta, setEta] = useState(0);
//   const [bookingId, setBookingId] = useState(null);

//   const [status, setStatus] = useState("idle"); 
//   // idle → searching → driver_found → tracking

//   const [driverLocation, setDriverLocation] = useState(null);
//   const [mapInstance, setMapInstance] = useState(null);
//   const [driverMarker, setDriverMarker] = useState(null);

//   const pricePerKm = { Bike: 10, Auto: 14, Car: 22 };

//   const searchLocation = async (query, setResults) => {
//     if (!query) return setResults([]);

//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
//     );
//     const data = await res.json();
//     setResults(data);
//   };

//   const calcDistance = (a, b) => {
//     if (!a || !b) return 0;
//     const R = 6371;
//     const dLat = ((b.lat - a.lat) * Math.PI) / 180;
//     const dLon = ((b.lon - a.lon) * Math.PI) / 180;
//     const lat1 = (a.lat * Math.PI) / 180;
//     const lat2 = (b.lat * Math.PI) / 180;

//     const h =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

//     return (R * 2 * Math.asin(Math.sqrt(h))).toFixed(1);
//   };

//   useEffect(() => {
//     if (pickupLoc && dropLoc) {
//       const d = calcDistance(pickupLoc, dropLoc);
//       setDistance(d);
//       setEta(Math.ceil((d / 35) * 60));
//     }
//   }, [pickupLoc, dropLoc]);

//   const fare = Math.round(distance * pricePerKm[vehicle]);

//   // ---------------------------
//   // BOOKING API CALL
//   // ---------------------------
//   const handleConfirm = async () => {
//     if (!pickupLoc || !dropLoc) return alert("Select locations first");

//     setStatus("searching");

//     const res = await fetch("https://your-backend.com/api/bookings", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         pickup,
//         drop,
//         pickupLoc,
//         dropLoc,
//         vehicle,
//         fare,
//       }),
//     });

//     const data = await res.json();
//     setBookingId(data.bookingId);

//     // assume backend now searches driver…
//     // thodi der me driver mil jaata hai
//     setTimeout(() => {
//       setStatus("driver_found");
//       startTrackingDriver(data.bookingId);
//     }, 3000);
//   };

//   // ---------------------------
//   // DRIVER LIVE TRACKING
//   // ---------------------------
//   const startTrackingDriver = (bid) => {
//     setStatus("tracking");

//     // POLLING every 3 sec
//     setInterval(async () => {
//       const res = await fetch(
//         `https://your-backend.com/api/driver-location/${bid}`
//       );
//       const loc = await res.json();
//       setDriverLocation(loc);

//       // map draw/update
//       if (!mapInstance) {
//         const map = L.map("map").setView([loc.lat, loc.lon], 14);
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//           maxZoom: 19,
//         }).addTo(map);
//         setMapInstance(map);

//         const marker = L.marker([loc.lat, loc.lon]).addTo(map);
//         setDriverMarker(marker);
//       } else {
//         driverMarker.setLatLng([loc.lat, loc.lon]);
//       }
//     }, 3000);
//   };

//   return (
//     <div className="bg-white rounded-xl p-6 shadow space-y-6">
//       <h2 className="text-2xl font-bold">Book Ride</h2>

//       {/* PICKUP */}
//       <div className="relative">
//         <input
//           className="border px-4 py-3 rounded w-full"
//           placeholder="Pickup location"
//           value={pickup}
//           onChange={(e) => {
//             setPickup(e.target.value);
//             searchLocation(e.target.value, setPickupResults);
//           }}
//         />
//         {pickupResults.length > 0 && (
//           <div className="absolute bg-white border w-full z-10 max-h-52 overflow-y-auto">
//             {pickupResults.map((p) => (
//               <div
//                 key={p.place_id}
//                 className="p-2 hover:bg-gray-100 cursor-pointer"
//                 onClick={() => {
//                   setPickup(p.display_name);
//                   setPickupLoc({ lat: +p.lat, lon: +p.lon });
//                   setPickupResults([]);
//                 }}
//               >
//                 {p.display_name}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* DROP */}
//       <div className="relative">
//         <input
//           className="border px-4 py-3 rounded w-full"
//           placeholder="Drop location"
//           value={drop}
//           onChange={(e) => {
//             setDrop(e.target.value);
//             searchLocation(e.target.value, setDropResults);
//           }}
//         />
//         {dropResults.length > 0 && (
//           <div className="absolute bg-white border w-full z-10 max-h-52 overflow-y-auto">
//             {dropResults.map((p) => (
//               <div
//                 key={p.place_id}
//                 className="p-2 hover:bg-gray-100 cursor-pointer"
//                 onClick={() => {
//                   setDrop(p.display_name);
//                   setDropLoc({ lat: +p.lat, lon: +p.lon });
//                   setDropResults([]);
//                 }}
//               >
//                 {p.display_name}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* VEHICLE */}
//       <div className="flex gap-3">
//         {Object.keys(pricePerKm).map((v) => (
//           <button
//             key={v}
//             onClick={() => setVehicle(v)}
//             className={`px-4 py-2 rounded border ${
//               vehicle === v ? "bg-orange-500 text-white" : ""
//             }`}
//           >
//             {v}
//           </button>
//         ))}
//       </div>

//       <div className="text-sm text-gray-600 flex justify-between">
//         <span>Distance: {distance} km</span>
//         <span>ETA: {eta} mins</span>
//       </div>

//       <p className="text-2xl font-bold">₹{fare}</p>

//       <button
//         onClick={handleConfirm}
//         className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold"
//       >
//         {status === "searching" ? "Searching Driver..." : "Confirm Ride"}
//       </button>

//       {/* DRIVER STATUS */}
//       {status === "driver_found" && (
//         <p className="text-green-600 font-bold">Driver Found 🚖</p>
//       )}

//       {status === "tracking" && (
//         <>
//           <p className="font-bold">Driver on the way…</p>
//           <div id="map" className="w-full h-72 rounded-lg border" />
//         </>
//       )}
//     </div>
//   );
// };

// export default CustomerBooking;



// // ------------------------with gps----------------------------------------/




// import React, { useState } from "react";

// const CustomerBooking = ({ onConfirm }) => {
//   const [pickup, setPickup] = useState("");
//   const [drop, setDrop] = useState("");
//   const [vehicle, setVehicle] = useState("Auto");
//   const [distance, setDistance] = useState(6); // dummy distance

//   const pricePerKm = { Bike: 10, Auto: 14, Car: 22 };
//   const fare = Math.round(distance * pricePerKm[vehicle]);

//   const handleConfirm = () => {
//     if (!pickup || !drop) {
//       alert("Please enter pickup & drop");
//       return;
//     }

//     onConfirm({
//       pickup,
//       drop,
//       vehicle,
//       distance,
//       fare,
//     });
//   };

//   return (
//     <div className="bg-white p-6 rounded-xl shadow space-y-4">
//       <h2 className="text-2xl font-bold">Book Ride</h2>

//       <input
//         className="border p-2 w-full rounded"
//         placeholder="Pickup Location"
//         value={pickup}
//         onChange={(e) => setPickup(e.target.value)}
//       />

//       <input
//         className="border p-2 w-full rounded"
//         placeholder="Drop Location"
//         value={drop}
//         onChange={(e) => setDrop(e.target.value)}
//       />

//       <div className="flex gap-2">
//         {["Bike", "Auto", "Car"].map((v) => (
//           <button
//             key={v}
//             onClick={() => setVehicle(v)}
//             className={`px-4 py-2 border rounded ${
//               vehicle === v ? "bg-orange-500 text-white" : ""
//             }`}
//           >
//             {v}
//           </button>
//         ))}
//       </div>

//       <p>Distance: {distance} km</p>
//       <p className="text-2xl font-bold">₹{fare}</p>

//       <button
//         onClick={handleConfirm}
//         className="w-full bg-orange-500 text-white py-3 rounded"
//       >
//         Confirm Ride
//       </button>
//     </div>
//   );
// };

// export default CustomerBooking;




// src/components/BookRide.jsx
// import React, { useState } from 'react';
// import LocationSearchInput from './LocationSearchInput';
// import { rideAPI  } from '../services/api';

// const BookRide = () => {
//   const [pickup, setPickup] = useState(null);
//   const [dropoff, setDropoff] = useState(null);
//   const [vehicleType, setVehicleType] = useState('auto');
//   const [distance, setDistance] = useState(null);
//   const [fare, setFare] = useState(null);

//   const handlePickupSelect = (location) => {
//     setPickup(location);
//     if (dropoff) {
//       calculateFare(location, dropoff);
//     }
//   };

//   const handleDropoffSelect = (location) => {
//     setDropoff(location);
//     if (pickup) {
//       calculateFare(pickup, location);
//     }
//   };

//   const calculateFare = async (origin, destination) => {
//     try {
//       const response = await rideAPI .calculateDistance(
//         origin.details.location,
//         destination.details.location,
//         vehicleType
//       );

//       if (response.data.success) {
//         setDistance(response.data.data);
        
//         // Calculate fare based on distance
//         const distanceKm = response.data.data.distance.value / 1000;
//         const baseFare = vehicleType === 'bike' ? 30 : vehicleType === 'auto' ? 50 : 80;
//         const perKm = vehicleType === 'bike' ? 8 : vehicleType === 'auto' ? 12 : 15;
//         const calculatedFare = baseFare + (distanceKm * perKm);
        
//         setFare(Math.round(calculatedFare));
//       }
//     } catch (error) {
//       console.error('Distance calculation error:', error);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
//       <h2 className="text-2xl font-bold mb-6">Book Ride</h2>

//       <div className="space-y-4">
//         <LocationSearchInput
//           placeholder="Pickup Location"
//           onSelectLocation={handlePickupSelect}
//         />

//         <LocationSearchInput
//           placeholder="Drop Location"
//           onSelectLocation={handleDropoffSelect}
//         />

//         {/* Vehicle Type Selection */}
//         <div className="flex space-x-2">
//           {['bike', 'auto', 'car'].map((type) => (
//             <button
//               key={type}
//               onClick={() => {
//                 setVehicleType(type);
//                 if (pickup && dropoff) {
//                   calculateFare(pickup, dropoff);
//                 }
//               }}
//               className={`flex-1 py-2 rounded-lg capitalize ${
//                 vehicleType === type
//                   ? 'bg-orange-600 text-white'
//                   : 'bg-gray-200 text-gray-700'
//               }`}
//             >
//               {type}
//             </button>
//           ))}
//         </div>

//         {/* Distance and Fare */}
//         {distance && (
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <p className="text-sm text-gray-600">Distance: {distance.distance.text}</p>
//             <p className="text-sm text-gray-600">Duration: {distance.duration.text}</p>
//           </div>
//         )}

//         {fare && (
//           <div className="text-center">
//             <p className="text-3xl font-bold text-gray-900">₹{fare}</p>
//           </div>
//         )}

//         <button
//           disabled={!pickup || !dropoff}
//           className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Confirm Ride
//         </button>
//       </div>
//     </div>
//   );
// };

// export default BookRide;



import React, { useState } from 'react';
import LocationSearchInput from './LocationSearchInput';
import Map from './Map';
import { rideAPI  } from '../services/api';
import { locationAPI  } from '../services/api';
import { useNavigate } from 'react-router-dom'; 

const BookRide = () => {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState('auto');
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
   const navigate = useNavigate();

  const handlePickupSelect = (location) => {
    console.log('Pickup selected:', location);
    setPickup(location);
    
    updateMapMarkers(location, dropoff);
    
    if (dropoff) {
      calculateFare(location, dropoff);
    }
  };

  const handleDropoffSelect = (location) => {
    console.log('Dropoff selected:', location);
    setDropoff(location);
    
    updateMapMarkers(pickup, location);
    
    if (pickup) {
      calculateFare(pickup, location);
    }
  };

  const updateMapMarkers = (pickupLoc, dropoffLoc) => {
    const markers = [];
    
    if (pickupLoc?.location) {
      markers.push({
        lat: pickupLoc.location.latitude,
        lng: pickupLoc.location.longitude,
        label: 'Pickup'
      });
    }
    
    if (dropoffLoc?.location) {
      markers.push({
        lat: dropoffLoc.location.latitude,
        lng: dropoffLoc.location.longitude,
        label: 'Drop'
      });
    }
    
    setMapMarkers(markers);
  };

  const calculateFare = async (origin, destination) => {
    try {
      const response = await locationAPI.calculateDistance(
        origin.location,
        destination.location,
        vehicleType
      );

      if (response.data.success) {
        setDistance(response.data.data);
        
        // Calculate fare
        const distanceKm = response.data.data.distance.value / 1000;
        const baseFare = vehicleType === 'bike' ? 30 : vehicleType === 'auto' ? 50 : 80;
        const perKm = vehicleType === 'bike' ? 8 : vehicleType === 'auto' ? 12 : 15;
        const calculatedFare = baseFare + (distanceKm * perKm);
        
        setFare(Math.round(calculatedFare));
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
    }
  };


  const handleConfirmRide = async () => {
  if (!pickup || !dropoff) return;

  try {
    const payload = {
      pickup,
      dropoff,
      vehicleType,
      distance: Number((distance.distance.value / 1000).toFixed(2)), // km
      estimatedDuration: Math.ceil(distance.duration.value / 60),    // minutes

      estimatedFare: fare,
      paymentMethod: 'cash'
    };

    const response = await rideAPI.createRide(payload);

    if (response.data.success) {
      alert('Ride created successfully!');
      // Redirect user to ride status page if needed
      const rideId = response.data.data.ride._id;
        navigate(`/ride/${rideId}`)
    } else {
      alert('Failed to create ride: ' + response.data.message);
    }
  } catch (error) {
    console.error('Create ride error:', error);
    alert('Something went wrong while booking the ride');
  }
};



// const handleConfirmRide = async () => {
//   if (!pickup || !dropoff) return;

//   try {
//     const payload = {
//       pickup,
//       drop: dropoff,  // ✅ FIXED

//       vehicleType,

//       // ✅ FIXED conversions
//       distance: Number((distance.distance.value / 1000).toFixed(2)), // km
//       estimatedDuration: Math.ceil(distance.duration.value / 60),    // minutes

//       fare, 
//       paymentMethod: 'cash'
//     };

//     const response = await rideAPI.createRide(payload);

//     if (response.data.success) {
//       alert('Ride created successfully!');
//     } else {
//       alert('Failed to create ride: ' + response.data.message);
//     }

//   } catch (error) {
//     console.error('Create ride error:', error);
//     alert('Something went wrong while booking the ride');
//   }
// };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Book a Ride</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side - Form */}
        <div className="space-y-4">
          <LocationSearchInput
            placeholder="Pickup Location"
            onSelectLocation={handlePickupSelect}
          />

          <LocationSearchInput
            placeholder="Drop Location"
            onSelectLocation={handleDropoffSelect}
          />

          {/* Vehicle Type */}
          <div className="flex space-x-2">
            {['bike', 'auto', 'car'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setVehicleType(type);
                  if (pickup && dropoff) {
                    calculateFare(pickup, dropoff);
                  }
                }}
                className={`flex-1 py-3 rounded-lg capitalize font-semibold ${
                  vehicleType === type
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Distance and Fare */}
          {distance && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-semibold">{distance.distance.text}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold">{distance.duration.text}</span>
              </div>
            </div>
          )}

          {fare && (
            <div className="bg-orange-50 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Estimated Fare</p>
              <p className="text-4xl font-bold text-orange-600">₹{fare}</p>
            </div>
          )}

          {/* <button
            disabled={!pickup || !dropoff}
            className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Confirm Ride
          </button> */}
          <button
  disabled={!pickup || !dropoff}
  onClick={handleConfirmRide} // ✅ Yaha add karna hai
  className="w-full bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
>
  Confirm Ride
</button>
        </div>

        {/* Right Side - Map */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Map
            center={pickup?.location ? [pickup.location.latitude, pickup.location.longitude] : [20.5937, 78.9629]}
            zoom={pickup ? 13 : 5}
            markers={mapMarkers}
          />
        </div>
      </div>
    </div>
  );
};

export default BookRide;






