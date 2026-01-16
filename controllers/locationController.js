// // controllers/locationController.js
// const { Client } = require("@googlemaps/google-maps-services-js");

// const client = new Client({});

// // @desc    Search locations (autocomplete)
// // @route   GET /api/location/search
// // @access  Public
// // exports.searchLocation = async (req, res) => {
// //   try {
// //     const { query, latitude, longitude } = req.query;

// //     if (!query || query.length < 2) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Query must be at least 2 characters"
// //       });
// //     }

// //     const params = {
// //       input: query,
// //       key: process.env.GOOGLE_MAPS_API_KEY,
// //       language: "en",
// //       components: "country:in", // Restrict to India
// //     };

// //     // If user location provided, bias results
// //     if (latitude && longitude) {
// //       params.location = `${latitude},${longitude}`;
// //       params.radius = 50000; // 50km radius
// //     }

// //     const response = await client.placeAutocomplete({
// //       params: params,
// //       timeout: 5000, // 5 seconds
// //     });

// //     if (!response.data.predictions) {
// //       return res.json({
// //         success: true,
// //         data: []
// //       });
// //     }

// //     // Format response similar to Uber
// //     const formattedResults = response.data.predictions.map((prediction) => ({
// //       addressLine1: prediction.structured_formatting.main_text,
// //       addressLine2: prediction.structured_formatting.secondary_text || prediction.description,
// //       categories: prediction.types || ["place"],
// //       confidence: "HIGH",
// //       id: prediction.place_id,
// //       provider: "google_places",
// //       source: "SEARCH",
// //       type: "LOCATION",
// //       fullAddress: prediction.description
// //     }));

// //     res.json({
// //       status: "success",
// //       data: formattedResults
// //     });

// //   } catch (error) {
// //     console.error("Location search error:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to search locations",
// //       error: error.message
// //     });
// //   }
// // };

// // @desc    Get place details by place_id
// // @route   GET /api/location/details/:placeId
// // @access  Public
// // exports.getPlaceDetails = async (req, res) => {
// //   try {
// //     const { placeId } = req.params;

// //     const response = await client.placeDetails({
// //       params: {
// //         place_id: placeId,
// //         key: process.env.GOOGLE_MAPS_API_KEY,
// //         fields: [
// //           "name",
// //           "formatted_address",
// //           "geometry",
// //           "address_components",
// //           "place_id"
// //         ]
// //       },
// //       timeout: 5000,
// //     });

// //     const result = response.data.result;

// //     res.json({
// //       success: true,
// //       data: {
// //         placeId: result.place_id,
// //         name: result.name,
// //         address: result.formatted_address,
// //         location: {
// //           latitude: result.geometry.location.lat,
// //           longitude: result.geometry.location.lng
// //         },
// //         addressComponents: result.address_components
// //       }
// //     });

// //   } catch (error) {
// //     console.error("Place details error:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to get place details",
// //       error: error.message
// //     });
// //   }
// // };

// // @desc    Reverse geocode (get address from coordinates)
// // @route   GET /api/location/reverse
// // @access  Public
// // exports.reverseGeocode = async (req, res) => {
// //   try {
// //     const { latitude, longitude } = req.query;

// //     if (!latitude || !longitude) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Latitude and longitude are required"
// //       });
// //     }

// //     const response = await client.reverseGeocode({
// //       params: {
// //         latlng: `${latitude},${longitude}`,
// //         key: process.env.GOOGLE_MAPS_API_KEY
// //       },
// //       timeout: 5000,
// //     });

// //     if (!response.data.results || response.data.results.length === 0) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No address found for these coordinates"
// //       });
// //     }

// //     const result = response.data.results[0];

// //     res.json({
// //       success: true,
// //       data: {
// //         placeId: result.place_id,
// //         address: result.formatted_address,
// //         location: {
// //           latitude: result.geometry.location.lat,
// //           longitude: result.geometry.location.lng
// //         }
// //       }
// //     });

// //   } catch (error) {
// //     console.error("Reverse geocode error:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to reverse geocode",
// //       error: error.message
// //     });
// //   }
// // };

// // @desc    Calculate distance and duration
// // @route   POST /api/location/distance
// // @access  Public



// // exports.calculateDistance = async (req, res) => {
// //   try {
// //     const { origin, destination, vehicleType = "auto" } = req.body;

// //     if (!origin || !destination) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Origin and destination are required"
// //       });
// //     }

// //     // Set travel mode based on vehicle type
// //     let travelMode = "DRIVING";
// //     if (vehicleType === "bike") {
// //       travelMode = "TWO_WHEELER"; // For bikes
// //     }

// //     const response = await client.distancematrix({
// //       params: {
// //         origins: [`${origin.latitude},${origin.longitude}`],
// //         destinations: [`${destination.latitude},${destination.longitude}`],
// //         key: process.env.GOOGLE_MAPS_API_KEY,
// //         mode: travelMode,
// //         units: "metric"
// //       },
// //       timeout: 5000,
// //     });

// //     const element = response.data.rows[0].elements[0];

// //     if (element.status !== "OK") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Unable to calculate distance"
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: {
// //         distance: {
// //           text: element.distance.text,
// //           value: element.distance.value // meters
// //         },
// //         duration: {
// //           text: element.duration.text,
// //           value: element.duration.value // seconds
// //         },
// //         origin: origin,
// //         destination: destination
// //       }
// //     });

// //   } catch (error) {
// //     console.error("Distance calculation error:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to calculate distance",
// //       error: error.message
// //     });
// //   }
// // };




// // controllers/locationController.js

// // @desc    Search locations (FREE - OpenStreetMap)
// // @route   GET /api/location/search
// // @access  Public
// exports.searchLocation = async (req, res) => {
//   try {
//     const { query, latitude, longitude } = req.query;

//     if (!query || query.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: "Query must be at least 2 characters"
//       });
//     }

//     // ✅ FREE - OpenStreetMap Nominatim API
//     const url = `https://nominatim.openstreetmap.org/search?` +
//       `q=${encodeURIComponent(query)}` +
//       `&format=json` +
//       `&countrycodes=in` +  // India only
//       `&limit=5` +
//       `&addressdetails=1`;

//     const response = await axios.get(url, {
//       timeout: 5000,
//       headers: {
//         'User-Agent': 'GaonConnect/1.0' // Required by OSM
//       }
//     });

//     // Format like Uber response
//     const formattedResults = response.data.map((place) => {
//       const addressParts = place.display_name.split(',');
      
//       return {
//         addressLine1: addressParts[0]?.trim() || place.name,
//         addressLine2: place.display_name,
//         categories: [place.type || "place"],
//         confidence: "MEDIUM",
//         id: place.place_id,
//         provider: "osm",
//         source: "SEARCH",
//         type: "LOCATION",
//         fullAddress: place.display_name,
//         location: {
//           latitude: parseFloat(place.lat),
//           longitude: parseFloat(place.lon)
//         }
//       };
//     });

//     res.json({
//       status: "success",
//       data: formattedResults
//     });

//   } catch (error) {
//     console.error("Location search error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to search locations",
//       error: error.message
//     });
//   }
// };

// // @desc    Reverse geocode (FREE)
// // @route   GET /api/location/reverse
// // @access  Public
// exports.reverseGeocode = async (req, res) => {
//   try {
//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude and longitude required"
//       });
//     }

//     const url = `https://nominatim.openstreetmap.org/reverse?` +
//       `lat=${latitude}` +
//       `&lon=${longitude}` +
//       `&format=json`;

//     const response = await axios.get(url, {
//       timeout: 5000,
//       headers: {
//         'User-Agent': 'GaonConnect/1.0'
//       }
//     });

//     res.json({
//       success: true,
//       data: {
//         address: response.data.display_name,
//         location: {
//           latitude: parseFloat(response.data.lat),
//           longitude: parseFloat(response.data.lon)
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Reverse geocode error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to reverse geocode"
//     });
//   }
// };

// // @desc    Calculate distance (FREE - Haversine Formula)
// // @route   POST /api/location/distance
// // @access  Public
// exports.calculateDistance = async (req, res) => {
//   try {
//     const { origin, destination } = req.body;

//     if (!origin || !destination) {
//       return res.status(400).json({
//         success: false,
//         message: "Origin and destination required"
//       });
//     }

//     // ✅ FREE - Haversine Formula (No API needed)
//     const distance = calculateHaversineDistance(
//       origin.latitude,
//       origin.longitude,
//       destination.latitude,
//       destination.longitude
//     );

//     // Approximate time (assuming 30 km/hr average speed)
//     const durationMinutes = Math.round((distance / 30) * 60);

//     res.json({
//       success: true,
//       data: {
//         distance: {
//           text: `${distance.toFixed(1)} km`,
//           value: Math.round(distance * 1000) // meters
//         },
//         duration: {
//           text: `${durationMinutes} mins`,
//           value: durationMinutes * 60 // seconds
//         }
//       }
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to calculate distance"
//     });
//   }
// };

// // Helper function - Haversine Distance
// function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Earth radius in km
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
  
//   const a = 
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// }

// function toRad(degrees) {
//   return degrees * (Math.PI / 180);
// }















const axios = require('axios');

// @desc    Search locations using OpenStreetMap
// @route   GET /api/location/search
// @access  Public
exports.searchLocation = async (req, res) => {
  try {
    const { query, latitude, longitude } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters"
      });
    }

    console.log('Searching for:', query);

    // OpenStreetMap Nominatim API (FREE)
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&countrycodes=in` +
      `&limit=5` +
      `&addressdetails=1`;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'GaonConnect/1.0'
      }
    });

    console.log('OSM Response:', response.data.length, 'results');

    // Format response (Uber-style)
    const formattedResults = response.data.map((place) => {
      const addressParts = place.display_name.split(',');
      
      return {
        addressLine1: addressParts[0]?.trim() || place.name,
        addressLine2: place.display_name,
        categories: [place.type || "place"],
        confidence: "HIGH",
        id: place.place_id.toString(),
        provider: "osm",
        source: "SEARCH",
        type: "LOCATION",
        fullAddress: place.display_name,
        location: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon)
        }
      };
    });

    res.json({
      status: "success",
      data: formattedResults
    });

  } catch (error) {
    console.error("Location search error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to search locations",
      error: error.message
    });
  }
};

// @desc    Get place details (not really needed for OSM but kept for compatibility)
// @route   GET /api/location/details/:placeId
// @access  Public
exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    const url = `https://nominatim.openstreetmap.org/lookup?` +
      `osm_ids=N${placeId}` +
      `&format=json`;

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'GaonConnect/1.0'
      }
    });

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Place not found"
      });
    }

    const place = response.data[0];

    res.json({
      success: true,
      data: {
        placeId: placeId,
        name: place.name,
        address: place.display_name,
        location: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon)
        }
      }
    });

  } catch (error) {
    console.error("Place details error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get place details"
    });
  }
};

// @desc    Reverse geocode (coordinates to address)
// @route   GET /api/location/reverse
// @access  Public
exports.reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required"
      });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}` +
      `&lon=${longitude}` +
      `&format=json`;

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'GaonConnect/1.0'
      }
    });

    res.json({
      success: true,
      data: {
        placeId: response.data.place_id,
        address: response.data.display_name,
        location: {
          latitude: parseFloat(response.data.lat),
          longitude: parseFloat(response.data.lon)
        }
      }
    });

  } catch (error) {
    console.error("Reverse geocode error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to reverse geocode"
    });
  }
};

// @desc    Calculate distance using Haversine formula
// @route   POST /api/location/distance
// @access  Public
exports.calculateDistance = async (req, res) => {
  try {
    const { origin, destination, vehicleType = "auto" } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination required"
      });
    }

    // Haversine formula
    const distance = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    // Estimate duration (assuming average speed)
    const avgSpeed = vehicleType === 'bike' ? 40 : vehicleType === 'auto' ? 30 : 50; // km/h
    const durationMinutes = Math.round((distance / avgSpeed) * 60);

    res.json({
      success: true,
      data: {
        distance: {
          text: `${distance.toFixed(1)} km`,
          value: Math.round(distance * 1000) // meters
        },
        duration: {
          text: `${durationMinutes} mins`,
          value: durationMinutes * 60 // seconds
        },
        origin: origin,
        destination: destination
      }
    });

  } catch (error) {
    console.error("Distance calculation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to calculate distance"
    });
  }
};

// Helper: Haversine distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // km
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Export all functions
// module.exports = {
//   searchLocation,
//   getPlaceDetails,
//   reverseGeocode,
//   calculateDistance
// };