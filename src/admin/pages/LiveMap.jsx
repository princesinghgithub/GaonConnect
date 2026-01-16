import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaCar, FaUser, FaMapMarkerAlt } from 'react-icons/fa';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map center
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const LiveMap = () => {
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [ongoingRides, setOngoingRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLiveData();
    
    // Update every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchLiveData();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchLiveData = async () => {
    try {
      const [driversResponse, ridesResponse] = await Promise.all([
        adminAPI.getActiveDriversLocation(),
        adminAPI.getOngoingRides(),
      ]);

      setActiveDrivers(driversResponse.data.data || []);
      setOngoingRides(ridesResponse.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live data:', error);
      setLoading(false);
    }
  };

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
    if (ride.driver?.location?.coordinates) {
      setMapCenter([
        ride.driver.location.coordinates[1],
        ride.driver.location.coordinates[0],
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Live Tracking</h2>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm font-medium">Active Drivers</span>
              <span className="text-lg font-bold text-green-600">
                {activeDrivers.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm font-medium">Ongoing Rides</span>
              <span className="text-lg font-bold text-blue-600">
                {ongoingRides.length}
              </span>
            </div>
          </div>
        </div>

        {/* Ongoing Rides List */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Ongoing Rides</h3>
          <div className="space-y-2">
            {ongoingRides.map((ride) => (
              <div
                key={ride._id}
                onClick={() => handleRideSelect(ride)}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition ${
                  selectedRide?._id === ride._id ? 'bg-blue-100 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    Ride #{ride._id.slice(-6)}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {ride.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center">
                    <FaUser className="mr-2" />
                    <span>{ride.user?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCar className="mr-2" />
                    <span>
                      {ride.driver?.name} - {ride.driver?.vehicleNumber}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-green-600" />
                    <span className="truncate">{ride.pickup?.address}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-red-600" />
                    <span className="truncate">{ride.dropoff?.address}</span>
                  </div>
                </div>
              </div>
            ))}
            {ongoingRides.length === 0 && (
              <p className="text-center text-gray-500 py-4">No ongoing rides</p>
            )}
          </div>
        </div>

        {/* Active Drivers List */}
        <div className="p-4 border-t">
          <h3 className="text-lg font-semibold mb-3">Active Drivers</h3>
          <div className="space-y-2">
            {activeDrivers.slice(0, 10).map((driver) => (
              <div
                key={driver._id}
                className="p-2 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.vehicleNumber}</p>
                  </div>
                  <div className="text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={mapCenter} />

          {/* Active Drivers Markers */}
          {activeDrivers.map((driver) => {
            if (driver.location?.coordinates) {
              return (
                <Marker
                  key={driver._id}
                  position={[
                    driver.location.coordinates[1],
                    driver.location.coordinates[0],
                  ]}
                  icon={driverIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{driver.name}</h3>
                      <p className="text-sm">Vehicle: {driver.vehicleType}</p>
                      <p className="text-sm">Number: {driver.vehicleNumber}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {driver.currentRide ? 'On Ride' : 'Available'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          {/* Selected Ride Route */}
          {selectedRide && (
            <>
              {/* Pickup Marker */}
              {selectedRide.pickup?.coordinates && (
                <Marker
                  position={[
                    selectedRide.pickup.coordinates[1],
                    selectedRide.pickup.coordinates[0],
                  ]}
                  icon={pickupIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-blue-600">Pickup Location</h3>
                      <p className="text-sm">{selectedRide.pickup.address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Dropoff Marker */}
              {selectedRide.dropoff?.coordinates && (
                <Marker
                  position={[
                    selectedRide.dropoff.coordinates[1],
                    selectedRide.dropoff.coordinates[0],
                  ]}
                  icon={dropoffIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-red-600">Dropoff Location</h3>
                      <p className="text-sm">{selectedRide.dropoff.address}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Line */}
              {selectedRide.pickup?.coordinates &&
                selectedRide.dropoff?.coordinates &&
                selectedRide.driver?.location?.coordinates && (
                  <Polyline
                    positions={[
                      [
                        selectedRide.pickup.coordinates[1],
                        selectedRide.pickup.coordinates[0],
                      ],
                      [
                        selectedRide.driver.location.coordinates[1],
                        selectedRide.driver.location.coordinates[0],
                      ],
                      [
                        selectedRide.dropoff.coordinates[1],
                        selectedRide.dropoff.coordinates[0],
                      ],
                    ]}
                    color="blue"
                    weight={4}
                    opacity={0.6}
                  />
                )}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

// DEFAULT EXPORT - BAHUT IMPORTANT!
export default LiveMap;