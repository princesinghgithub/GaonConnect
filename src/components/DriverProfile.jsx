import React from 'react';

const DriverProfile = () => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md">
      <h3 className="text-xl font-bold mb-3">👤 Driver Profile</h3>

      <div className="space-y-2 text-sm text-gray-700">
        <p><strong>Name:</strong> Prince</p>
        <p><strong>Vehicle:</strong> Auto Rickshaw</p>
        <p><strong>Vehicle No:</strong> MP09 AB 1234</p>
        <p>
          <strong>Documents:</strong>{' '}
          <span className="text-green-600 font-bold">Verified ✅</span>
        </p>
      </div>
    </div>
  );
};

export default DriverProfile;
