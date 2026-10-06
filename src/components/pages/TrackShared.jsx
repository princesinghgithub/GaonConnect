// components/pages/TrackShared.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Family ke liye share kiya hua safar — Rapido/Uber ka "Trip share" jaisa.
// Bina login khulta hai (/track/:token). Backend sirf utna bhejta hai jo
// dekhne ke liye chahiye: haalat, driver ka pehla naam, gaadi ka number,
// driver ki jagah. Phone, OTP, customer ki jaankari nahi.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Car, CheckCircle2, Loader2, MapPin, ShieldCheck, Star, XCircle, CalendarClock } from 'lucide-react';
import { rideAPI } from '../../services/api';
import Map from '../../tabs/Map';

const LIVE = ['scheduled', 'searching', 'accepted', 'arrived', 'started', 'working'];

const STATUS = {
  scheduled: { icon: <CalendarClock />, tone: 'bg-amber-100 text-amber-700', title: 'Pre-booking ho gayi hai' },
  searching: { icon: <Loader2 className="animate-spin" />, tone: 'bg-amber-100 text-amber-700', title: 'Driver dhundha ja raha hai' },
  accepted:  { icon: <Car />, tone: 'bg-green-100 text-green-700', title: 'Driver pickup par aa raha hai' },
  arrived:   { icon: <MapPin />, tone: 'bg-blue-100 text-blue-700', title: 'Driver pickup par pahunch gaya' },
  started:   { icon: <Car />, tone: 'bg-blue-100 text-blue-700', title: 'Safar chal raha hai' },
  working:   { icon: <Car />, tone: 'bg-blue-100 text-blue-700', title: 'Kaam chal raha hai' },
  completed: { icon: <CheckCircle2 />, tone: 'bg-green-100 text-green-700', title: 'Safar poora ho gaya' },
  cancelled: { icon: <XCircle />, tone: 'bg-red-100 text-red-700', title: 'Booking cancel ho gayi' },
};

const TrackShared = () => {
  const { token } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await rideAPI.getSharedRide(token);
      setRide(res.data?.data || null);
      setUpdatedAt(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.status === 410 ? 'Ye safar khatam ho chuka hai.' : 'Ye link sahi nahi hai ya purana ho gaya.');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const live = !ride || LIVE.includes(ride.status);
  useEffect(() => {
    if (!live || error) return undefined;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [live, error, load]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
        <img src="/gaonconnect-icon.png" alt="" className="h-14 w-14 rounded-2xl" />
        <p className="text-lg font-bold text-gray-800">{error}</p>
        <a href="/" className="font-semibold text-orange-600 hover:underline">GaonConnect par jaayein</a>
      </div>
    );
  }
  if (!ride) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-orange-600" /></div>;
  }

  const s = STATUS[ride.status] || STATUS.searching;
  const p = ride.pickup || {};
  const d = ride.drop || {};
  const atSite = ride.workAtPickup || (p.latitude === d.latitude && p.longitude === d.longitude);
  const drv = ride.driver;
  const markers = [
    { lat: p.latitude, lng: p.longitude, kind: 'pickup', label: 'Pickup' },
    ...(!atSite ? [{ lat: d.latitude, lng: d.longitude, kind: 'drop', label: 'Drop' }] : []),
    ...(drv?.location && ['accepted', 'arrived', 'started', 'working'].includes(ride.status)
      ? [{ lat: drv.location.latitude, lng: drv.location.longitude, kind: 'driver', label: drv.name }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:h-screen lg:grid-cols-[1fr_420px]">
      <div className="relative h-[45vh] lg:h-full">
        <Map markers={markers} fit height="100%" zoomPosition="topright" center={[p.latitude || 20.59, p.longitude || 78.96]} zoom={14} />
      </div>
      <div className="relative -mt-6 rounded-t-3xl bg-white px-5 pb-10 pt-6 lg:mt-0 lg:overflow-y-auto lg:rounded-none">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <img src="/gaonconnect-icon.png" alt="" className="h-5 w-5 rounded" /> GaonConnect · share kiya hua safar
        </div>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>{s.icon}</div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{s.title}</h1>
            {updatedAt && live && <p className="mt-1 text-xs text-gray-400">Har 8 second mein taaza · aakhri {updatedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>}
          </div>
        </div>

        {drv && (
          <div className="mt-5 rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-orange-700">{drv.name.charAt(0)}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{drv.name}</p>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" /> {drv.rating || 'Naya driver'}
                </p>
              </div>
            </div>
            {ride.vehicle?.number && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">{[ride.vehicle.color, ride.vehicle.model].filter(Boolean).join(' ') || ride.vehicleType}</span>
                <span className="rounded-md border-2 border-gray-900 bg-yellow-300 px-2 py-0.5 font-mono text-sm font-black tracking-wider">{ride.vehicle.number}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
            <div><p className="text-xs text-gray-400">{atSite ? 'Kaam ki jagah' : 'Pickup'}</p><p className="text-sm font-semibold text-gray-800">{p.address}</p></div>
          </div>
          {!atSite && (
            <div className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
              <div><p className="text-xs text-gray-400">Drop</p><p className="text-sm font-semibold text-gray-800">{d.address}</p></div>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck size={14} /> Mushkil mein: <a href="tel:112" className="font-semibold">112</a>
        </p>
      </div>
    </div>
  );
};

export default TrackShared;
