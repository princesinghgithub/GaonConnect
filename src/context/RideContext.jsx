import React, { createContext, useContext, useState } from "react";

const RideContext = createContext();

export const RideProvider = ({ children }) => {
  const [currentRide, setCurrentRide] = useState({
    id: "RIDE123",
    customerName: "Rahul Sharma",
    phone: "9876543210",
    pickup: "Bhopal Railway Station",
    drop: "MP Nagar Zone 1",
    fare: 135,
    distance: "8.5 km",
    status: "accepted", // accepted | started | completed
  });

  const startRide = () => {
    setCurrentRide(prev => ({ ...prev, status: "started" }));
  };

  const endRide = () => {
    setCurrentRide(prev => ({ ...prev, status: "completed" }));
    setTimeout(() => setCurrentRide(null), 1500);
  };

  return (
    <RideContext.Provider value={{ currentRide, startRide, endRide }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => useContext(RideContext);
