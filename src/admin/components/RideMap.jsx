import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
  iconSize: [25, 41],
});

const RideMap = ({ pickup, drop }) => {
  const center = pickup
    ? [pickup.lat, pickup.lon]
    : [23.2599, 77.4126]; // default Bhopal

  return (
    <MapContainer center={center} zoom={12} style={{ height: "250px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {pickup && (
        <Marker position={[pickup.lat, pickup.lon]} icon={markerIcon}>
          <Popup>Pickup</Popup>
        </Marker>
      )}

      {drop && (
        <Marker position={[drop.lat, drop.lon]} icon={markerIcon}>
          <Popup>Drop</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RideMap;
