export const calculateFare = (service, distance = 10, duration = 2) => {
  if (service.perKm) {
    return service.basePrice + (distance * service.perKm);
  }
  if (service.perHour) {
    return service.basePrice + (duration * service.perHour);
  }
  if (service.perDay) {
    return service.perDay;
  }
  return service.basePrice;
};

export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const generateTrackingId = () => {
  return `TRK${Date.now()}`;
};