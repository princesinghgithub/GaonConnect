import React from 'react';
import { MapPin, Star, Check, Phone } from 'lucide-react';

const ProviderCard = ({ provider, onBook }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-100 hover:border-orange-300 transition">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {provider?.name?.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{provider?.name}</h4>
            <p className="text-sm text-gray-600">{provider?.vehicle}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <Star size={16} fill="currentColor" />
            {provider?.rating}
          </div>
          <p className="text-xs text-gray-500">{provider?.trips} trips</p>
        </div>
      </div>

      {/* Distance & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-orange-600" />
          <span>{provider?.distance} km away</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
          <Check size={16} />
          <span>Available</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onBook(provider)}
          className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition"
        >
          Book Now
        </button>

        <a
          href={`tel:${provider?.phone}`}
          className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
        >
          <Phone size={20} />
        </a>
      </div>

    </div>
  );
};

export default ProviderCard;
