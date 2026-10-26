// components/RideTracking.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Booking ke baad ki screen — Rapido/Uber web jaisi: upar bada naksha (pickup,
// drop, driver alag pehchaan ke saath), neeche ek card jo abhi ki haalat batata
// hai — driver dhundh rahe, driver aa raha (OTP, gaadi ka number, call), safar
// chal raha, poora (kiraya, bhugtaan, rating).
//
// Live: socket se driver ki jagah aur status (backend ke wahi event jo app
// sunti hai — user_join + join-ride, location_update, rideStatusUpdate), aur
// 6 second ka poll fallback. Ride khatam hote hi poll band.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Car, CheckCircle2, Loader2, MapPin, Phone, Share2, ShieldCheck, Star, XCircle, CalendarClock } from 'lucide-react';
import { rideAPI, ratingAPI } from '../services/api';
import config from '../config/config';
import Map from '../tabs/Map';
import FareAdjustmentModal from './FareAdjustmentModal';

const SOCKET_URL = config.apiUrl.replace(/\/api\/?$/, '');
const ACTIVE = ['searching', 'scheduled', 'accepted', 'arrived', 'started', 'working'];
const CANCELLABLE = ['scheduled', 'searching', 'accepted', 'arrived'];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch { return {}; }
};

// Driver ki aakhri jagah — GeoJSON [lng, lat]
const driverPoint = (ride) => {
  const c = ride?.provider?.currentLocation?.coordinates;
  if (Array.isArray(c) && c.length === 2 && (c[0] || c[1])) return { lat: c[1], lng: c[0] };
  return null;
};

const fmtWhen = (d) => (d ? new Date(d).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');

const RideTracking = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveDriver, setLiveDriver] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [routeLine, setRouteLine] = useState([]);
  const [routeTraffic, setRouteTraffic] = useState([]);
  // Driver kitni door / kitni der — { km, min, at }
  const [liveEta, setLiveEta] = useState(null);
  const routeFor = useRef('');
  const statusRef = useRef(null);
  // Extra charge ki request — jawab de diya / samay khatam to dobara mat kholo
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [answeredAdjust, setAnsweredAdjust] = useState('');

  const fetchRide = useCallback(async () => {
    try {
      const res = await rideAPI.getRideById(rideId);
      if (res.data?.success) {
        const r = res.data.data;
        // Status badla to customer ko batao (driver mila, pahunch gaya...)
        const prev = statusRef.current;
        if (prev && prev !== r.status) {
          if (r.status === 'accepted') toast.success('Driver mil gaya! Aapki taraf aa raha hai');
          if (r.status === 'arrived') toast.success('Driver pahunch gaya — OTP batayein');
          if (r.status === 'started') toast('Safar shuru ho gaya', { icon: '🚗' });
        }
        statusRef.current = r.status;
        setRide(r);
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        toast.error('Ye ride nahi mili');
        navigate('/customer', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [rideId, navigate]);

  // Pehli baar + poll (sirf jab tak ride chal rahi hai)
  const isActive = !ride || ACTIVE.includes(ride.status);
  useEffect(() => {
    fetchRide();
  }, [fetchRide]);
  useEffect(() => {
    if (!isActive) return undefined;
    const t = setInterval(fetchRide, 6000);
    return () => clearInterval(t);
  }, [isActive, fetchRide]);

  // Socket — driver ki live jagah aur turant status
  useEffect(() => {
    if (!isActive) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    // websocket par zabardasti mat karo — Render par upgrade kabhi atak jaata hai
    const sock = io(SOCKET_URL, { auth: { token } });
    sock.on('connect', () => {
      sock.emit('user_join');
      sock.emit('join-ride', { rideId });
    });
    sock.on('location_update', ({ lat, lng } = {}) => {
      if (Number.isFinite(lat) && Number.isFinite(lng)) setLiveDriver({ lat, lng });
    });
    const refresh = (data) => { if (!data?.rideId || String(data.rideId) === String(rideId)) fetchRide(); };
    ['rideStatusUpdate', 'rideAccepted', 'rideCancelled', 'scheduledDriverAssigned', 'scheduledRideActivated', 'fareAdjustmentRequested'].forEach((ev) => sock.on(ev, refresh));
    return () => sock.disconnect();
  }, [rideId, isActive, fetchRide]);

  // Trip share — family ko live link (Rapido/Uber jaisa). Phone par share
  // sheet, computer par link copy.
  // Map par sadak ka raasta — driver aa raha ho to driver → pickup, safar
  // chal raha ho to driver → drop (bacha hua). Driver ~100 m hile tabhi
  // dobara mangwao. Saath mein kitne km aur kitne minute (Rapido jaisa).
  useEffect(() => {
    if (!ride) return;
    const st = ride.status;
    const p = ride.pickup?.coordinates;
    const d = ride.drop?.coordinates;
    const drvPt = liveDriver || driverPoint(ride);
    let from = null;
    let to = null;
    if (['accepted', 'arrived'].includes(st) && drvPt && p) {
      from = drvPt; to = { lat: p.latitude, lng: p.longitude };
    } else if (st === 'started' && p && d && !(p.latitude === d.latitude && p.longitude === d.longitude)) {
      from = drvPt || { lat: p.latitude, lng: p.longitude }; to = { lat: d.latitude, lng: d.longitude };
    }
    if (!from) {
      if (routeFor.current) { routeFor.current = ''; setRouteLine([]); setRouteTraffic([]); setLiveEta(null); }
      return;
    }
    const key = `${st}:${Number(from.lat).toFixed(3)},${Number(from.lng).toFixed(3)}`;
    if (key === routeFor.current) return;
    routeFor.current = key;
    rideAPI.getRoute(from, to)
      .then((r) => {
        setRouteLine((r.data?.data?.points || []).map((q) => [q.latitude, q.longitude]));
        setRouteTraffic(Array.isArray(r.data?.data?.traffic) ? r.data.data.traffic : []);
        const km = Number(r.data?.data?.distance) || 0;
        const min = Number(r.data?.data?.durationMinutes) || Math.ceil((km / 25) * 60);
        setLiveEta(km ? { km, min: Math.max(1, min), at: Date.now() } : null);
      })
      .catch(() => {});
  }, [ride, liveDriver]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await rideAPI.createShareLink(rideId);
      const url = res.data?.data?.url;
      if (!url) throw new Error('no url');
      const text = 'Mera GaonConnect safar live dekhein';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'GaonConnect safar', text, url });
          return;
        } catch (e) {
          // Customer ne khud band kiya — kuch mat karo. Share chala hi nahi
          // (kuch computer/browser) — tab link copy kar do.
          if (e?.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      toast.success('Link copy ho gaya — WhatsApp par bhej dijiye');
    } catch {
      toast.error('Share link nahi ban paya');
    } finally {
      setSharing(false);
    }
  };

  const handleCancel = async () => {
    let fee = 0;
    try {
      const p = await rideAPI.getCancelPreview(rideId);
      fee = Number(p.data?.data?.fee) || 0;
    } catch { /* fee na mile to bhi cancel ho sake */ }
    const q = fee > 0
      ? `Abhi cancel karne par ₹${fee} cancellation fee lagegi. Phir bhi cancel karein?`
      : 'Kya aap ye booking cancel karna chahte hain?';
    if (!window.confirm(q)) return;
    setCancelling(true);
    try {
      await rideAPI.cancelRide(rideId, 'Customer ne website se cancel kiya');
      toast.success('Booking cancel ho gayi');
      fetchRide();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancel nahi ho paya, dobara koshish karein');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    try {
      if (!(await loadRazorpayScript())) {
        toast.error('Payment khul nahi paya — internet check karein');
        return;
      }
      const orderRes = await rideAPI.createRazorpayOrder(rideId);
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Payment shuru nahi ho paya');
        return;
      }
      const { order, key } = orderRes.data;
      const user = currentUser();
      const rzp = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'GaonConnect',
        description: 'Ride ka kiraya',
        prefill: { name: user.name, contact: user.phone, email: user.email },
        theme: { color: '#F9C80E' },
        handler: async (response) => {
          try {
            const verifyRes = await rideAPI.verifyRazorpayPayment({
              rideId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              toast.success('Bhugtaan ho gaya!');
              fetchRide();
            } else {
              toast.error('Bhugtaan jaanch fail hui');
            }
          } catch {
            toast.error('Bhugtaan jaanch fail hui');
          }
        },
        modal: { ondismiss: () => toast('Bhugtaan beech mein band kiya') },
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment shuru nahi ho paya');
    } finally {
      setPaying(false);
    }
  };

  // ── Extra charge: haan / na ──────────────────────────────────────────────
  const answerAdjust = async (accepted) => {
    const pending = ride?.pendingFareAdjustment;
    if (!pending) return;
    if (!accepted && !window.confirm(`Extra charge mana karein? Kiraya ₹${ride.fare} hi rahega. Driver zyada paise par ade to support se baat karein.`)) return;
    setAdjustBusy(true);
    try {
      const res = await rideAPI.respondFareAdjustment(rideId, accepted);
      const d = res.data?.data;
      setAnsweredAdjust(String(pending.requestedAt || ''));
      if (d?.accepted) toast.success(`₹${pending.amount} jud gaye. Naya kiraya ₹${d.fare}`);
      else if (accepted) toast(res.data?.message || 'Extra nahi juda');
      else toast(`Aapne mana kiya — kiraya ₹${d?.fare ?? ride.fare} hi rahega`);
      fetchRide();
    } catch (error) {
      setAnsweredAdjust(String(pending.requestedAt || ''));
      toast.error(error.response?.status === 410
        ? 'Request ka samay khatam ho gaya'
        : (error.response?.data?.message || 'Jawab nahi bhej paaye'));
      fetchRide();
    } finally {
      setAdjustBusy(false);
    }
  };

  // Samay khatam — modal hatao (server bhi ise khatam maanta hai)
  const expireAdjust = useCallback(() => {
    setAnsweredAdjust(String(ride?.pendingFareAdjustment?.requestedAt || ''));
  }, [ride]);

  const handleSubmitRating = async () => {
    if (!stars) return;
    setSubmittingRating(true);
    try {
      await ratingAPI.submitRating(rideId, stars, review.trim() || undefined);
      setRatingSubmitted(true);
      toast.success('Shukriya!');
    } catch (error) {
      // Pehle hi de chuke ho to bhi "ho gaya" maano
      if (error.response?.status === 400) setRatingSubmitted(true);
      else toast.error('Rating nahi bhej paaye');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <p className="text-xl font-bold text-gray-800">Ride nahi mili</p>
        <button onClick={() => navigate('/customer')} className="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white">Nayi booking</button>
      </div>
    );
  }

  const status = ride.status;
  const pendingAdjust = ride.pendingFareAdjustment?.amount ? ride.pendingFareAdjustment : null;
  const drv = ride.provider;
  const drvUser = drv?.user || {};
  const vehicle = ride.vehicle || {};
  const driverAt = liveDriver || driverPoint(ride);
  const pickup = ride.pickup?.coordinates || {};
  const drop = ride.drop?.coordinates || {};
  const atSite = ride.workAtPickup || (pickup.latitude === drop.latitude && pickup.longitude === drop.longitude);
  const showDriver = drv && ['scheduled', 'accepted', 'arrived', 'started', 'working'].includes(status);

  const markers = [
    { lat: pickup.latitude, lng: pickup.longitude, kind: 'pickup', label: 'Pickup' },
    ...(!atSite ? [{ lat: drop.latitude, lng: drop.longitude, kind: 'drop', label: 'Drop' }] : []),
    ...(driverAt && ['accepted', 'arrived', 'started', 'working'].includes(status) ? [{ ...driverAt, kind: 'driver', label: drvUser.name || 'Driver' }] : []),
  ];

  const head = {
    searching: { icon: <Loader2 className="animate-spin" />, tone: 'amber', title: 'Aapke liye driver dhundh rahe hain', sub: 'Paas ke drivers ko request bheji gayi hai — aam taur par 1-2 minute' },
    scheduled: drv
      ? { icon: <CalendarClock />, tone: 'green', title: 'Pre-booking pakki', sub: `${drvUser.name || 'Driver'} ${fmtWhen(ride.scheduledAt)} ko aayenge` }
      : { icon: <CalendarClock />, tone: 'amber', title: 'Pre-booking ho gayi', sub: `${fmtWhen(ride.scheduledAt)} ke liye driver tay ho rahe hain` },
    accepted: { icon: <Car />, tone: 'green', title: 'Driver aa raha hai', sub: 'Pickup par pahunchne par OTP batayein' },
    arrived:  { icon: <MapPin />, tone: 'blue', title: 'Driver pahunch gaya', sub: 'Gaadi ka number milaayein aur OTP batayein' },
    started:  { icon: <Car />, tone: 'blue', title: atSite ? 'Kaam chal raha hai' : 'Safar chal raha hai', sub: atSite ? '' : `Manzil: ${ride.drop?.address || ''}` },
    working:  { icon: <Car />, tone: 'blue', title: 'Kaam chal raha hai', sub: 'Jitna kaam hoga utna hi paisa lagega' },
    completed:{ icon: <CheckCircle2 />, tone: 'green', title: atSite ? 'Kaam poora hua' : 'Aap pahunch gaye', sub: 'GaonConnect chunne ke liye shukriya' },
    cancelled:{ icon: <XCircle />, tone: 'red', title: 'Booking cancel ho gayi', sub: ride.cancellationReason || '' },
  }[status] || { icon: <Loader2 className="animate-spin" />, tone: 'amber', title: status, sub: '' };
  const toneCls = { amber: 'bg-amber-100 text-amber-700', green: 'bg-green-100 text-green-700', blue: 'bg-blue-100 text-blue-700', red: 'bg-red-100 text-red-700' }[head.tone];

  const vehicleLabel = [ride.vehicleVariantLabel || ride.vehicleType, ride.vehicleType === 'car' && ride.ac !== undefined ? (ride.ac ? 'AC' : 'Non-AC') : null].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:h-screen lg:grid-cols-[1fr_440px]">
      {/* ── Naksha ── */}
      <div className="relative h-[42vh] lg:h-full">
        <Map markers={markers} route={routeLine} traffic={routeTraffic} fit height="100%" zoomPosition="topright" center={[pickup.latitude || 20.59, pickup.longitude || 78.96]} zoom={14} />
        <button
          onClick={() => navigate('/customer')}
          className="absolute left-4 top-4 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
          aria-label="Wapas"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* ── Card ── */}
      <div className="relative -mt-6 rounded-t-3xl bg-white px-5 pb-10 pt-6 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:mt-0 lg:overflow-y-auto lg:rounded-none lg:shadow-none">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneCls}`}>{head.icon}</div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-gray-900">{head.title}</h1>
            {head.sub && <p className="mt-1 text-sm text-gray-500">{head.sub}</p>}
            {liveEta && ['accepted', 'started'].includes(status) && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1 text-sm font-bold text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                {status === 'accepted' ? 'Driver ' : 'Manzil '}{liveEta.km >= 1 ? liveEta.km.toFixed(1) : liveEta.km.toFixed(2)} km · ~{liveEta.min} min ·{' '}
                {new Date(liveEta.at + liveEta.min * 60000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} tak
              </p>
            )}
          </div>
        </div>

        {status === 'searching' && (
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-amber-500" />
          </div>
        )}

        {/* OTP — driver mile tabhi se dikhe (Rapido jaisa) */}
        {['accepted', 'arrived'].includes(status) && ride.otp && (
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Safar ka OTP</p>
              <p className="text-xs text-white/60">Driver ko batayein, kisi aur ko nahi</p>
            </div>
            <p className="text-3xl font-black tracking-[0.3em]">{ride.otp}</p>
          </div>
        )}

        {/* Driver + gaadi */}
        {showDriver && (
          <div className="mt-5 rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              {drvUser.profilePhoto ? (
                <img src={drvUser.profilePhoto} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-xl font-black text-orange-700">
                  {(drvUser.name || 'D').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-gray-900">{drvUser.name || 'Driver'}</p>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {drv.rating?.count ? `${Number(drv.rating.average).toFixed(1)} (${drv.rating.count})` : 'Naya driver'}
                </p>
              </div>
              {drvUser.phone && (
                <a href={`tel:+91${String(drvUser.phone).slice(-10)}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow" aria-label="Driver ko call karein">
                  <Phone size={20} />
                </a>
              )}
            </div>
            {(vehicle.number || vehicle.model) && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">{[vehicle.color, vehicle.model].filter(Boolean).join(' ') || vehicleLabel}</span>
                {vehicle.number && <span className="rounded-md border-2 border-gray-900 bg-yellow-300 px-2 py-0.5 font-mono text-sm font-black tracking-wider text-gray-900">{vehicle.number}</span>}
              </div>
            )}
          </div>
        )}

        {/* Safar ki jaankari */}
        <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
            <div className="min-w-0"><p className="text-xs text-gray-400">{atSite ? 'Kaam ki jagah' : 'Pickup'}</p><p className="text-sm font-semibold text-gray-800">{ride.pickup?.address}</p></div>
          </div>
          {!atSite && (
            <div className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
              <div className="min-w-0"><p className="text-xs text-gray-400">Drop</p><p className="text-sm font-semibold text-gray-800">{ride.drop?.address}</p></div>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500"><span className="capitalize">{vehicleLabel}</span>{ride.distance ? ` · ${Number(ride.distance).toFixed(1)} km` : ''}</span>
            <span className="text-lg font-black text-gray-900">₹{ride.fare}</span>
          </div>
          {Number(ride.fareAdjustment) > 0 && (
            <p className="-mt-1 text-right text-xs font-semibold text-gray-500">
              Isme ₹{ride.fareAdjustment} extra shaamil hai — aapki manzoori se
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Bhugtaan</span>
            <span className="font-semibold text-gray-800">
              {ride.paymentMethod === 'online' ? (ride.paymentStatus === 'paid' ? '✅ Online — ho gaya' : 'Online') : '💵 Cash'}
            </span>
          </div>
        </div>

        {/* Online bhugtaan baaki */}
        {status === 'completed' && ride.paymentMethod === 'online' && ride.paymentStatus !== 'paid' && (
          <button onClick={handlePayNow} disabled={paying} className="mt-5 w-full rounded-xl bg-gray-900 py-4 text-lg font-bold text-white disabled:opacity-50">
            {paying ? 'Khul raha hai...' : `₹${ride.fare} abhi bharein`}
          </button>
        )}

        {/* Rating */}
        {status === 'completed' && drv && (
          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-center">
            {!ratingSubmitted && !ride.rating?.customerRating ? (
              <>
                <p className="font-bold text-gray-900">{drvUser.name || 'Driver'} ko kaisa raha?</p>
                <div className="mt-3 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setStars(s)} aria-label={`${s} star`}>
                      <Star size={34} className={s <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
                {stars > 0 && (
                  <>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Kuch kehna chahenge? (zaroori nahi)"
                      maxLength={200}
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm"
                    />
                    <button onClick={handleSubmitRating} disabled={submittingRating} className="mt-3 w-full rounded-xl bg-gray-900 py-3 font-bold text-white disabled:opacity-50">
                      {submittingRating ? 'Bhej rahe hain...' : 'Rating bhejein'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <p className="font-semibold text-green-700">🙏 Rating ke liye shukriya!</p>
            )}
          </div>
        )}

        {/* Trip share — family live dekh sake */}
        {['accepted', 'arrived', 'started', 'working', 'scheduled'].includes(status) && (
          <button onClick={handleShare} disabled={sharing} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-900 hover:bg-gray-200 disabled:opacity-50">
            <Share2 size={18} /> {sharing ? 'Link ban raha hai...' : 'Safar share karein'}
          </button>
        )}

        {/* Cancel */}
        {CANCELLABLE.includes(status) && (
          <button onClick={handleCancel} disabled={cancelling} className="mt-5 w-full rounded-xl border-2 border-gray-200 py-3.5 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
            {cancelling ? 'Cancel ho raha hai...' : 'Booking cancel karein'}
          </button>
        )}

        {['completed', 'cancelled'].includes(status) && (
          <button onClick={() => navigate('/customer')} className="mt-4 w-full rounded-xl bg-brand py-4 text-lg font-bold text-ink hover:bg-brand-dark">
            Nayi booking karein
          </button>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck size={14} /> Safar ke dauran madad: <a href="tel:112" className="font-semibold">112</a>
        </p>
      </div>

      <FareAdjustmentModal
        request={
          pendingAdjust
          && new Date(pendingAdjust.expiresAt).getTime() > Date.now()
          && answeredAdjust !== String(pendingAdjust.requestedAt || '')
            ? pendingAdjust
            : null
        }
        currentFare={ride.fare}
        busy={adjustBusy}
        onAccept={() => answerAdjust(true)}
        onDecline={() => answerAdjust(false)}
        onExpire={expireAdjust}
      />
    </div>
  );
};

export default RideTracking;
