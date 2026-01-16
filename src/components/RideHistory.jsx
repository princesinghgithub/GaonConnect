import React from 'react';

const RideHistory = ({ rides }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md">
      <h3 className="text-xl font-bold mb-4">📜 Ride History</h3>

      <div className="space-y-3">
        {rides.map((ride, i) => (
          <div
            key={i}
            className="flex justify-between text-sm border-b pb-2"
          >
            <div>
              <p className="font-semibold">{ride.date}</p>
              <p className="text-gray-500">{ride.route}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">₹{ride.fare}</p>
              <p className="text-green-600">{ride.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RideHistory;
