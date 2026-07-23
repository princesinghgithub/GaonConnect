import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://gaonconnect-backend.onrender.com/api').replace('/api', '');

const emoji = (char, label) => L.divIcon({
  html: `<div style="font-size:22px;text-align:center;line-height:1">${char}<div style="font-size:10px;font-weight:700;background:#fff;border-radius:4px;padding:1px 4px;margin-top:2px">${label}</div></div>`,
  className: '', iconAnchor: [16, 16],
});

const CustomerTracking = ({ ride }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const socketRef = useRef(null);
  const [driverPos, setDriverPos] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initLat = ride?.pickup?.lat || 24.53;
    const initLng = ride?.pickup?.lng || 81.3;

    const map = L.map(mapRef.current).setView([initLat, initLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    // Pickup + Drop markers
    if (ride?.pickup?.lat) L.marker([ride.pickup.lat, ride.pickup.lng], { icon: emoji('🟢', 'Pickup') }).addTo(map);
    if (ride?.drop?.lat)   L.marker([ride.drop.lat, ride.drop.lng],     { icon: emoji('🔴', 'Drop')   }).addTo(map);

    // Route dashed line
    if (ride?.pickup?.lat && ride?.drop?.lat) {
      L.polyline([[ride.pickup.lat, ride.pickup.lng], [ride.drop.lat, ride.drop.lng]], {
        color: '#1a3a5c', weight: 3, dashArray: '8 4',
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    // Socket
    const token = localStorage.getItem('token');
    const sock = io(SOCKET_URL, { auth: token ? { token } : undefined, transports: ['websocket'] });
    sock.on('connect', () => {
      if (ride?.rideId || ride?._id) sock.emit('join-ride', { rideId: ride.rideId || ride._id });
    });
    sock.on('location_update', ({ lat, lng }) => {
      if (!lat || !lng) return;
      setDriverPos({ lat, lng });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([lat, lng], { icon: emoji('🚗', 'Driver') }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng([lat, lng]);
      }
      map.panTo([lat, lng], { animate: true, duration: 0.8 });

      // ETA calculation (haversine, 30 km/h avg)
      if (ride?.pickup?.lat) {
        const dLat = ((ride.pickup.lat - lat) * Math.PI) / 180;
        const dLng = ((ride.pickup.lng - lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((ride.pickup.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const mins = Math.round((km / 30) * 60);
        setEta(mins <= 1 ? '1 min' : `~${mins} min`);
      }
    });
    socketRef.current = sock;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      sock.disconnect();
    };
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', margin: 0 }}>Driver aa raha hai 🚗</h2>
        {eta && (
          <span style={{ background: '#fff7e6', color: '#F5A623', fontWeight: 700, fontSize: 13, borderRadius: 20, padding: '4px 12px', border: '1px solid #F5A623' }}>
            {eta} mein
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
        <span style={{ color: '#27ae60', fontWeight: 700 }}>● </span>{ride?.pickup?.address || 'Pickup'}
        <span style={{ margin: '0 8px', color: '#bbb' }}>→</span>
        <span style={{ color: '#e74c3c', fontWeight: 700 }}>● </span>{ride?.drop?.address || 'Drop'}
      </div>

      {!driverPos && (
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8, fontStyle: 'italic' }}>
          Driver ki live location load ho rahi hai…
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: '#555' }}>
        <span>Vehicle: <b>{ride?.vehicle || '—'}</b></span>
        <span>Fare: <b style={{ color: '#F5A623', fontSize: 16 }}>₹{ride?.fare || '—'}</b></span>
      </div>
    </div>
  );
};

export default CustomerTracking;
