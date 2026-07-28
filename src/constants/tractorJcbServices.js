// Tractor/JCB service catalogue + rates now come from the backend
// (GET /ride/services/:vehicleType, admin-editable) — see rideAPI.getServices
// used by Gaonconnectlanding.jsx and BookRide.jsx. Only the hour-picker
// options stay here since they're pure UI, not pricing data.
export const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
