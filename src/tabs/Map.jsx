import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Rapido jaisa: pickup hara gola, drop laal, driver gaadi — sab ek jaise
// neele pin hon to customer ko pata hi nahi chalta driver kaunsa hai.
const dot = (bg, ring) => L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:${bg};border:4px solid ${ring};box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const ICONS = {
  pickup: dot('#16a34a', '#fff'),
  drop:   dot('#dc2626', '#fff'),
  driver: L.divIcon({
    className: '',
    html: '<div style="width:38px;height:38px;border-radius:50%;background:#111827;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4)">🚗</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  }),
};

/**
 * markers: [{ lat, lng, label, kind?: 'pickup'|'drop'|'driver' }]
 * fit: sab markers ek saath dikhao (center/zoom ki jagah). Sirf tab dobara
 *      fit hota hai jab pickup/drop badle ya marker ginti badle — warna har
 *      poll par customer ka zoom/pan reset ho jaata.
 * height: CSS height (default 400px)
 */
const Map = ({ center = [20.5937, 78.9629], zoom = 5, markers = [], route = [], traffic = [], fit = false, height = '400px', zoomPosition = 'topleft' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const fittedKey = useRef('');
  const lastBounds = useRef(null);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);
      L.control.zoom({ position: zoomPosition }).addTo(mapInstanceRef.current);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      routeLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    // Dabba baad mein bada/chhota hua (100% height, grid, mobile rotate) to
    // Leaflet ko batao — warna kinaron par grey tukde aur fit galat jagah.
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        map.invalidateSize();
        if (lastBounds.current) map.fitBounds(lastBounds.current, { padding: [48, 48], maxZoom: 16 });
      })
      : null;
    ro?.observe(mapRef.current);

    return () => {
      ro?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center — sirf jab sach mein badle (naya array har render par aata hai)
  const lat = center?.[0];
  const lng = center?.[1];
  useEffect(() => {
    if (fit) return;
    if (mapInstanceRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
      mapInstanceRef.current.setView([lat, lng], zoom);
    }
  }, [lat, lng, zoom, fit]);

  // Update markers
  const markerKey = markers.map((m) => `${m.kind || ''}:${m.lat},${m.lng}`).join('|');
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!markersLayerRef.current || !map) return;
    markersLayerRef.current.clearLayers();

    const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    valid.forEach((marker) => {
      const opts = ICONS[marker.kind] ? { icon: ICONS[marker.kind] } : {};
      const leafletMarker = L.marker([marker.lat, marker.lng], opts)
        .bindPopup(marker.label || 'Location');
      markersLayerRef.current.addLayer(leafletMarker);
    });

    // Pickup/drop badle ya naya marker aaya tab hi dobara fit — driver ke har
    // hilne par nahi, warna customer ka zoom baar-baar uchhalta.
    const fitKey = `${valid.length}|${valid.filter((m) => m.kind !== 'driver').map((m) => `${m.lat},${m.lng}`).join(';')}`;
    if (fit && valid.length && fitKey !== fittedKey.current) {
      fittedKey.current = fitKey;
      map.invalidateSize();
      if (valid.length === 1) {
        lastBounds.current = null;
        map.setView([valid[0].lat, valid[0].lng], 15);
      } else {
        lastBounds.current = L.latLngBounds(valid.map((m) => [m.lat, m.lng]));
        map.fitBounds(lastBounds.current, { padding: [48, 48], maxZoom: 16 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, fit]);

  // Update route — sadak ka raasta (Rapido jaisi gehri line). `fit` wale map
  // par markers hi frame tay karte hain, raasta har update par zoom na badle.
  // traffic: [{ speed: 'normal'|'slow'|'jam', points: [{latitude, longitude}] }]
  // — jaam wale hisse upar se peele/laal (Rapido/Google jaisa)
  const routeKey = route && route.length ? `${route.length}:${route[0]}:${route[route.length - 1]}:${(traffic || []).length}` : '';
  useEffect(() => {
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();

      if (route && route.length > 1) {
        const polyline = L.polyline(route, { color: '#1A3A6B', weight: 5, opacity: 0.9 });
        routeLayerRef.current.addLayer(polyline);
        (traffic || []).forEach((s) => {
          if (s?.speed === 'normal' || !Array.isArray(s?.points) || s.points.length < 2) return;
          routeLayerRef.current.addLayer(L.polyline(
            s.points.map((q) => [q.latitude, q.longitude]),
            { color: s.speed === 'jam' ? '#DC2626' : '#F59E0B', weight: 5, opacity: 0.95 },
          ));
        });
        if (!fit) mapInstanceRef.current.fitBounds(polyline.getBounds());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, fit]);

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
};

export default Map;
