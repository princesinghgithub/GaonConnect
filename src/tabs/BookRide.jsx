import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationSearchInput from './LocationSearchInput';
import Map from './Map';
import { locationAPI, rideAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaMotorcycle, FaCarSide, FaTractor } from 'react-icons/fa';
import { MdDirectionsRun } from 'react-icons/md';
import { GiMineTruck } from 'react-icons/gi';

// ── Tractor / JCB Services ────────────────────────────────────────────────────
const TRACTOR_SERVICES = [
  {
    id: 'farming', label: '🌾 Farming (Khet ka Kaam)', pricingType: 'hourly',
    sub: [
      { id: 'ploughing',    label: 'Ploughing — Hal Chalana',      rate: 800 },
      { id: 'rotavator',   label: 'Rotavator — Jutai',             rate: 900 },
      { id: 'cultivator',  label: 'Cultivator',                    rate: 700 },
      { id: 'seed_drill',  label: 'Seed Drill — Beej Bona',        rate: 700 },
      { id: 'laser',       label: 'Laser Land Leveler',            rate: 1000 },
      { id: 'reaper',      label: 'Reaper — Katai',                rate: 1100 },
      { id: 'thresher',    label: 'Thresher',                      rate: 1000 },
    ],
  },
  {
    id: 'transport', label: '🚛 Transport — Trolley / Dhalai', pricingType: 'per_km',
    sub: [
      { id: 'crop_transport', label: 'Crop / Fasal',               rate: 20 },
      { id: 'sand_brick',     label: 'Sand / Brick — Ret/Eent',    rate: 25 },
      { id: 'goods',          label: 'Goods — Saman Dhona',        rate: 22 },
    ],
  },
  {
    id: 'spraying', label: '💧 Spraying / Dawai', pricingType: 'hourly',
    sub: [
      { id: 'spray',        label: 'Spray — Dawai Chhidkao',       rate: 500 },
      { id: 'grass_cut',    label: 'Grass Cutting',                rate: 600 },
    ],
  },
  {
    id: 'custom', label: '⚙️ Custom / Koi Bhi Kaam', pricingType: 'hourly',
    sub: [{ id: 'custom_request', label: 'Custom Request',         rate: 800 }],
  },
];

const JCB_SERVICES = [
  {
    id: 'construction', label: '🏗️ Construction / Khudai', pricingType: 'hourly',
    sub: [
      { id: 'digging',   label: 'Digging — Khudai',               rate: 1500 },
      { id: 'leveling',  label: 'Leveling — Samatlana',            rate: 1200 },
      { id: 'loading',   label: 'Loading — Maal Uthaana',          rate: 1300 },
      { id: 'construct', label: 'Construction — Nirmaan',          rate: 1400 },
    ],
  },
  {
    id: 'custom', label: '⚙️ Custom / Koi Bhi Kaam', pricingType: 'hourly',
    sub: [{ id: 'custom_request', label: 'Custom Request',        rate: 1500 }],
  },
];

const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

// ── Fare configs (non-tractor/JCB) ───────────────────────────────────────────
const FARE_CONFIG = {
  bike: { base: 20, perKm: 8 },
  auto: { base: 50, perKm: 12 },
  car:  { base: 80, perKm: 15 },
};

// ── Vehicle options ───────────────────────────────────────────────────────────
const VEHICLE_OPTIONS = [
  { type: 'bike',    icon: <FaMotorcycle />,  label: 'Bike',    desc: 'Per km' },
  { type: 'auto',    icon: <MdDirectionsRun />, label: 'Auto',  desc: 'Per km' },
  { type: 'car',     icon: <FaCarSide />,     label: 'Car',     desc: 'Per km' },
  { type: 'tractor', icon: <FaTractor />,     label: 'Tractor', desc: 'Hourly / Per km' },
  { type: 'jcb',     icon: <GiMineTruck />,   label: 'JCB',     desc: 'Per hour' },
];

// ─────────────────────────────────────────────────────────────────────────────

const BookRide = () => {
  const navigate = useNavigate();

  // Carry forward whatever the landing page hero widget already had the
  // user pick (pickup/drop/vehicle) before it bounced them to /auth to log
  // in — otherwise they land here to a blank form and have to redo it all.
  const [initialBooking] = useState(() => {
    try {
      const raw = sessionStorage.getItem('selectedService');
      if (!raw) return null;
      sessionStorage.removeItem('selectedService');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const initialVehicleType = initialBooking?.vehicleType || 'auto';
  const initialIsTractorJcb = initialVehicleType === 'tractor' || initialVehicleType === 'jcb';
  const initialServices = initialVehicleType === 'jcb' ? JCB_SERVICES : TRACTOR_SERVICES;

  // Location
  const [pickup,  setPickup]  = useState(initialBooking?.pickup ?? null);
  const [dropoff, setDropoff] = useState(initialBooking?.drop ?? null);
  const [mapMarkers, setMapMarkers] = useState(() => {
    const markers = [];
    if (initialBooking?.pickup?.location) {
      const { latitude, longitude } = initialBooking.pickup.location;
      markers.push({ lat: latitude, lng: longitude, label: 'Pickup' });
    }
    if (initialBooking?.drop?.location) {
      const { latitude, longitude } = initialBooking.drop.location;
      markers.push({ lat: latitude, lng: longitude, label: 'Drop' });
    }
    return markers;
  });

  // Vehicle
  const [vehicleType, setVehicleType] = useState(initialVehicleType);

  // Tractor / JCB service selection
  const [selectedCategory, setSelectedCategory] = useState(initialIsTractorJcb ? initialServices[0] : null);
  const [selectedSub,      setSelectedSub]      = useState(initialIsTractorJcb ? initialServices[0].sub[0] : null);
  const [selectedHours,    setSelectedHours]    = useState(2);
  const [workNote,         setWorkNote]         = useState('');

  // Distance / Fare
  const [distance, setDistance] = useState(null);
  const [fare,     setFare]     = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // True while a hero-widget booking (bike/auto/car with pickup+drop already
  // picked on the landing page) is being auto-confirmed — Rapido-style,
  // no second form to fill.
  const [autoBooking, setAutoBooking] = useState(false);

  const isTractorJcb = vehicleType === 'tractor' || vehicleType === 'jcb';
  const services     = vehicleType === 'jcb' ? JCB_SERVICES : TRACTOR_SERVICES;
  const isHourly     = selectedCategory?.pricingType === 'hourly';

  // ── Computed fare ───────────────────────────────────────────────────────────
  const calcTractorFare = () => {
    if (!selectedSub) return 0;
    if (isHourly) return selectedHours * selectedSub.rate;
    const km = distance ? distance.distance.value / 1000 : 0;
    return Math.max(Math.ceil(km * selectedSub.rate / 10) * 10, 150);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleVehicleChange = (type) => {
    setVehicleType(type);
    setFare(null);
    setDistance(null);
    setSelectedCategory(null);
    setSelectedSub(null);
    setSelectedHours(2);
    setWorkNote('');

    // Pre-select first category when switching to tractor/jcb
    const svcs = type === 'jcb' ? JCB_SERVICES : TRACTOR_SERVICES;
    if (type === 'tractor' || type === 'jcb') {
      setSelectedCategory(svcs[0]);
      setSelectedSub(svcs[0].sub[0]);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedSub(cat.sub[0]);
    setFare(null);
  };

  const updateMapMarkers = (p, d) => {
    const markers = [];
    if (p?.location)  markers.push({ lat: p.location.latitude,  lng: p.location.longitude,  label: 'Pickup' });
    if (d?.location)  markers.push({ lat: d.location.latitude,  lng: d.location.longitude,  label: 'Drop'   });
    setMapMarkers(markers);
  };

  const calculateFare = async (origin, destination) => {
    if (isTractorJcb && isHourly) return; // hourly: no API call needed
    try {
      const response = await locationAPI.calculateDistance(
        origin.location,
        destination.location,
        vehicleType
      );
      if (response.data.success) {
        setDistance(response.data.data);
        if (!isTractorJcb) {
          const km = response.data.data.distance.value / 1000;
          const cfg = FARE_CONFIG[vehicleType] || FARE_CONFIG.auto;
          setFare(Math.round(cfg.base + km * cfg.perKm));
        }
      }
    } catch {
      toast.error('Distance calculate nahi ho paya');
    }
  };

  const handlePickupSelect = (location) => {
    setPickup(location);
    updateMapMarkers(location, dropoff);
    if (dropoff) calculateFare(location, dropoff);
  };

  const handleDropoffSelect = (location) => {
    setDropoff(location);
    updateMapMarkers(pickup, location);
    if (pickup) calculateFare(pickup, location);
  };

  // Bike/auto/car came from the hero widget with pickup+drop already
  // filled — book it straight away instead of making the user fill the
  // same form again and press Confirm a second time. Tractor/JCB still
  // need a service type picked here (hero doesn't collect that), so those
  // only get prefilled and wait for a manual confirm.
  useEffect(() => {
    const type = initialBooking?.vehicleType;
    const canAutoBook = pickup && dropoff && localStorage.getItem('token') &&
      (type === 'bike' || type === 'auto' || type === 'car');

    if (!canAutoBook) {
      if (pickup && dropoff) calculateFare(pickup, dropoff);
      return;
    }

    let cancelled = false;
    setAutoBooking(true);

    (async () => {
      try {
        const distRes = await locationAPI.calculateDistance(pickup.location, dropoff.location, type);
        if (!distRes.data.success) throw new Error('Distance calculate nahi ho paya');

        const distData = distRes.data.data;
        const km = distData.distance.value / 1000;
        const cfg = FARE_CONFIG[type] || FARE_CONFIG.auto;
        const estimatedFare = Math.round(cfg.base + km * cfg.perKm);
        if (cancelled) return;
        setDistance(distData);
        setFare(estimatedFare);

        const response = await rideAPI.createRide({
          pickup,
          dropoff,
          vehicleType: type,
          bookingMode: 'distance',
          distance: distData.distance,
          estimatedDuration: Math.round(distData.duration.value / 60),
          estimatedFare,
          paymentMethod: 'cash',
        });
        if (cancelled) return;

        if (response.data.success) {
          toast.success('Ride book ho gayi! Driver dhundha ja raha hai...');
          navigate(`/ride/${response.data.data.ride._id}`);
        } else {
          setAutoBooking(false);
        }
      } catch {
        if (cancelled) return;
        toast.error('Auto-booking fail hui, details check karke Confirm Booking dabao');
        setAutoBooking(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const handleConfirmRide = async () => {
    if (!pickup) { toast.error('Pickup location select karo'); return; }
    if (!isTractorJcb && !dropoff) { toast.error('Drop location select karo'); return; }
    if (!localStorage.getItem('token')) {
      toast.error('Login karke booking karo');
      navigate('/login');
      return;
    }
    if (isTractorJcb && (!selectedCategory || !selectedSub)) {
      toast.error('Service type chuniye');
      return;
    }
    if (!isTractorJcb && !fare) {
      toast.error('Fare calculate ho raha hai, thoda ruko');
      return;
    }

    setLoading(true);
    try {
      let rideData;

      if (isTractorJcb) {
        const finalFare = calcTractorFare();
        rideData = {
          pickup: pickup,
          dropoff: dropoff || pickup,
          vehicleType,
          bookingMode:     isHourly ? 'hourly' : 'distance',
          serviceCategory: selectedCategory.id,
          serviceType:     selectedSub.id,
          estimatedHours:  isHourly ? selectedHours : 0,
          hourlyRate:      selectedSub.rate,
          workNote,
          distance:        isHourly ? 0 : (distance ? distance.distance.value / 1000 : 0),
          estimatedDuration: isHourly ? selectedHours * 60 : (distance ? Math.round(distance.duration.value / 60) : 60),
          estimatedFare:   finalFare,
          fare:            finalFare,
          paymentMethod,
        };
      } else {
        rideData = {
          pickup,
          dropoff,
          vehicleType,
          bookingMode:       'distance',
          distance:          distance.distance,
          estimatedDuration: Math.round(distance.duration.value / 60),
          estimatedFare:     fare,
          paymentMethod,
        };
      }

      const response = await rideAPI.createRide(rideData);

      if (response.data.success) {
        toast.success('Ride book ho gayi! Driver dhundha ja raha hai...');
        navigate(`/ride/${response.data.data.ride._id}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Login karke booking karo');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Booking fail ho gayi, dobara try karo');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const displayFare = isTractorJcb ? calcTractorFare() : fare;

  if (autoBooking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <svg className="animate-spin h-12 w-12 text-orange-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900">Aapki ride book ho rahi hai...</h2>
        <p className="text-gray-500 text-sm">
          {pickup?.addressLine1} → {dropoff?.addressLine1}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-4 lg:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Book a Ride</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left: Form ── */}
          <div className="space-y-6">

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Where to?</h3>
              <LocationSearchInput placeholder="Pickup Location" onSelectLocation={handlePickupSelect} value={pickup?.addressLine1 || ''} />
              {(!isTractorJcb || selectedCategory?.pricingType === 'per_km') && (
                <LocationSearchInput placeholder="Drop Location" onSelectLocation={handleDropoffSelect} value={dropoff?.addressLine1 || ''} />
              )}
              {isTractorJcb && selectedCategory?.pricingType === 'hourly' && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  🌾 Field work ke liye sirf pickup location (khet ki jagah) chahiye
                </p>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Vehicle</h3>
              <div className="grid grid-cols-5 gap-2">
                {VEHICLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => handleVehicleChange(opt.type)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border-2 transition ${
                      vehicleType === opt.type
                        ? 'border-orange-600 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{opt.icon}</span>
                    <span className="font-semibold text-xs">{opt.label}</span>
                    <span className="text-gray-400 text-[10px] mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tractor / JCB: Service Selection */}
            {isTractorJcb && (
              <>
                {/* Category */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Kaam ka Prakar Chuniye</h3>
                  <div className="space-y-2">
                    {services.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 font-semibold text-sm transition ${
                          selectedCategory?.id === cat.id
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 text-gray-700'
                        }`}
                      >
                        {cat.label}
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          ({cat.pricingType === 'per_km' ? 'per km' : 'per hour'})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-service */}
                {selectedCategory && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Chuniye</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCategory.sub.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSub(sub)}
                          className={`text-left p-3 rounded-lg border-2 transition ${
                            selectedSub?.id === sub.id
                              ? 'border-blue-900 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className={`text-sm font-700 ${selectedSub?.id === sub.id ? 'text-blue-900' : 'text-gray-600'}`}>
                            {sub.label}
                          </p>
                          <p className="text-orange-600 font-bold text-base mt-1">
                            ₹{sub.rate}
                            <span className="text-gray-400 text-xs font-normal">
                              /{isHourly ? 'hr' : 'km'}
                            </span>
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hours Selection — only for hourly */}
                {isHourly && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Kitne Ghante Chahiye?</h3>
                    <div className="flex flex-wrap gap-2">
                      {HOURS_OPTIONS.map((h) => (
                        <button
                          key={h}
                          onClick={() => setSelectedHours(h)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition ${
                            selectedHours === h
                              ? 'bg-blue-900 border-blue-900 text-white'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="block">{h} {h === 1 ? 'Ghanta' : 'Ghante'}</span>
                          {selectedSub && (
                            <span className="block text-xs opacity-70">₹{h * selectedSub.rate}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Note */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Koi Khaas Baat? <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                  </h3>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-orange-400"
                    rows={3}
                    placeholder="Jaise: 2 bigha khet, subah 8 baje, paani ki zaroorat hai..."
                    value={workNote}
                    onChange={(e) => setWorkNote(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Distance & Fare (non-tractor per-km) */}
            {!isTractorJcb && distance && fare && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Trip Details</h3>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-semibold">{distance.distance.text}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Estimated Time</span>
                  <span className="font-semibold">{distance.duration.text}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-4">
                  <span className="text-gray-700 font-semibold">Total Fare</span>
                  <span className="text-3xl font-bold text-orange-600">₹{fare}</span>
                </div>
              </div>
            )}

            {/* Tractor Fare Summary */}
            {isTractorJcb && selectedSub && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fare Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Service</span>
                    <span className="font-semibold">{selectedSub.label}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-semibold">₹{selectedSub.rate}/{isHourly ? 'hr' : 'km'}</span>
                  </div>
                  {isHourly ? (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Hours</span>
                      <span className="font-semibold">{selectedHours} ghante</span>
                    </div>
                  ) : distance && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-semibold">{distance.distance.text}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-3 mt-2">
                    <span className="font-bold text-gray-800">
                      {isHourly ? 'Estimated Fare' : 'Total Fare'}
                    </span>
                    <span className="text-3xl font-bold text-orange-600">₹{displayFare}</span>
                  </div>
                  {isHourly && (
                    <p className="text-xs text-gray-400 text-center">
                      * Final fare actual ghanton ke hisab se hoga
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'cash',   label: '💵 Cash' },
                  { id: 'online', label: '💳 Pay Online' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center justify-center py-3 px-3 rounded-lg border-2 font-semibold transition ${
                      paymentMethod === pm.id
                        ? 'border-orange-600 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmRide}
              disabled={loading || !pickup || (!isTractorJcb && (!dropoff || !fare))}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Booking...
                </span>
              ) : isTractorJcb ? (
                vehicleType === 'jcb' ? '🚧 JCB Book Karo' : '🚜 Tractor Book Karo'
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>

          {/* ── Right: Map ── */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden sticky top-8" style={{ height: 'fit-content' }}>
            <div className="h-[600px]">
              <Map
                center={
                  pickup?.location
                    ? [pickup.location.latitude, pickup.location.longitude]
                    : [20.5937, 78.9629]
                }
                zoom={pickup ? 13 : 5}
                markers={mapMarkers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;
