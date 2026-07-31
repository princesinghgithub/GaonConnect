exports.calculateEarning = (fare) => {
  const commissionRate = 0; // abhi 0% commission
  return {
    driverAmount: fare - fare * commissionRate,
    commission: fare * commissionRate
  };
};
