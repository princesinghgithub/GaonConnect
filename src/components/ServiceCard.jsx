import React from 'react';

const ServiceCard = ({ service, onClick }) => {
  return (
    <button
      onClick={() => onClick(service)}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border-2 border-transparent hover:border-orange-400"
    >
      <div className="text-5xl mb-3">{service.icon}</div>
      <h3 className="font-bold text-gray-800 mb-1">{service.name}</h3>
      <p className="text-sm text-gray-600">₹{service.basePrice}+</p>
    </button>
  );
};

export default ServiceCard;