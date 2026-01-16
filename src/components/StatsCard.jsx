import React from 'react';

const StatsCard = ({ label, value, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="inline-flex p-3 rounded-lg bg-green-100 mb-3">
        <Icon size={24} className="text-green-600" />
      </div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
};

export default StatsCard;