import React from 'react';
import { Navigation, MapPin, Phone, MessageCircle, AlertCircle, Check } from 'lucide-react';
import { PROGRESS_STEPS } from '../utils/constants';

const TrackingTab = ({ tracking, onBackToBooking }) => {
  if (!tracking) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Navigation size={64} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Trips</h3>
        <p className="text-gray-600 mb-6">Book a service to start tracking</p>
        <button
          onClick={onBackToBooking}
          className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
        >
          Book Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Map */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-64 relative flex items-center justify-center">
          <div className="text-white text-center">
            <Navigation size={48} className="mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold">Live Tracking Active</h3>
            <p className="text-blue-100 mt-1">Driver is on the way</p>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Trip Details</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
              In Progress
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pickup</p>
                <p className="font-semibold text-gray-800">{tracking.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <MapPin size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drop</p>
                <p className="font-semibold text-gray-800">{tracking.dropoff}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Driver</p>
                <p className="font-bold text-gray-800">{tracking.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fare</p>
                <p className="font-bold text-orange-600">₹{tracking.fare}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tracking ID</p>
                <p className="font-mono text-sm text-blue-600">{tracking.trackingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ETA</p>
                <p className="font-bold text-green-600">15 mins</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Phone size={20} />
              Call Driver
            </button>
            <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
              <MessageCircle size={20} />
              Chat
            </button>
            <button className="bg-red-100 text-red-600 px-4 rounded-lg hover:bg-red-200 transition">
              <AlertCircle size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Trip Progress */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Trip Progress</h3>
        <div className="space-y-4">
          {PROGRESS_STEPS.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.done ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {step.done ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <span className="text-white text-sm">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${
                  step.done ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-sm text-gray-600">{step.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingTab;