import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rideAPI } from '../services/api';
import Map from '../tabs/Map';
import { FaSpinner, FaCar, FaPhone, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapMarkers, setMapMarkers] = useState([]);

  useEffect(() => {
    fetchRideDetails();
    
    // Poll for ride updates every 3 seconds
    const interval = setInterval(fetchRideDetails, 3000);
    
    return () => clearInterval(interval);
  }, [rideId]);

  useEffect(() => {
    if (ride) {
      updateMapMarkers();
    }
  }, [ride]);

  const fetchRideDetails = async () => {
    try {
      const response = await rideAPI.getRideById(rideId);
      
      if (response.data.success) {
        setRide(response.data.data);
        
        if (response.data.data.provider) {
          setDriver(response.data.data.provider);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Fetch ride error:', error);
      setLoading(false);
      
      if (error.response?.status === 404) {
        toast.error('Ride not found');
        navigate('/customer');
      }
    }
  };




  const fetchSearchingRides = async () => {
  try {
    const response = await rideAPI.getSearchingRides();

    if (response.data.success) {
      setRideRequests(response.data.data); // list of rides
    }
  } catch (error) {
    console.error("Fetch searching rides error:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchSearchingRides();
}, []);

  const updateMapMarkers = () => {
    const markers = [];
    
    if (ride?.pickup?.coordinates) {
      markers.push({
        lat: ride.pickup.coordinates.latitude,
        lng: ride.pickup.coordinates.longitude,
        label: 'Pickup'
      });
    }
    
    if (ride?.drop?.coordinates) {
      markers.push({
        lat: ride.drop.coordinates.latitude,
        lng: ride.drop.coordinates.longitude,
        label: 'Drop'
      });
    }
    
    setMapMarkers(markers);
  };

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    try {
      await rideAPI.cancelRide(rideId, 'Cancelled by user');
      toast.success('Ride cancelled successfully');
      navigate('/customer');
    } catch (error) {
      console.error('Cancel ride error:', error);
      toast.error('Failed to cancel ride');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-6xl text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-2xl text-gray-600 mb-4">Ride not found</p>
          <button
            onClick={() => navigate('/customer')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Status Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <StatusCard status={ride.status} driver={driver} otp={ride.otp} />
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-96">
            <Map
              center={[
                ride.pickup.coordinates.latitude,
                ride.pickup.coordinates.longitude
              ]}
              zoom={13}
              markers={mapMarkers}
            />
          </div>
        </div>

        {/* Driver Info (if assigned) */}
        {driver && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Driver</h3>
            <DriverCard driver={driver} />
          </div>
        )}

        {/* Ride Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FaMapMarkerAlt className="text-green-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Pickup</p>
                <p className="font-semibold text-gray-900">{ride.pickup.address}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <FaMapMarkerAlt className="text-red-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Drop</p>
                <p className="font-semibold text-gray-900">{ride.drop.address}</p>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-semibold text-gray-900">
                  {(ride.distance / 1000).toFixed(1)} km
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Vehicle Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {ride.vehicleType}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Fare</p>
                <p className="text-2xl font-bold text-orange-600">₹{ride.fare}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {['searching', 'accepted', 'arrived'].includes(ride.status) && (
          <button
            onClick={handleCancelRide}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition"
          >
            Cancel Ride
          </button>
        )}

        {/* Completed/Cancelled Message */}
        {ride.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-2xl font-bold text-green-700 mb-2">Trip Completed! ✅</p>
            <p className="text-gray-700">Thank you for riding with us</p>
            <button
              onClick={() => navigate('/customer')}
              className="mt-4 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {ride.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-2xl font-bold text-red-700 mb-2">Ride Cancelled</p>
            <p className="text-gray-700">Reason: {ride.cancellationReason || 'No reason provided'}</p>
            <button
              onClick={() => navigate('/customer')}
              className="mt-4 px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatusCard = ({ status, driver, otp }) => {
  const statusConfig = {
    searching: {
      color: 'yellow',
      icon: <FaSpinner className="animate-spin" />,
      title: 'Finding Driver...',
      description: 'We are searching for nearby drivers'
    },
    accepted: {
      color: 'green',
      icon: <FaCar />,
      title: 'Driver Accepted!',
      description: 'Your driver is on the way to pickup location'
    },
    arrived: {
      color: 'blue',
      icon: <FaMapMarkerAlt />,
      title: 'Driver Arrived!',
      description: 'Your driver is waiting at pickup location'
    },
    started: {
      color: 'blue',
      icon: <FaCar />,
      title: 'Trip Started',
      description: 'Enjoy your ride!'
    },
    completed: {
      color: 'green',
      icon: '✅',
      title: 'Trip Completed',
      description: 'Thank you for riding with us'
    },
    cancelled: {
      color: 'red',
      icon: '❌',
      title: 'Ride Cancelled',
      description: 'This ride has been cancelled'
    }
  };

  const config = statusConfig[status] || statusConfig.searching;

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${config.color}-100 text-${config.color}-600 text-3xl mb-4`}>
        {config.icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h2>
      <p className="text-gray-600 mb-4">{config.description}</p>
      
      {status === 'arrived' && otp && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-2">Share this OTP with driver</p>
          <p className="text-5xl font-bold text-blue-600 tracking-widest">{otp}</p>
        </div>
      )}
    </div>
  );
};

const DriverCard = ({ driver }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
        {driver.user?.name?.charAt(0) || 'D'}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg text-gray-900">
          {driver.user?.name || 'Driver'}
        </h3>
        <p className="text-sm text-gray-600">
          {driver.vehicle?.type} • {driver.vehicle?.number}
        </p>
        <div className="flex items-center mt-1">
          <FaStar className="text-yellow-500 mr-1 text-sm" />
          <span className="text-sm font-semibold text-gray-700">
            {driver.rating?.average?.toFixed(1) || 'New'}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            ({driver.rating?.count || 0} trips)
          </span>
        </div>
      </div>
      <button className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700 transition shadow-lg">
        <FaPhone />
      </button>
    </div>
  );
};

export default RideTracking;