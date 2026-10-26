// components/FareAdjustmentModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Driver ne extra charge maanga (toll, parking, kaam badhna) — customer yahan
// haan ya na kehta hai. Kiraya TABHI badhta hai jab customer "Haan" dabaye.
// App (goanconnect_userapp → FareAdjustmentSheet) jaisa hi: wajah, rakam,
// abhi ka → naya kiraya, 5 minute ka countdown.
//
// Bahar click karne se band nahi hota — galti se band karke customer request
// dhoondhta reh jaata. Samay khatam hone par apne aap hat jaata hai.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Banknote, Car, Clock, Construction, Hourglass, Loader2, MoreHorizontal, Package, Signpost } from 'lucide-react';

export const ADJUST_TYPES = {
  extra_time: { label: 'Kaam mein zyada samay laga', Icon: Clock },
  extra_work: { label: 'Kaam badh gaya', Icon: Construction },
  toll: { label: 'Toll tax', Icon: Signpost },
  parking: { label: 'Parking', Icon: Car },
  loading: { label: 'Extra loading / unloading', Icon: Package },
  other: { label: 'Anya', Icon: MoreHorizontal },
};

const FareAdjustmentModal = ({ request, currentFare, busy, onAccept, onDecline, onExpire }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!request) return undefined;
    // Component page khulte hi ban jaata hai — ghadi ko abhi ka samay do,
    // warna pehle second purana samay dikhta ("5:03")
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [request]);

  const expiresAt = request?.expiresAt ? new Date(request.expiresAt).getTime() : 0;
  const leftSec = Math.max(0, Math.floor((expiresAt - now) / 1000));

  useEffect(() => {
    if (request && expiresAt && leftSec === 0) onExpire();
  }, [leftSec, request, expiresAt, onExpire]);

  if (!request) return null;

  const type = ADJUST_TYPES[request.type] ? request.type : 'other';
  const { label, Icon } = ADJUST_TYPES[type];
  const title = type === 'other' && request.reason ? request.reason : label;
  const note = type !== 'other' && request.reason && request.reason !== label ? request.reason : '';
  const fare = Math.round(Number(currentFare) || 0);
  const clock = `${Math.floor(leftSec / 60)}:${String(leftSec % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="fare-adjust-title">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-6 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <Banknote size={22} />
          </div>
          <div>
            <h2 id="fare-adjust-title" className="text-lg font-black text-gray-900">Driver extra charge maang rahe hain</h2>
            <p className="text-sm text-gray-500">Aapke haan kehne par hi kiraya badhega</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
          <Icon size={22} className="shrink-0 text-gray-800" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">{title}</p>
            {type === 'extra_time' && Number(request.hours) > 0 && (
              <p className="text-sm text-gray-600">{request.hours} ghanta zyada</p>
            )}
            {note && <p className="text-sm text-gray-600">{note}</p>}
          </div>
          <p className="text-lg font-black text-gray-900">+₹{request.amount}</p>
        </div>

        <div className="mt-3 rounded-2xl border border-gray-100 px-4 py-2 text-sm">
          <div className="flex justify-between py-1.5"><span className="text-gray-500">Abhi ka kiraya</span><span className="font-semibold">₹{fare}</span></div>
          <div className="flex justify-between py-1.5"><span className="text-gray-500">Extra</span><span className="font-semibold">+₹{request.amount}</span></div>
          <div className="mt-1 flex justify-between border-t border-gray-100 pt-2.5 pb-1">
            <span className="font-black text-gray-900">Naya kiraya</span>
            <span className="text-xl font-black text-gray-900">₹{fare + Number(request.amount)}</span>
          </div>
        </div>

        {expiresAt > 0 && (
          <p className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold tabular-nums text-orange-700">
            <Hourglass size={14} /> {clock} mein jawab dein
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={onDecline}
            disabled={busy}
            className="flex-1 rounded-xl border-2 border-gray-200 py-3.5 font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            Nahi
          </button>
          <button
            onClick={onAccept}
            disabled={busy}
            className="flex flex-[2] items-center justify-center rounded-xl bg-brand py-3.5 font-black text-ink hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : `Haan, ₹${request.amount} jodein`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FareAdjustmentModal;
