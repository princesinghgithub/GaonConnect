import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const RideRequestPopup = ({ ride, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onReject(); // Auto reject
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        
        {/* Timer Bar */}
        <div className="h-2 bg-gray-200 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-1000"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚗</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              New Ride Request!
            </h2>
            <p className="text-gray-600">
              Respond in <span className="font-bold text-red-600">{timeLeft}s</span>
            </p>
          </div>

          {/* Ride Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <FaMapMarkerAlt className="text-green-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Pickup</p>
                <p className="font-semibold text-gray-900">{ride.pickup.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FaMapMarkerAlt className="text-red-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Drop</p>
                <p className="font-semibold text-gray-900">{ride.drop.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-bold text-gray-900">
                  {(ride.distance / 1000).toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fare</p>
                <p className="font-bold text-green-600 text-xl">
                  ₹{ride.fare}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              className="py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideRequestPopup;