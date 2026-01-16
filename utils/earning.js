exports.calculateEarning = (fare) => {
  const commissionRate = 0.15; // 15%
  return {
    driverAmount: fare - fare * commissionRate,
    commission: fare * commissionRate
  };
};
