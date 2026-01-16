// src/components/admin/Rides/RideDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { FaArrowLeft, FaMapMarkerAlt, FaUser, FaCar, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      const response = await adminAPI.getRideDetails();
      setRide(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch ride details');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600">Ride not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/rides')}
          className="text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        <h1 className="text-3xl font-bold">Ride Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Ride Information</h2>
          
          <div className="space-y-3">
            <InfoRow label="Ride ID" value={ride._id} />
            <InfoRow
              label="Status"
              value={<StatusBadge status={ride.status} />}
            />
            <InfoRow
              label="Date"
              value={new Date(ride.createdAt).toLocaleString()}
            />
            <InfoRow label="Vehicle Type" value={ride.vehicleType} />
            <InfoRow label="Distance" value={`${ride.distance} km`} />
            <InfoRow label="Duration" value={`${ride.duration} mins`} />
            <InfoRow label="Fare" value={`₹${ride.fare}`} />
            <InfoRow
              label="Payment Method"
              value={ride.paymentMethod || 'Cash'}
            />
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaUser className="mr-2" />
            User Information
          </h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={ride.user?.profileImage || '/default-avatar.png'}
              alt={ride.user?.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="font-semibold text-lg">{ride.user?.name}</p>
              <p className="text-gray-600">{ride.user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow label="Phone" value={ride.user?.phone} />
            <InfoRow label="User ID" value={ride.user?._id} />
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaCar className="mr-2" />
            Driver Information
          </h2>
          
          {ride.driver ? (
            <>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={ride.driver?.profileImage || '/default-avatar.png'}
                  alt={ride.driver?.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-lg">{ride.driver?.name}</p>
                  <p className="text-gray-600">{ride.driver?.vehicleNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow label="Phone" value={ride.driver?.phone} />
                <InfoRow label="Vehicle Type" value={ride.driver?.vehicleType} />
                <InfoRow
                  label="Rating"
                  value={
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">
                        {ride.driver?.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  }
                />
                <InfoRow label="Driver ID" value={ride.driver?._id} />
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">No driver assigned yet</p>
          )}
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2" />
            Location Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-green-600 mb-1">Pickup Location</p>
              <p className="text-gray-700">{ride.pickup?.address}</p>
              <p className="text-sm text-gray-500">
                Lat: {ride.pickup?.coordinates?.[1]}, Lng:{' '}
                {ride.pickup?.coordinates?.[0]}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-red-600 mb-1">Dropoff Location</p>
              <p className="text-gray-700">{ride.dropoff?.address}</p>
              <p className="text-sm text-gray-500">
                Lat: {ride.dropoff?.coordinates?.[1]}, Lng:{' '}
                {ride.dropoff?.coordinates?.[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Payment Breakdown
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Base Fare</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{ride.pricing?.baseFare || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Distance Charge</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{ride.pricing?.distanceCharge || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Time Charge</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{ride.pricing?.timeCharge || 0}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Fare</span>
              <span className="text-2xl text-blue-600">₹{ride.fare}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Info if cancelled */}
      {ride.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-800 mb-2">
            Cancellation Details
          </h3>
          <div className="space-y-2">
            <InfoRow label="Cancelled By" value={ride.cancelledBy || 'N/A'} />
            <InfoRow
              label="Cancelled At"
              value={new Date(ride.cancelledAt).toLocaleString()}
            />
            <InfoRow
              label="Reason"
              value={ride.cancellationReason || 'No reason provided'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-gray-600">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
};

export default RideDetails;