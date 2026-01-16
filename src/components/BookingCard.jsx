import React from 'react';
import { MapPin } from 'lucide-react';

const BookingCard = ({ booking, onTrack }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-orange-100 p-3 rounded-full">
          <MapPin size={24} className="text-orange-600" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{booking.service}</h4>
          <p className="text-sm text-gray-600">{booking.provider}</p>
          <p className="text-xs text-gray-500">{booking.time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-orange-600">₹{booking.fare}</p>
        <button
          onClick={() => onTrack(booking)}
          className="text-sm text-blue-600 hover:underline mt-1"
        >
          Track →
        </button>
      </div>
    </div>
  );
};

export default BookingCard;