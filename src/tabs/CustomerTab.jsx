import React, { useState } from "react";
import CustomerBooking from "./CustomerBooking";
import CustomerSearching from "./CustomerSearching";
import CustomerTracking from "./CustomerTracking";

const CustomerTab = () => {
  const [step, setStep] = useState("booking");
  const [rideData, setRideData] = useState(null);

  if (step === "booking") {
    return (
      <CustomerBooking
        onConfirm={(data) => {
          setRideData(data);
          setStep("searching");
        }}
      />
    );
  }

  if (step === "searching") {
    return (
      <CustomerSearching
        ride={rideData}
        onFound={() => setStep("tracking")}
      />
    );
  }

  return <CustomerTracking ride={rideData} />;
};

export default CustomerTab;
