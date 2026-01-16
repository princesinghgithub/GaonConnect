import React from 'react';
import { X } from 'lucide-react';
import ProviderCard from './ProviderCard';
import { calculateFare } from '../utils/fareCalculator';

const BookingModal = ({ selectedService, providers, onClose, onBook }) => {
  if (!selectedService) return null;

  const estimatedFare = calculateFare(selectedService);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">{selectedService.name}</h3>
              <p className="text-orange-100">Available providers near you</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-700 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Fare Estimate */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <h4 className="font-bold text-gray-800 mb-2">💰 Estimated Fare</h4>
            <p className="text-3xl font-bold text-blue-600">₹{estimatedFare}</p>
            <p className="text-sm text-gray-600 mt-1">For 10 km journey</p>
          </div>

          {/* Available Providers */}
          {providers
            .filter(p => p.status === 'available')
            .map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onBook={onBook}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;