import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationSearchInput from './LocationSearchInput';
import Map from './Map';
import { locationAPI, rideAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaMotorcycle, FaCarSide } from 'react-icons/fa';
import { MdDirectionsRun } from 'react-icons/md';

const BookRide = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicleType, setVehicleType] = useState('auto');
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

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
        
        // Calculate fare based on vehicle type
        const distanceKm = response.data.data.distance.value / 1000;
        
        const fareConfig = {
          bike: { base: 20, perKm: 8 },
          auto: { base: 50, perKm: 12 },
          car: { base: 80, perKm: 15 }
        };
        
        const config = fareConfig[vehicleType] || fareConfig.auto;
        const calculatedFare = config.base + (distanceKm * config.perKm);
        
        setFare(Math.round(calculatedFare));
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      toast.error('Failed to calculate distance');
    }
  };

  const handleConfirmRide = async () => {
    // Validation
    if (!pickup || !dropoff) {
      toast.error('Please select pickup and drop locations');
      return;
    }

    if (!fare) {
      toast.error('Please wait for fare calculation');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to book a ride');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const rideData = {
        pickup: pickup,
        dropoff: dropoff,
        vehicleType: vehicleType,
        distance: distance,
        estimatedFare: fare,
        paymentMethod: 'cash'
      };

      console.log('Booking ride with data:', rideData);

      const response = await rideAPI.createRide(rideData);

      if (response.data.success) {
        toast.success('Ride booked! Finding nearby drivers...');
        
        // Navigate to ride tracking page
        navigate(`/ride/${response.data.data.ride._id}`);
      }
    } catch (error) {
      console.error('Ride booking error:', error);
      
      if (error.response?.status === 404) {
        toast.error('No drivers available nearby. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to book a ride');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to book ride. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const vehicleOptions = [
    { type: 'bike', icon: <FaMotorcycle />, label: 'Bike' },
    { type: 'auto', icon: <MdDirectionsRun />, label: 'Auto' },
    { type: 'car', icon: <FaCarSide />, label: 'Car' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Book a Ride</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Booking Form */}
          <div className="space-y-6">
            {/* Location Inputs */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Where to?</h3>
              
              <LocationSearchInput
                placeholder="Pickup Location"
                onSelectLocation={handlePickupSelect}
              />

              <LocationSearchInput
                placeholder="Drop Location"
                onSelectLocation={handleDropoffSelect}
              />
            </div>

            {/* Vehicle Type Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Vehicle</h3>
              <div className="grid grid-cols-3 gap-3">
                {vehicleOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setVehicleType(option.type);
                      if (pickup && dropoff) {
                        calculateFare(pickup, dropoff);
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg border-2 transition ${
                      vehicleType === option.type
                        ? 'border-orange-600 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-3xl mb-2">{option.icon}</span>
                    <span className="font-semibold text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance and Fare */}
            {distance && fare && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-semibold text-gray-900">{distance.distance.text}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Estimated Time</span>
                  <span className="font-semibold text-gray-900">{distance.duration.text}</span>
                </div>
                
                <div className="flex justify-between items-center py-4 bg-orange-50 rounded-lg px-4">
                  <span className="text-gray-700 font-semibold">Total Fare</span>
                  <span className="text-3xl font-bold text-orange-600">₹{fare}</span>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmRide}
              disabled={!pickup || !dropoff || loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Booking...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>

          {/* Right Side - Map */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-8" style={{ height: 'fit-content' }}>
            <div className="h-[600px]">
              <Map
                center={
                  pickup?.location 
                    ? [pickup.location.latitude, pickup.location.longitude] 
                    : [20.5937, 78.9629]
                }
                zoom={pickup ? 13 : 5}
                markers={mapMarkers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;