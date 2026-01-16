import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";

const DriverMap = ({ pickup, drop, directions }) => {
  return (
    <GoogleMap
      center={pickup}
      zoom={14}
      mapContainerStyle={{ height: "300px", width: "100%" }}
    >
      <Marker position={pickup} label="P" />
      <Marker position={drop} label="D" />
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

export default DriverMap;
