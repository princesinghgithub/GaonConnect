// controllers/locationController.js
// Location search/geocoding OpenStreetMap (Nominatim) se aata hai.
// Saari outbound calls utils/nominatim.js se hoti hain — wahan Redis cache aur
// global 1-req/sec throttle lagi hai, kyunki public Nominatim policy todne par
// server ka IP block ho jaata hai aur poore app ki search ek saath mar jaati hai.
const nominatim = require('../utils/nominatim');

// Nominatim busy hai (queue bhar gayi) — ye server error nahi hai, isliye 503
// bhejo taaki client "dobara try karo" dikha sake, "kuch toot gaya" nahi.
const isBusy = (err) => err && err.code === 'NOMINATIM_BUSY';

const busyResponse = (res) =>
  res.status(503).json({
    success: false,
    message: 'Search abhi busy hai. Thodi der baad try karo.',
    code:    'SEARCH_BUSY',
  });

// ─── GET /api/location/search ────────────────────────────────────────────────
// Free-text location search.
exports.searchLocation = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters',
      });
    }

    const places = await nominatim.search(query, 5);

    const formattedResults = places.map((place) => {
      const addressParts = String(place.display_name || '').split(',');

      return {
        addressLine1: addressParts[0]?.trim() || place.name,
        addressLine2: place.display_name,
        categories:   [place.type || 'place'],
        confidence:   'HIGH',
        id:           String(place.place_id),
        provider:     'osm',
        source:       'SEARCH',
        type:         'LOCATION',
        fullAddress:  place.display_name,
        location: {
          latitude:  parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        },
      };
    });

    return res.json({ status: 'success', data: formattedResults });
  } catch (error) {
    if (isBusy(error)) return busyResponse(res);

    console.error('Location search error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to search locations',
    });
  }
};

// ─── GET /api/location/details/:placeId ──────────────────────────────────────
exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    const results = await nominatim.lookup(`N${placeId}`);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'Place not found' });
    }

    const place = results[0];

    return res.json({
      success: true,
      data: {
        placeId,
        name:    place.name,
        address: place.display_name,
        location: {
          latitude:  parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        },
      },
    });
  } catch (error) {
    if (isBusy(error)) return busyResponse(res);

    console.error('Place details error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get place details' });
  }
};

// ─── GET /api/location/reverse ───────────────────────────────────────────────
// Coordinates → address.
exports.reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required',
      });
    }

    const place = await nominatim.reverse(latitude, longitude);

    return res.json({
      success: true,
      data: {
        placeId: place.place_id,
        address: place.display_name,
        location: {
          latitude:  parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        },
      },
    });
  } catch (error) {
    if (isBusy(error)) return busyResponse(res);

    console.error('Reverse geocode error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to reverse geocode' });
  }
};

// ─── POST /api/location/distance ─────────────────────────────────────────────
// Sadak ki doori + andaazan samay — wahi measureTrip jo kiraya banata hai
// (fare-estimate, createRide). Pehle yahan seedhi doori (haversine) thi:
// website par "Doori 37.8 km" dikhta aur kiraya 46.5 km sadak ka lagta, aur
// km wale kaam (tractor se dhulai) ka kiraya hi seedhi doori se banta tha.
// Routing na chale to measureTrip khud seedhi × 1.25 deta hai.
exports.calculateDistance = async (req, res) => {
  try {
    const { origin, destination, vehicleType = 'auto' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination required',
      });
    }

    const { measureTrip } = require('../utils/routing');
    const trip = await measureTrip(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const distance = Number.isFinite(trip.distance)
      ? trip.distance
      : calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

    const avgSpeed = vehicleType === 'bike' ? 40 : vehicleType === 'auto' ? 30 : 50; // km/h
    const durationMinutes = Math.round((distance / avgSpeed) * 60);

    return res.json({
      success: true,
      data: {
        distance: {
          text:  `${distance.toFixed(1)} km`,
          value: Math.round(distance * 1000), // meters
        },
        duration: {
          text:  `${durationMinutes} mins`,
          value: durationMinutes * 60, // seconds
        },
        origin,
        destination,
      },
    });
  } catch (error) {
    console.error('Distance calculation error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to calculate distance' });
  }
};

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // km
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
