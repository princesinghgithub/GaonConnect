import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rideAPI, ratingAPI } from '../services/api';
import Map from '../tabs/Map';
import { FaSpinner, FaCar, FaPhone, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://gaonconnect-backend.onrender.com/api').replace('/api', '');

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [driverMarker, setDriverMarker] = useState(null);
  const [paying, setPaying] = useState(false);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchRideDetails();
    const interval = setInterval(fetchRideDetails, 6000);

    // Socket.io — real-time driver location
    const token = localStorage.getItem('token');
    const sock = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });
    sock.on('connect', () => {
      sock.emit('join-ride', { rideId });
    });
    sock.on('location_update', ({ lat, lng }) => {
      if (lat && lng) {
        setDriverMarker({ lat, lng, label: '🚗 Driver' });
      }
    });
    sock.on('ride_status_update', ({ status }) => {
      if (status) setRide(prev => prev ? { ...prev, status } : prev);
    });
    socketRef.current = sock;

    return () => {
      clearInterval(interval);
      sock.disconnect();
    };
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



  const updateMapMarkers = () => {
    const markers = [];

    if (ride?.pickup?.coordinates) {
      markers.push({
        lat: ride.pickup.coordinates.latitude,
        lng: ride.pickup.coordinates.longitude,
        label: '🟢 Pickup',
      });
    }

    if (ride?.drop?.coordinates) {
      markers.push({
        lat: ride.drop.coordinates.latitude,
        lng: ride.drop.coordinates.longitude,
        label: '🔴 Drop',
      });
    }

    // Driver's last known location from polling
    const driverLoc = ride?.provider?.currentLocation;
    if (driverLoc?.latitude && driverLoc?.longitude) {
      markers.push({ lat: driverLoc.latitude, lng: driverLoc.longitude, label: '🚗 Driver' });
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

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Razorpay load failed. Check your internet connection.');
        return;
      }

      const orderRes = await rideAPI.createRazorpayOrder(rideId);
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Could not start payment');
        return;
      }
      const { order, key } = orderRes.data;
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const rzp = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'GaonConnect',
        description: 'Ride Fare Payment',
        prefill: { name: user.name, contact: user.phone, email: user.email },
        theme: { color: '#ea580c' },
        handler: async (response) => {
          try {
            const verifyRes = await rideAPI.verifyRazorpayPayment({
              rideId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              toast.success('Payment successful!');
              fetchRideDetails();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            console.error('Verify payment error:', err);
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => toast.error('Payment cancelled'),
        },
      });
      rzp.open();
    } catch (error) {
      console.error('Razorpay order error:', error);
      toast.error(error.response?.data?.message || 'Payment failed to start');
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitRating = async () => {
    if (stars === 0) return;
    setSubmittingRating(true);
    try {
      await ratingAPI.submitRating(rideId, stars, review.trim() || undefined);
      setRatingSubmitted(true);
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Submit rating error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
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
              markers={[
                ...mapMarkers.filter(m => !m.label?.includes('Driver')),
                ...(driverMarker ? [driverMarker] : mapMarkers.filter(m => m.label?.includes('Driver'))),
              ]}
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

            <div className="pt-2 flex justify-between items-center text-sm">
              <span className="text-gray-600">Payment</span>
              <span className="font-semibold text-gray-900">
                {ride.paymentMethod === 'online'
                  ? (ride.paymentStatus === 'paid' ? '✅ Paid Online' : '⏳ Online — Pending')
                  : '💵 Cash'}
              </span>
            </div>
          </div>
        </div>

        {/* Pay Now (online payment due after trip) */}
        {ride.status === 'completed' && ride.paymentMethod === 'online' && ride.paymentStatus !== 'paid' && (
          <button
            onClick={handlePayNow}
            disabled={paying}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            {paying ? 'Opening Payment...' : `Pay ₹${ride.fare} Now`}
          </button>
        )}

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

            {!ratingSubmitted ? (
              <div className="mt-6 bg-white rounded-xl p-5 text-left">
                <p className="font-semibold text-gray-900 mb-3 text-center">Rate your driver</p>
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setStars(s)} className="text-3xl leading-none">
                      <span style={{ color: s <= stars ? '#F5A623' : '#ddd' }}>★</span>
                    </button>
                  ))}
                </div>
                {stars > 0 && (
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share feedback (optional)"
                    maxLength={200}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-3"
                    rows={2}
                  />
                )}
                <button
                  onClick={handleSubmitRating}
                  disabled={stars === 0 || submittingRating}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-green-700 font-semibold">🙏 Thanks for your feedback!</p>
            )}

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