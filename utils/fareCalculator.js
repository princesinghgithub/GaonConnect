/**
 * Calculate fare based on distance and vehicle type
 * @param {number} distance - Distance in kilometers
 * @param {string} vehicleType - Type of vehicle (auto, bike, car, etc.)
 * @returns {number} - Calculated fare in rupees
 */
exports.calculateFare = (distance, vehicleType) => {
  // Base fare and per km rate for different vehicle types
  const fareStructure = {
    auto: {
      baseFare: 25,
      perKmRate: 12,
      minimumFare: 30
    },
    bike: {
      baseFare: 20,
      perKmRate: 8,
      minimumFare: 25
    },
    car: {
      baseFare: 50,
      perKmRate: 15,
      minimumFare: 70
    },
    tractor: {
      baseFare: 100,
      perKmRate: 25,
      minimumFare: 150
    },
    tempo: {
      baseFare: 80,
      perKmRate: 20,
      minimumFare: 120
    },
    truck: {
      baseFare: 150,
      perKmRate: 30,
      minimumFare: 200
    },
    jcb: {
      baseFare: 200,
      perKmRate: 40,
      minimumFare: 300
    }
  };

  const rates = fareStructure[vehicleType] || fareStructure.auto;

  let fare = rates.baseFare + (distance * rates.perKmRate);

  // Apply minimum fare
  if (fare < rates.minimumFare) {
    fare = rates.minimumFare;
  }

  // Round to nearest 5
  fare = Math.ceil(fare / 5) * 5;

  return fare;
};

/**
 * Calculate estimated duration based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {number} - Estimated duration in minutes
 */
exports.calculateDuration = (distance) => {
  // Average speed in city: 25 km/h
  const avgSpeed = 25;
  const duration = (distance / avgSpeed) * 60;
  
  // Add buffer time (20%)
  const durationWithBuffer = duration * 1.2;

  return Math.ceil(durationWithBuffer);
};

/**
 * Calculate commission (platform fee)
 * @param {number} fare - Total fare
 * @returns {object} - Commission details
 */
exports.calculateCommission = (fare) => {
  const commissionRate = 0.15; // 15%
  const commission = fare * commissionRate;
  const driverEarnings = fare - commission;

  return {
    fare,
    commission: Math.round(commission),
    driverEarnings: Math.round(driverEarnings),
    commissionRate: commissionRate * 100 // 15%
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};