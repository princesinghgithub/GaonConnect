import React, { useEffect } from "react";
import L from "leaflet";

const CustomerTracking = ({ ride }) => {
  useEffect(() => {
    const map = L.map("map").setView([23.2599, 77.4126], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    let marker = L.marker([23.2599, 77.4126]).addTo(map);

    let lat = 23.2599;
    let lon = 77.4126;

    const move = setInterval(() => {
      lat += 0.0008;
      lon += 0.0006;

      marker.setLatLng([lat, lon]);
      map.panTo([lat, lon]);
    }, 1500);

    return () => clearInterval(move);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-3">
      <h2 className="font-bold text-xl text-green-600">
        Driver Assigned 🚕
      </h2>

      <p>
        {ride.pickup} → {ride.drop}
      </p>

      <p>Vehicle: {ride.vehicle}</p>
      <p>Fare: ₹{ride.fare}</p>

      <div id="map" className="w-full h-72 rounded border" />
    </div>
  );
};

export default CustomerTracking;
