import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, ChevronDown, Car } from 'lucide-react';
import { rideAPI } from '../services/api';

const statusStyle = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  searching: 'bg-yellow-100 text-yellow-700',
  accepted:  'bg-blue-100 text-blue-700',
  arrived:   'bg-blue-100 text-blue-700',
  started:   'bg-blue-100 text-blue-700',
};

const CustomerHistoryTab = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await rideAPI.getRideHistoryCustomer(page, 10);
      const apiData = res.data;
      setRides(Array.isArray(apiData?.data) ? apiData.data : []);
      setTotalPages(apiData?.totalPages || 1);
    } catch (error) {
      console.error('Ride history fetch error:', error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && rides.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-b-2 rounded-full border-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <h2 className="text-2xl font-bold text-gray-900">Ride History</h2>

      {rides.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <MapPin size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Abhi tak koi ride nahi hai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <RideRow key={ride._id} ride={ride} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-4 py-2 bg-orange-600 text-white rounded-xl">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white border rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const RideRow = ({ ride }) => {
  const [show, setShow] = useState(false);
  const driverName = ride?.provider?.user?.name;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div onClick={() => setShow(!show)} className="cursor-pointer space-y-2">
        <div className="flex justify-between items-start">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={14} />
            {new Date(ride.createdAt).toLocaleString('en-IN')}
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusStyle[ride.status] || 'bg-gray-100 text-gray-700'}`}>
            {ride.status}
          </span>
        </div>

        <div className="flex gap-2 items-start">
          <div className="w-1 bg-green-500 rounded-full self-stretch" />
          <p className="text-sm font-semibold">{ride?.pickup?.address}</p>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-1 bg-red-500 rounded-full self-stretch" />
          <p className="text-sm font-semibold">{ride?.drop?.address}</p>
        </div>

        <div className="flex justify-between border-t pt-2">
          <p className="text-gray-500 text-sm">
            {ride?.distance ? `${ride.distance} km` : ''} {ride?.vehicleType && `• ${ride.vehicleType}`}
          </p>
          <p className="text-orange-600 font-bold">₹{ride?.fare}</p>
        </div>

        <div className="flex justify-center">
          <ChevronDown size={18} className={`transition ${show ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {show && (
        <div className="bg-gray-50 rounded-xl p-3 mt-2 space-y-2">
          <p className="text-sm flex items-center gap-2">
            <Car size={16} /> {driverName ? `Driver: ${driverName}` : 'Driver abhi assign nahi hua'}
          </p>
          <p className="text-sm">Payment: {ride?.paymentMethod} • {ride?.paymentStatus || 'pending'}</p>
          {ride.status === 'cancelled' && ride.cancellationReason && (
            <p className="text-sm text-red-600">Reason: {ride.cancellationReason}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerHistoryTab;
