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

const Map = ({ center = [20.5937, 78.9629], zoom = 5, markers = [], route = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      routeLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      markers.forEach((marker) => {
        const leafletMarker = L.marker([marker.lat, marker.lng])
          .bindPopup(marker.label || 'Location');
        markersLayerRef.current.addLayer(leafletMarker);
      });
    }
  }, [markers]);

  // Update route
  useEffect(() => {
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();

      if (route && route.length > 0) {
        const polyline = L.polyline(route, { color: 'blue', weight: 4 });
        routeLayerRef.current.addLayer(polyline);
        mapInstanceRef.current.fitBounds(polyline.getBounds());
      }
    }
  }, [route]);

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
};

export default Map;