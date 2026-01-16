import React from 'react';
import { Gift } from 'lucide-react';

const PromoBanner = () => {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1">🎉 First Ride FREE!</h3>
          <p className="text-sm text-green-100">Use code: GAON50 for ₹50 OFF</p>
        </div>
        <Gift size={48} className="opacity-80" />
      </div>
    </div>
  );
};

export default PromoBanner;