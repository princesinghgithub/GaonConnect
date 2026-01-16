import React, { useEffect, useState } from "react";

const CustomerSearching = ({ ride, onFound }) => {
  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    if (seconds === 0) {
      onFound();
      return;
    }

    const t = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="bg-white p-6 rounded-xl shadow text-center space-y-3">
      <h2 className="font-bold text-xl">Searching for Driver…</h2>

      <p>
        {ride.pickup} → {ride.drop}
      </p>

      <p className="text-orange-600 font-bold">
        Estimated time: {seconds} sec
      </p>

      <div className="animate-spin mx-auto h-10 w-10 border-4 border-orange-500 rounded-full border-b-transparent" />

      <button className="bg-gray-200 px-4 py-2 rounded font-bold">
        Cancel Ride
      </button>
    </div>
  );
};

export default CustomerSearching;
