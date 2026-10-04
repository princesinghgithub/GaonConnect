// // src/components/LocationSearchInput.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { locationAPI } from '../services/api';
// import { FaMapMarkerAlt, FaSearch, FaSpinner } from 'react-icons/fa';

// const LocationSearchInput = ({ 
//   placeholder = "Search location", 
//   onSelectLocation,
//   value = ""
// }) => {
//   const [query, setQuery] = useState(value);
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [userLocation, setUserLocation] = useState(null);
//   const debounceTimer = useRef(null);

//   // Get user's current location
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setUserLocation({
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//           });
//         },
//         (error) => {
//           console.log('Location permission denied:', error);
//         }
//       );
//     }
//   }, []);

//   // Debounced search
//   useEffect(() => {
//     if (query.length < 2) {
//       setResults([]);
//       return;
//     }

//     // Clear previous timer
//     if (debounceTimer.current) {
//       clearTimeout(debounceTimer.current);
//     }

//     // Set new timer
//     debounceTimer.current = setTimeout(() => {
//       searchLocations(query);
//     }, 300); // 300ms debounce

//     return () => {
//       if (debounceTimer.current) {
//         clearTimeout(debounceTimer.current);
//       }
//     };
//   }, [query]);

//   const searchLocations = async (searchQuery) => {
//     setLoading(true);
//     try {
//       const response = await locationAPI.searchLocation(
//         searchQuery,
//         userLocation?.latitude,
//         userLocation?.longitude
//       );

//       if (response.data.status === 'success') {
//         setResults(response.data.data);
//         setShowDropdown(true);
//       }
//     } catch (error) {
//       console.error('Location search error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectLocation = async (location) => {
//     setQuery(location.addressLine1);
//     setShowDropdown(false);

//     // Get full place details
//     try {
//       const response = await locationAPI.getPlaceDetails(location.id);
      
//       if (response.data.success) {
//         onSelectLocation({
//           ...location,
//           details: response.data.data
//         });
//       }
//     } catch (error) {
//       console.error('Error getting place details:', error);
//       // Still pass the basic location if details fail
//       onSelectLocation(location);
//     }
//   };

//   const handleUseCurrentLocation = async () => {
//     if (!userLocation) {
//       alert('Please enable location access');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await locationAPI.reverseGeocode(
//         userLocation.latitude,
//         userLocation.longitude
//       );

//       if (response.data.success) {
//         setQuery(response.data.data.address);
//         onSelectLocation({
//           addressLine1: 'Current Location',
//           addressLine2: response.data.data.address,
//           id: response.data.data.placeId,
//           details: response.data.data
//         });
//       }
//     } catch (error) {
//       console.error('Reverse geocode error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative">
//       <div className="relative">
//         <input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           onFocus={() => results.length > 0 && setShowDropdown(true)}
//           placeholder={placeholder}
//           className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
//         />
//         <FaSearch className="absolute left-3 top-4 text-gray-400" />
//         {loading && (
//           <FaSpinner className="absolute right-3 top-4 text-gray-400 animate-spin" />
//         )}
//       </div>

//       {/* Dropdown Results */}
//       {showDropdown && results.length > 0 && (
//         <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
//           {/* Current Location Option */}
//           {userLocation && (
//             <button
//               onClick={handleUseCurrentLocation}
//               className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center space-x-3"
//             >
//               <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
//                 <FaMapMarkerAlt className="text-orange-600" />
//               </div>
//               <div>
//                 <p className="font-semibold text-gray-900">Use Current Location</p>
//                 <p className="text-sm text-gray-500">Enable location access</p>
//               </div>
//             </button>
//           )}

//           {/* Search Results */}
//           {results.map((location) => (
//             <button
//               key={location.id}
//               onClick={() => handleSelectLocation(location)}
//               className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
//             >
//               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <FaMapMarkerAlt className="text-gray-600" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-semibold text-gray-900 truncate">
//                   {location.addressLine1}
//                 </p>
//                 <p className="text-sm text-gray-500 truncate">
//                   {location.addressLine2}
//                 </p>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Click outside to close */}
//       {showDropdown && (
//         <div
//           className="fixed inset-0 z-40"
//           onClick={() => setShowDropdown(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default LocationSearchInput;






import React, { useState, useEffect, useRef } from 'react';
import { locationAPI } from '../services/api';
import { FaMapMarkerAlt, FaSearch, FaSpinner } from 'react-icons/fa';

// Backend har failure ko alag code deta hai (503 SEARCH_BUSY, 429 rate limit).
// 401 yahan nahi handle karte — api.js ka interceptor pehle token refresh
// karta hai aur zaroorat padne par hi login par bhejta hai.
const searchErrorMessage = (err) => {
  const status = err?.response?.status;
  if (status === 429) return 'Bahut zyada search. Thodi der baad try karein.';
  if (status === 503) return 'Search abhi busy hai. Thodi der baad try karein.';
  if (err?.code === 'ECONNABORTED') return 'Search mein der ho rahi hai. Dobara try karein.';
  if (!err?.response) return 'Internet connection check karein.';
  return 'Location search abhi kaam nahi kar rahi. Dobara try karein.';
};

const LocationSearchInput = ({ 
  placeholder = "Search location", 
  onSelectLocation,
  value = ""
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  // Pehle har failure sirf console mein jaati thi, isliye search "kuch nahi
  // karti" lagti thi. Ab wajah box ke neeche dikhti hai.
  const [error, setError] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const debounceTimer = useRef(null);
  // Search sirf tab chalti hai jab user ne khud type kiya ho. Pehle `query`
  // ke har badlaav par search chal jaati thi — yaani ek address chunte hi
  // uska dobara search hota aur dropdown apne aap khul jaata, aur prefilled
  // pickup/drop ke saath mount hone par (booking step par wapas aane par)
  // dono box bina wajah khul jaate the.
  const userTypedRef = useRef(false);

  // Get user's current location
  useEffect(() => {
    // navigator.geolocation sirf secure context mein milta hai — https ya
    // localhost. LAN IP (http://192.168.x.x:5173) par ye undefined hota hai.
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        setLocationDenied(true);
      }
    );
  }, []);

  // Debounced search
  useEffect(() => {
    if (!userTypedRef.current) return;
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(query);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const searchLocations = async (searchQuery) => {
    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.searchLocation(
        searchQuery,
        userLocation?.latitude,
        userLocation?.longitude
      );

      if (response.data.status === 'success') {
        setResults(response.data.data);
        setShowDropdown(true);
        if (response.data.data.length === 0) {
          setError('Koi jagah nahi mili. Poora naam ya paas ka gaon/shehar likhein.');
        }
      }
    } catch (err) {
      console.error('Location search error:', err);
      setResults([]);
      setError(searchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    userTypedRef.current = false;
    setQuery(location.addressLine1);
    setShowDropdown(false);
    onSelectLocation(location);
  };

  const handleUseCurrentLocation = async () => {
    if (!userLocation) {
      setError(locationDenied
        ? 'Location permission band hai. Browser settings mein ise allow karein.'
        : 'Location abhi mil rahi hai, ek pal rukein.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await locationAPI.reverseGeocode(
        userLocation.latitude,
        userLocation.longitude
      );

      if (response.data.success) {
        const location = {
          addressLine1: 'Current Location',
          addressLine2: response.data.data.address,
          id: response.data.data.placeId,
          location: response.data.data.location
        };
        userTypedRef.current = false;
        setQuery(location.addressLine1);
        setShowDropdown(false);
        onSelectLocation(location);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setError(searchErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { userTypedRef.current = true; setError(''); setQuery(e.target.value); }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <FaSearch className="absolute left-3 top-4 text-gray-400" />
        {loading && (
          <FaSpinner className="absolute right-3 top-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* "Use Current Location" pehle dropdown ke andar tha, aur dropdown sirf
          results aane par khulta tha — yaani GPS ka rasta tab hi milta jab
          typing search pehle se chal rahi ho. Ab ye box ke neeche hamesha rehta hai. */}
      {!locationDenied && (
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="mt-2 flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50"
        >
          <FaMapMarkerAlt />
          <span>Use Current Location</span>
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Search Results */}
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelectLocation(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {location.addressLine1}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {location.addressLine2}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default LocationSearchInput;