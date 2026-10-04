import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationSearchInput from './LocationSearchInput';
import { VEHICLE_IMAGES, SUB_SERVICE_IMAGES } from '../constants/serviceImages';
import Map from './Map';
import { locationAPI, rideAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FaCarSide, FaTractor, FaTruckPickup } from 'react-icons/fa';
import { MdDirectionsRun } from 'react-icons/md';
import { GiMineTruck } from 'react-icons/gi';
import { HOURS_OPTIONS } from '../constants/tractorJcbServices';
import { trackEvent } from '../utils/analytics';

// Yahan pehle FARE_CONFIG naam ka ek hardcoded rate table tha (bike ₹20 + ₹8/km
// waghera). Wo na admin dashboard se badalta tha, na app ke rate se milta tha —
// yaani ek hi ride ka daam website pe kuch aur dikhta aur book karne par kuch
// aur lagta. Ab kiraya backend hi banata hai, ek hi jagah se.

// ── Vehicle options ───────────────────────────────────────────────────────────
// Bike filhaal band hai — website ki services list se bhi hataayi gayi hai, to
// yahan bhi nahi dikhni chahiye, warna customer wo gaadi book kar leta jo hum
// abhi de nahi rahe. Wapas chaalu karne ke liye: neeche wali line uncomment
// karo, ROAD_VEHICLES mein 'bike' jodo, FaMotorcycle import wapas lao, aur
// serviceImages.js ke LANDING_SERVICES mein bike ki entry daalo.
// { type: 'bike', icon: <FaMotorcycle />, label: 'Bike', desc: 'Per km', tagline: 'Sabse sasta — akele jaana ho to' },
const VEHICLE_OPTIONS = [
  { type: 'auto',    icon: <MdDirectionsRun />, label: 'Auto',    desc: 'Per km',            tagline: '3 log tak, gaon aur sheher dono' },
  { type: 'car',     icon: <FaCarSide />,       label: 'Car',     desc: 'Per km',            tagline: '4 log tak, aaram se aur AC ke saath' },
  { type: 'tempo',   icon: <FaTruckPickup />,   label: 'Tempo / Pickup', desc: 'Per km',     tagline: 'Saamaan, fasal ya ghar ka shifting' },
  { type: 'tractor', icon: <FaTractor />,       label: 'Tractor', desc: 'Hourly / Per km',   tagline: 'Jutai, thresher, dhulai — khet ka har kaam' },
  { type: 'jcb',     icon: <GiMineTruck />,     label: 'JCB',     desc: 'Per hour',          tagline: 'Khudai, leveling aur construction' },
  { type: 'harvester', icon: <FaTractor />,     label: 'Harvester', desc: 'Per acre',        tagline: 'Gehun, dhaan, soyabean ki katai' },
];

// Vehicles jinka kiraya sirf pickup→drop se banta hai. Inka daam ek saath
// mangwa kar dikhaya jaata hai, taki customer compare kar sake.
const ROAD_VEHICLES = ['auto', 'car', 'tempo'];

// Kaam wali gaadiyan — inka kiraya backend ki service list (Rate Card) se
// banta hai: kaam chuno, phir ghante / acre / km. Naam purana rakha hai
// (isTractorOrJcb) taaki baaki file waisi hi padhe; harvester bhi isi raaste.
const WORK_VEHICLES = ['tractor', 'jcb', 'harvester'];
const isTractorOrJcb = (type) => WORK_VEHICLES.includes(type);

// Service ka unit — backend har sub-service par unit bhejta hai (hour, km,
// acre, quintal, job). Purane data mein unit na ho to category se andaaza.
// "either" (ghanta ya acre) website par ghante se hi chalta hai.
const unitOf = (sub, cat) => {
  const u = sub?.unit || (cat?.pricingType === 'per_km' ? 'km' : cat?.pricingType === 'per_acre' ? 'acre' : 'hour');
  return u === 'either' ? 'hour' : u;
};
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 8, 10];
const UNIT_WORD = { hour: 'ghanta', km: 'km', acre: 'acre', quintal: 'quintal', job: 'poora kaam' };

// Rapido jaisa teen-step flow: pehle kahan se kahan, phir gaadi (daam ke
// saath), phir confirm. Pehle sab kuch ek hi lambe form mein tha — customer
// ko pata hi nahi chalta tha ki abhi kya karna hai aur kitna baaki hai.
const STEPS = [
  { id: 1, label: 'Location' },
  { id: 2, label: 'Gaadi' },
  { id: 3, label: 'Confirm' },
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
  // Purani sessionStorage entry aisi gaadi maang sakti hai jo ab hum nahi dete
  // (jaise bike). Aisi soorat mein default par gir jao, warna koi card selected
  // nahi dikhta aur na hi uska daam aata hai.
  const requested = initialBooking?.vehicleType;
  const initialVehicleType = VEHICLE_OPTIONS.some((o) => o.type === requested)
    ? requested
    : 'auto';
  const initialIsTractorJcb = isTractorOrJcb(initialVehicleType);

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

  // Kaun sa step khula hai. Hero widget se aaye log pickup/drop pehle hi
  // bhar chuke hain, unhe wapas step 1 par bhejna dobara wahi kaam karana hai.
  const [step, setStep] = useState(
    initialBooking?.pickup && initialBooking?.drop ? 2 : 1
  );

  // Vehicle
  const [vehicleType, setVehicleType] = useState(initialVehicleType);

  // Step 2 ka daam-list — bike/auto/car ka kiraya ek saath backend se, taki
  // customer ek hi screen par compare karke chun sake (Rapido jaisa).
  const [quotes, setQuotes] = useState({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Tractor / JCB service selection — rates fetched from the backend
  // (admin-editable), same list the hero widget and the app use.
  const [services,         setServices]         = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSub,      setSelectedSub]      = useState(null);
  const [selectedHours,    setSelectedHours]    = useState(initialBooking?.estimatedHours || 2);
  const [workNote,         setWorkNote]         = useState(initialBooking?.workNote || '');
  // Acre / quintal wale kaam (harvester ki katai) — kitna kaam
  const [quantity,         setQuantity]         = useState(initialBooking?.serviceQuantity || 1);
  // False until the initial tractor/jcb services fetch (if any) settles —
  // gates the auto-book effect below so it doesn't fire with an empty
  // selectedCategory/selectedSub before rates have loaded.
  const [servicesReady, setServicesReady] = useState(!initialIsTractorJcb);

  const loadServices = async (type, carryForward) => {
    try {
      const res = await rideAPI.getServices(type);
      const list = res.data?.data || [];
      setServices(list);
      const cat = (carryForward && list.find((c) => c.id === carryForward.categoryId)) || list[0] || null;
      const sub = (carryForward && cat?.sub.find((s) => s.id === carryForward.serviceId)) || cat?.sub?.[0] || null;
      setSelectedCategory(cat);
      setSelectedSub(sub);
    } catch {
      setServices([]);
      setSelectedCategory(null);
      setSelectedSub(null);
    }
  };

  // Initial fetch — if the hero widget already had a category/sub picked,
  // carry it forward (picking Ploughing for someone who chose Spraying
  // would auto-book the wrong job).
  useEffect(() => {
    if (!initialIsTractorJcb) return;
    loadServices(initialVehicleType, {
      categoryId: initialBooking?.serviceCategory,
      serviceId:  initialBooking?.serviceType,
    }).finally(() => setServicesReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Distance / Fare
  const [distance, setDistance] = useState(null);
  const [fare,     setFare]     = useState(null);
  // Backend ka poora hisaab — customer ko dikhana zaroori hai, warna ek number
  // dekhkar bharosa nahi banta.
  const [fareBreakdown, setFareBreakdown] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  // Step 2 → 3 jaate waqt exact kiraya aur doori mangwane ka wait.
  const [pricing, setPricing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // True while a hero-widget booking (bike/auto/car with pickup+drop already
  // picked on the landing page) is being auto-confirmed — Rapido-style,
  // no second form to fill. Computed lazily from initialBooking so the
  // spinner shows on the very first render — starting this at `false` and
  // flipping it inside the effect let the full form flash for one frame
  // before switching over, which looked like a second manual booking step.
  const [autoBooking, setAutoBooking] = useState(() => {
    const type = initialBooking?.vehicleType;
    const isTJ = isTractorOrJcb(type);
    return !!(
      initialBooking?.pickup && initialBooking?.drop &&
      localStorage.getItem('token') &&
      (ROAD_VEHICLES.includes(type) ||
        (isTJ && initialBooking?.serviceCategory && initialBooking?.serviceType))
    );
  });
  // Guards against duplicate rides from a fast double-click/tap: `loading`
  // only disables the button after React re-renders, so two clicks in the
  // same tick can both slip through before that happens. This ref blocks
  // synchronously, the instant the second click is handled.
  const submittingRef = useRef(false);

  const isTractorJcb = isTractorOrJcb(vehicleType);
  const workUnit     = isTractorJcb && selectedSub ? unitOf(selectedSub, selectedCategory) : 'hour';
  const isHourly     = isTractorJcb && workUnit === 'hour';
  const isQuantity   = isTractorJcb && (workUnit === 'acre' || workUnit === 'quintal');
  // Khet/site ke kaam (jutai, khudai, katai) ki koi drop location hoti hi
  // nahi — gaadi wahin kaam karti hai. Sirf saamaan dhona km se chalta hai.
  const needsDropoff = !isTractorJcb || workUnit === 'km';

  // ── Computed fare ───────────────────────────────────────────────────────────
  const calcTractorFare = () => {
    if (!selectedSub) return 0;
    if (isHourly) return selectedHours * selectedSub.rate;
    if (isQuantity) return Math.max(quantity, 1) * selectedSub.rate;
    if (workUnit === 'job') return selectedSub.rate;
    const km = distance ? distance.distance.value / 1000 : 0;
    // Sirf dikhane ka andaaza — booking pe backend ka hisaab hi chalta hai.
    // Minimum yahan se hata diya: wo ab admin ki setting hai, code mein likha
    // hua ₹150 nahi.
    return Math.ceil(km * selectedSub.rate / 10) * 10;
  };

  // Tractor ke andar thresher ka kaam — booking sirf thresher wale tractor ko
  // jaani chahiye, aur driver ko note mein saaf dikhe ki thresher leke aana hai.
  const workExtras = (sub, note) => {
    const isThreshing = sub?.id === 'threshing';
    return {
      workNote: isThreshing ? ['Thresher leke aana hai', note].filter(Boolean).join(' — ') : note,
      ...(isThreshing ? { equipment: ['thresher'] } : {}),
    };
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleVehicleChange = (type) => {
    setVehicleType(type);
    setFare(null);
    setFareBreakdown([]);
    setDistance(null);
    setSelectedCategory(null);
    setSelectedSub(null);
    setSelectedHours(2);
    setQuantity(1);
    setWorkNote('');

    // Fetch rates + pre-select first category when switching to tractor/jcb
    if (isTractorOrJcb(type)) {
      loadServices(type);
    } else {
      setServices([]);
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
          // Fare backend se — wahi hisaab jo app mein aur booking ke waqt
          // lagta hai, poore breakdown ke saath.
          const est = await rideAPI.getFareEstimate({
            pickupLat: origin.location.latitude,
            pickupLng: origin.location.longitude,
            dropLat:   destination.location.latitude,
            dropLng:   destination.location.longitude,
            vehicleType,
          });

          const d = est?.data?.data;
          if (typeof d?.totalFare === 'number') {
            setFare(d.totalFare);
            setFareBreakdown(Array.isArray(d.breakdown) ? d.breakdown : []);
          }
        }
      }
    } catch {
      toast.error('Distance calculate nahi ho paya');
    }
  };

  const handlePickupSelect = (location) => {
    setPickup(location);
    updateMapMarkers(location, dropoff);
    // Location badalne par purana kiraya jhoota ho jaata hai — usse dikhate
    // rehna customer ko galat daam dikhana hai.
    setQuotes({});
    setFare(null);
    setFareBreakdown([]);
    setDistance(null);
  };

  const handleDropoffSelect = (location) => {
    setDropoff(location);
    updateMapMarkers(pickup, location);
    setQuotes({});
    setFare(null);
    setFareBreakdown([]);
    setDistance(null);
  };

  // ── Step navigation ─────────────────────────────────────────────────────────

  // Bike/auto/car ka kiraya ek saath — teeno ka daam ek hi list mein dikhega,
  // isliye customer ko har gaadi par tap karke wapas aana nahi padta.
  const loadQuotes = async (origin, destination) => {
    if (!origin?.location || !destination?.location) return;
    setQuotesLoading(true);
    const params = {
      pickupLat: origin.location.latitude,
      pickupLng: origin.location.longitude,
      dropLat:   destination.location.latitude,
      dropLng:   destination.location.longitude,
    };
    const results = await Promise.all(
      ROAD_VEHICLES.map((type) =>
        rideAPI
          .getFareEstimate({ ...params, vehicleType: type })
          .then((res) => [type, res?.data?.data?.totalFare ?? null])
          // Ek gaadi ka rate na aaye to baaki do to dikhne chahiye —
          // isliye har call apni galti khud sambhalti hai.
          .catch(() => [type, null])
      )
    );
    setQuotes(Object.fromEntries(results));
    setQuotesLoading(false);
  };

  const goToVehicleStep = () => {
    if (!pickup) { toast.error('Pickup location select karo'); return; }
    trackEvent('booking_step_view', { step: 'vehicle' });
    setStep(2);
    if (dropoff) loadQuotes(pickup, dropoff);
  };

  const goToConfirmStep = async () => {
    if (isTractorJcb && (!selectedCategory || !selectedSub)) {
      toast.error('Kaam aur service chuniye');
      return;
    }
    if (needsDropoff && !dropoff) {
      toast.error('Drop location select karo');
      return;
    }

    // Yahan tak aakar hi exact kiraya mangwate hain — step 2 ki list andaaza
    // hai, confirm screen par wahi number dikhna chahiye jo charge hoga.
    if (needsDropoff && pickup && dropoff) {
      setPricing(true);
      await calculateFare(pickup, dropoff);
      setPricing(false);
    }
    trackEvent('booking_step_view', { step: 'confirm', vehicle_type: vehicleType });
    setStep(3);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // Every vehicle type coming from the hero widget already has pickup+drop
  // (and for tractor/jcb, a service already picked there too) — book it
  // straight away instead of making the user fill the same form again and
  // press Confirm a second time. Gated on servicesReady so tractor/jcb
  // doesn't fire before the rates fetch above has set selectedCategory/Sub.
  useEffect(() => {
    const type = initialBooking?.vehicleType;
    const isTJ = isTractorOrJcb(type);
    const canAutoBook = pickup && dropoff && localStorage.getItem('token') &&
      (ROAD_VEHICLES.includes(type) ||
        (isTJ && selectedCategory && selectedSub));

    if (!canAutoBook) {
      // Hero widget se aaye bina auto-book ke (ya seedha /customer khola) —
      // step 2 par gaadi ki list bharni hai.
      if (pickup && dropoff) loadQuotes(pickup, dropoff);
      return;
    }

    let cancelled = false;
    setAutoBooking(true);

    (async () => {
      try {
        let rideData;

        if (isTJ) {
          const unit = unitOf(selectedSub, selectedCategory);
          const hourly = unit === 'hour';
          const byQty = unit === 'acre' || unit === 'quintal';
          const qty = Math.max(Number(initialBooking?.serviceQuantity) || 1, 1);
          let distData = null;
          if (unit === 'km') {
            const distRes = await locationAPI.calculateDistance(pickup.location, dropoff.location, type);
            if (!distRes.data.success) throw new Error('Distance calculate nahi ho paya');
            distData = distRes.data.data;
          }
          const km = distData ? distData.distance.value / 1000 : 0;
          const finalFare = hourly ? selectedHours * selectedSub.rate
            : byQty ? qty * selectedSub.rate
            : unit === 'job' ? selectedSub.rate
            : Math.ceil(km * selectedSub.rate / 10) * 10;
          if (cancelled) return;
          if (distData) setDistance(distData);

          rideData = {
            pickup,
            // Khet ke kaam mein drop nahi hota — kaam ki jagah hi bhejte hain
            dropoff: unit === 'km' ? dropoff : pickup,
            vehicleType: type,
            bookingMode:       hourly ? 'hourly' : 'distance',
            serviceCategory:   selectedCategory.id,
            serviceType:       selectedSub.id,
            estimatedHours:    hourly ? selectedHours : 0,
            serviceQuantity:   byQty ? qty : 0,
            hourlyRate:        selectedSub.rate,
            ...workExtras(selectedSub, workNote),
            distance:          km,
            estimatedDuration: hourly ? selectedHours * 60 : (distData ? Math.round(distData.duration.value / 60) : 60),
            estimatedFare:     finalFare,
            fare:              finalFare,
            paymentMethod:     'cash',
          };
        } else {
          const distRes = await locationAPI.calculateDistance(pickup.location, dropoff.location, type);
          if (!distRes.data.success) throw new Error('Distance calculate nahi ho paya');

          const distData = distRes.data.data;
          if (cancelled) return;
          setDistance(distData);

          // Backend hi kiraya batata hai. `estimatedFare` sirf dikhane ke liye
          // jaata hai — ride banate waqt server dobara khud calculate karta hai,
          // isliye client se bheja hua number kabhi charge nahi hota.
          const est = await rideAPI.getFareEstimate({
            pickupLat: pickup.location.latitude,
            pickupLng: pickup.location.longitude,
            dropLat:   dropoff.location.latitude,
            dropLng:   dropoff.location.longitude,
            vehicleType: type,
          });
          const estimatedFare = est?.data?.data?.totalFare ?? 0;
          if (cancelled) return;
          setFare(estimatedFare);
          setFareBreakdown(est?.data?.data?.breakdown || []);

          rideData = {
            pickup,
            dropoff,
            vehicleType: type,
            bookingMode: 'distance',
            distance: distData.distance,
            estimatedDuration: Math.round(distData.duration.value / 60),
            estimatedFare,
            paymentMethod: 'cash',
          };
        }

        const response = await rideAPI.createRide(rideData);
        if (cancelled) return;

        if (response.data.success) {
          trackEvent('booking_confirmed', { vehicle_type: type, booking_mode: rideData.bookingMode });
          toast.success('Ride book ho gayi! Driver dhundha ja raha hai...');
          navigate(`/ride/${response.data.data.ride._id}`);
        } else {
          // Auto-book na ho paaya to confirm screen par chhodo — pickup, drop
          // aur gaadi sab bhare hue hain, sirf ek tap baaki hai.
          setStep(3);
          setAutoBooking(false);
        }
      } catch {
        if (cancelled) return;
        toast.error('Auto-booking fail hui, details check karke Confirm Booking dabao');
        setStep(3);
        setAutoBooking(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesReady]);

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const handleConfirmRide = async () => {
    if (submittingRef.current) return;
    if (!pickup) { toast.error('Pickup location select karo'); return; }
    if (!isTractorJcb && !dropoff) { toast.error('Drop location select karo'); return; }
    if (!localStorage.getItem('token')) {
      toast.error('Login karke booking karo');
      navigate('/auth');
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

    submittingRef.current = true;
    setLoading(true);
    try {
      let rideData;

      if (isTractorJcb) {
        const finalFare = calcTractorFare();
        rideData = {
          pickup: pickup,
          // Khet ke kaam mein drop nahi hota — kaam ki jagah hi bhejte hain
          dropoff: needsDropoff ? dropoff : pickup,
          vehicleType,
          bookingMode:     isHourly ? 'hourly' : 'distance',
          serviceCategory: selectedCategory.id,
          serviceType:     selectedSub.id,
          estimatedHours:  isHourly ? selectedHours : 0,
          serviceQuantity: isQuantity ? quantity : 0,
          hourlyRate:      selectedSub.rate,
          ...workExtras(selectedSub, workNote),
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
        trackEvent('booking_confirmed', { vehicle_type: vehicleType, booking_mode: rideData.bookingMode });
        toast.success('Ride book ho gayi! Driver dhundha ja raha hai...');
        navigate(`/ride/${response.data.data.ride._id}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Login karke booking karo');
        navigate('/auth');
      } else {
        toast.error(error.response?.data?.message || 'Booking fail ho gayi, dobara try karo');
      }
    } finally {
      submittingRef.current = false;
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

  const spinner = (
    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="bg-gray-50 py-4 lg:py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* ── Step header ── */}
        <div className="flex items-center gap-3 mb-6">
          {step > 1 && (
            <button
              onClick={goBack}
              aria-label="Pichhle step par jao"
              className="h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-white text-gray-600 text-xl leading-none hover:bg-gray-100 transition"
            >
              ←
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {step === 1 && 'Kahan se kahan?'}
              {step === 2 && 'Gaadi chuniye'}
              {step === 3 && 'Booking confirm karein'}
            </h2>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress bar — customer ko dikhta rehta hai ki kitna baaki hai */}
        <ol className="flex items-center gap-2 mb-6" aria-label="Booking steps">
          {STEPS.map((s) => (
            <li key={s.id} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step >= s.id ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              />
              <span
                className={`mt-1.5 block text-[11px] font-semibold ${
                  step >= s.id ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left: current step ── */}
          <div className="space-y-6">

            {/* ── STEP 1: Location ── */}
            {step === 1 && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Where to?</h3>
                  <LocationSearchInput
                    placeholder="Pickup Location"
                    onSelectLocation={handlePickupSelect}
                    value={pickup?.addressLine1 || ''}
                  />
                  <LocationSearchInput
                    placeholder="Drop Location"
                    onSelectLocation={handleDropoffSelect}
                    value={dropoff?.addressLine1 || ''}
                  />
                  <p className="text-xs text-gray-500">
                    🌾 Khet ya site par kaam karwana hai (jutai, thresher, khudai, katai)?
                    Sirf pickup daal kar aage badhein — drop ki zaroorat nahi.
                  </p>
                </div>

                {/* Mobile map — desktop par right column mein hamesha dikhta hai */}
                <div className="lg:hidden bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-56">
                    <Map
                      center={pickup?.location ? [pickup.location.latitude, pickup.location.longitude] : [20.5937, 78.9629]}
                      zoom={pickup ? 13 : 5}
                      markers={mapMarkers}
                    />
                  </div>
                </div>

                <button
                  onClick={goToVehicleStep}
                  disabled={!pickup}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Aage badhein
                </button>
              </>
            )}

            {/* ── STEP 2: Vehicle + service ── */}
            {step === 2 && (
              <>
                {/* Trip recap — customer ko yaad rahe ki kis route ka daam dikh raha hai */}
                <button
                  onClick={() => setStep(1)}
                  className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50 transition"
                >
                  <p className="text-sm text-gray-700 truncate">
                    <span className="text-green-600">●</span> {pickup?.addressLine1 || '—'}
                  </p>
                  <p className="text-sm text-gray-700 truncate mt-1">
                    <span className="text-red-600">●</span> {dropoff?.addressLine1 || 'Drop nahi chuni'}
                  </p>
                  <span className="text-xs text-orange-600 font-semibold mt-2 inline-block">Badlein</span>
                </button>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Vehicle</h3>
                  {VEHICLE_OPTIONS.map((opt) => {
                    const selected = vehicleType === opt.type;
                    const quote = quotes[opt.type];
                    const isRoad = ROAD_VEHICLES.includes(opt.type);
                    return (
                      <button
                        key={opt.type}
                        onClick={() => handleVehicleChange(opt.type)}
                        aria-pressed={selected}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${
                          selected
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {VEHICLE_IMAGES[opt.type] ? (
                          <img
                            src={VEHICLE_IMAGES[opt.type]}
                            alt=""
                            loading="lazy"
                            className="h-11 w-14 shrink-0 object-contain"
                          />
                        ) : (
                          <span className={`text-2xl w-12 text-center shrink-0 ${selected ? 'text-orange-600' : 'text-gray-500'}`}>
                            {opt.icon}
                          </span>
                        )}
                        <span className="flex-1 min-w-0">
                          <span className={`block font-semibold text-sm ${selected ? 'text-orange-700' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                          <span className="block text-xs text-gray-500 truncate">{opt.tagline}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          {isRoad && dropoff ? (
                            quotesLoading && quote === undefined ? (
                              <span className="block h-4 w-12 rounded bg-gray-200 animate-pulse" />
                            ) : typeof quote === 'number' ? (
                              <span className="block text-base font-bold text-gray-900">₹{quote}</span>
                            ) : (
                              <span className="block text-xs text-gray-400">Rate check karein</span>
                            )
                          ) : (
                            <span className="block text-xs text-gray-400">{opt.desc}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {!dropoff && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                      Drop location daaliye to auto, car aur tempo ka kiraya yahin dikh jayega.
                    </p>
                  )}
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
                              ({cat.pricingType === 'per_km' ? 'per km' : cat.pricingType === 'per_acre' ? 'per acre' : 'per hour'})
                            </span>
                          </button>
                        ))}
                        {services.length === 0 && (
                          <p className="text-sm text-gray-400">Services load ho rahi hain...</p>
                        )}
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
                              {SUB_SERVICE_IMAGES[sub.id] && (
                                <img
                                  src={SUB_SERVICE_IMAGES[sub.id]}
                                  alt=""
                                  loading="lazy"
                                  className="mb-2 h-16 w-full object-contain"
                                />
                              )}
                              <p className={`text-sm font-700 ${selectedSub?.id === sub.id ? 'text-blue-900' : 'text-gray-600'}`}>
                                {sub.label}
                              </p>
                              <p className="text-orange-600 font-bold text-base mt-1">
                                ₹{sub.rate}
                                <span className="text-gray-400 text-xs font-normal">
                                  /{UNIT_WORD[unitOf(sub, selectedCategory)] || 'ghanta'}
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

                    {/* Kitne acre / quintal — harvester ki katai waghera */}
                    {isQuantity && (
                      <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Kitne {UNIT_WORD[workUnit]}?
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {QUANTITY_OPTIONS.map((n) => (
                            <button
                              key={n}
                              onClick={() => setQuantity(n)}
                              className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition ${
                                quantity === n
                                  ? 'bg-blue-900 border-blue-900 text-white'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <span className="block">{n} {UNIT_WORD[workUnit]}</span>
                              {selectedSub && (
                                <span className="block text-xs opacity-70">₹{n * selectedSub.rate}</span>
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

                <button
                  onClick={goToConfirmStep}
                  disabled={pricing || (isTractorJcb && !selectedSub) || (needsDropoff && !dropoff)}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {pricing ? (
                    <span className="flex items-center justify-center">{spinner}Kiraya nikala ja raha hai...</span>
                  ) : (
                    'Aage badhein'
                  )}
                </button>
              </>
            )}

            {/* ── STEP 3: Review + payment + confirm ── */}
            {step === 3 && (
              <>
                {/* Trip summary */}
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Trip Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="text-green-600">●</span> {pickup?.addressLine1 || '—'}
                    </p>
                    {needsDropoff && (
                      <p className="text-sm text-gray-700">
                        <span className="text-red-600">●</span> {dropoff?.addressLine1 || '—'}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-2 border-t">
                    <span className="text-gray-600">Vehicle</span>
                    <span className="font-semibold capitalize">{vehicleType}</span>
                  </div>
                  {distance && (
                    <>
                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="text-gray-600">Distance</span>
                        <span className="font-semibold">{distance.distance.text}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="text-gray-600">Estimated Time</span>
                        <span className="font-semibold">{distance.duration.text}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Fare — road vehicles */}
                {!isTractorJcb && fare != null && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Fare</h3>
                    {/* Poora hisaab — customer ko dikhna chahiye ki kis cheez ka
                        kitna paisa laga. Ek akela number bharosa nahi banata. */}
                    {fareBreakdown.map((line, i) => (
                      <div key={`${line.label}-${i}`} className="flex justify-between items-center py-1.5 text-sm">
                        <span className="text-gray-500">{line.label}</span>
                        <span className="text-gray-700 font-medium">₹{line.amount}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-4">
                      <span className="text-gray-700 font-semibold">Total Fare</span>
                      <span className="text-3xl font-bold text-orange-600">₹{fare}</span>
                    </div>

                    <p className="text-xs text-green-700 text-center font-medium">
                      Koi chhupa hua charge nahi — itna hi dena hai.
                    </p>
                  </div>
                )}

                {/* Kiraya na aa paya (network/backend) — customer ko step 3 par
                    phansa mat chhodo, yahin se dobara koshish karne do. */}
                {!isTractorJcb && fare == null && (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center space-y-3">
                    <p className="text-sm text-gray-600">
                      Kiraya nikal nahi paya. Internet check karke dobara koshish karein.
                    </p>
                    <button
                      onClick={async () => {
                        setPricing(true);
                        await calculateFare(pickup, dropoff);
                        setPricing(false);
                      }}
                      disabled={pricing || !pickup || !dropoff}
                      className="inline-flex items-center justify-center border-2 border-orange-600 text-orange-600 px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 transition"
                    >
                      {pricing ? 'Nikala ja raha hai...' : 'Dobara koshish karein'}
                    </button>
                  </div>
                )}

                {/* Fare — tractor / JCB */}
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
                        <span className="font-semibold">
                          ₹{selectedSub.rate}/{UNIT_WORD[workUnit]}
                        </span>
                      </div>
                      {isHourly && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Hours</span>
                          <span className="font-semibold">{selectedHours} ghante</span>
                        </div>
                      )}
                      {isQuantity && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Kaam</span>
                          <span className="font-semibold">{quantity} {UNIT_WORD[workUnit]}</span>
                        </div>
                      )}
                      {workNote && (
                        <div className="flex justify-between py-2 border-b gap-4">
                          <span className="text-gray-600 shrink-0">Note</span>
                          <span className="font-medium text-right text-gray-700">{workNote}</span>
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
                    <span className="flex items-center justify-center">{spinner}Booking...</span>
                  ) : isTractorJcb ? (
                    vehicleType === 'jcb' ? '🚧 JCB Book Karo'
                      : vehicleType === 'harvester' ? '🌾 Harvester Book Karo'
                      : '🚜 Tractor Book Karo'
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </>
            )}
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
