import { useState } from 'react';
import { generateTrackingId } from '../utils/fareCalculator';

export const useBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [tracking, setTracking] = useState(null);

  const createBooking = (service, provider, fare) => {
    const newBooking = {
      id: Date.now(),
      service: service.name,
      provider: provider.name,
      status: 'confirmed',
      pickup: 'Current Location',
      dropoff: 'Destination',
      fare: fare,
      time: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      trackingId: generateTrackingId(),
      currentLocation: { lat: 23.2599, lng: 77.4126 }
    };

    setBookings(prev => [...prev, newBooking]);
    setTracking(newBooking);
    return newBooking;
  };

  const startTracking = (booking) => {
    setTracking(booking);
  };

  const clearTracking = () => {
    setTracking(null);
  };

  return {
    bookings,
    tracking,
    createBooking,
    startTracking,
    clearTracking
  };
};