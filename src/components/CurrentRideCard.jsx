import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const CurrentRideCard = ({ ride, onStart, onEnd }) => {
  if (!ride) return null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-600">
      <h3 className="text-xl font-bold mb-3 text-gray-800">
        🚕 Current Ride
      </h3>

      <div className="space-y-2 text-sm text-gray-700">
        <p><strong>Customer:</strong> {ride.customer}</p>
        <p className="flex items-center gap-2">
          <MapPin size={16} /> {ride.pickup} → {ride.drop}
        </p>
        <p><strong>Distance:</strong> {ride.distance} km</p>
        <p><strong>Fare:</strong> ₹{ride.fare}</p>
      </div>

      <div className="flex gap-2 mt-4">
        {!ride.started ? (
          <button
            onClick={onStart}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold"
          >
            Start Ride
          </button>
        ) : (
          <button
            onClick={onEnd}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold"
          >
            End Ride
          </button>
        )}

        <button className="w-12 flex items-center justify-center bg-gray-200 rounded-lg">
          <Phone />
        </button>
      </div>
    </div>
  );
};

export default CurrentRideCard;
