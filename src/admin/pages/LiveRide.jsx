const LiveRide = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow h-[80vh]">
      <h2 className="text-xl font-bold mb-4">Live Ride Tracking</h2>

      <iframe
        title="Live Ride"
        src="https://maps.google.com/maps?q=Goa&t=&z=13&output=embed"
        className="w-full h-full rounded-xl"
      />
    </div>
  );
};

export default LiveRide;
