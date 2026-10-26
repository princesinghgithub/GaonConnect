// components/DriverExtraCharge.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Driver (website) — chalti ride mein extra charge maangna: toll, parking,
// kaam badhna. Request customer ki app/website mein jaati hai; kiraya tabhi
// badhta hai jab customer "Haan" kahe. Driver app ki adjust-fare screen jaisa.
//
// Had (kitna tak, kaunsi wajah chalegi) server se aati hai —
// GET /ride/:id/fare-adjustment. Jawab ka pata har 4 second poll se.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Hourglass, Loader2, Plus, X } from 'lucide-react';
import { rideAPI } from '../services/api';
import { ADJUST_TYPES } from './FareAdjustmentModal';

const QUICK = [20, 50, 100, 200];

const DriverExtraCharge = ({ rideId, onFareChange }) => {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState(1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());
  const seen = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await rideAPI.getFareAdjustment(rideId);
      const d = res.data?.data || null;
      setInfo(d);
      return d;
    } catch {
      return null;
    }
  }, [rideId]);

  useEffect(() => {
    load().then((d) => { seen.current = d?.history?.length || 0; });
  }, [load]);

  const pending = info?.pendingFareAdjustment || null;

  // Jawab ka intezaar — poll + ghadi. Request khatam hote hi nateeja batao.
  useEffect(() => {
    if (!pending) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      const d = await load();
      if (!d || d.pendingFareAdjustment) return;
      const last = d.history?.[d.history.length - 1];
      if ((d.history?.length || 0) > seen.current && last) {
        seen.current = d.history.length;
        if (last.status === 'approved') toast.success(`Customer ne haan kahi — ₹${last.amount} jud gaye. Naya kiraya ₹${d.fare}`);
        else if (last.status === 'declined') toast.error('Customer ne mana kiya — kiraya wahi rahega');
        else if (last.status === 'expired') toast('5 minute mein jawab nahi aaya — chahein to dobara bhejein');
        onFareChange?.(d.fare);
      }
    }, 4000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [pending, load, onFareChange]);

  const types = info?.types?.length ? info.types : Object.keys(ADJUST_TYPES).map((id) => ({ id, allowed: true, needsHours: id === 'extra_time', needsReason: id === 'other' }));
  const chosen = types.find((t) => t.id === type);
  const amt = Number(amount) || 0;
  const max = Number.isFinite(info?.maxExtra) ? info.maxExtra : Infinity;
  const over = amt > max;

  const send = async () => {
    if (!chosen || amt <= 0 || over) return;
    if (chosen.needsReason && !reason.trim()) return toast.error('Wajah likhiye');
    setSaving(true);
    try {
      seen.current = info?.history?.length || 0;
      await rideAPI.requestFareAdjustment({
        rideId, type: chosen.id, extraAmount: amt, extraHours: chosen.needsHours ? hours : 0, reason: reason.trim(),
      });
      toast.success("Customer ko bheja gaya — unki 'Haan' par hi kiraya badhega");
      setOpen(false);
      setType(''); setAmount(''); setReason(''); setHours(1);
      setNow(Date.now());
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request nahi bhej paaye');
      load();
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm('Request wapas lein? Customer ke screen se hat jaayegi.')) return;
    setSaving(true);
    try {
      await rideAPI.withdrawFareAdjustment(rideId);
      const d = await load();
      seen.current = d?.history?.length || seen.current;
      toast('Request wapas le li');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Wapas nahi le paaye');
    } finally {
      setSaving(false);
    }
  };

  // ── Intezaar ──
  if (pending) {
    const left = Math.max(0, Math.floor((new Date(pending.expiresAt).getTime() - now) / 1000));
    const label = pending.type === 'other' && pending.reason ? pending.reason : ADJUST_TYPES[pending.type]?.label || 'Extra';
    return (
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-amber-700" size={22} />
          <div className="flex-1">
            <p className="font-bold text-gray-900">Customer ke jawab ka intezaar</p>
            <p className="text-sm text-gray-600">{label} · +₹{pending.amount} · naya kiraya ₹{Math.round((info?.fare || 0) + pending.amount)}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sm font-bold tabular-nums text-amber-700">
            <Hourglass size={13} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </span>
        </div>
        <button onClick={withdraw} disabled={saving} className="mt-3 w-full rounded-lg border-2 border-red-300 bg-white py-2 font-bold text-red-600 disabled:opacity-50">
          Request wapas lein
        </button>
      </div>
    );
  }

  if (!open) {
    if (info && !info.canRequest) return null;
    return (
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:bg-gray-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-ink"><Plus size={18} /></span>
        <span className="flex-1 font-bold text-gray-900">Extra charge (toll, parking, kaam badha)</span>
      </button>
    );
  }

  // ── Maangna ──
  return (
    <div className="space-y-4 rounded-xl border-2 border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-black text-gray-900">Extra charge maangein</p>
        <button onClick={() => setOpen(false)} aria-label="Band karein" className="rounded-full p-1 hover:bg-gray-100"><X size={18} /></button>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-gray-500">Kis cheez ka?</p>
        <div className="grid grid-cols-2 gap-2">
          {types.map((t) => {
            const meta = ADJUST_TYPES[t.id] || ADJUST_TYPES.other;
            const Icon = meta.Icon;
            const on = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => t.allowed && setType(t.id)}
                disabled={!t.allowed}
                className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left text-sm font-bold ${on ? 'border-brand bg-brand text-ink' : 'border-gray-200 text-gray-900'} ${!t.allowed ? 'cursor-not-allowed border-dashed bg-gray-50 text-gray-400' : ''}`}
              >
                <Icon size={18} />
                {meta.label}
                {!t.allowed && <span className="text-[11px] font-normal">Ghante bill mein apne aap judte hain</span>}
              </button>
            );
          })}
        </div>
      </div>

      {chosen && (
        <>
          {chosen.needsHours && (
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Kitne ghante zyada?</p>
              <div className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-2">
                <button onClick={() => setHours((h) => Math.max(1, h - 1))} className="h-9 w-9 rounded-md bg-gray-100 font-black">−</button>
                <span className="font-bold">+ {hours} ghanta</span>
                <button onClick={() => setHours((h) => Math.min(12, h + 1))} className="h-9 w-9 rounded-md bg-gray-100 font-black">+</button>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Extra raashi</p>
            <div className={`flex items-center rounded-lg border-2 px-3 ${over ? 'border-red-400' : 'border-gray-200'}`}>
              <span className="text-xl font-black">₹</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                inputMode="numeric"
                placeholder="0"
                className="w-full bg-transparent p-2 text-xl font-black outline-none"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {QUICK.filter((q) => q <= max).map((q) => (
                <button key={q} onClick={() => setAmount(String(q))} className={`flex-1 rounded-full border py-1.5 text-sm font-bold ${amt === q ? 'border-brand bg-amber-50' : 'border-gray-200'}`}>₹{q}</button>
              ))}
            </div>
            {Number.isFinite(max) && (
              <p className={`mt-1.5 text-xs ${over ? 'text-red-600' : 'text-gray-500'}`}>
                {over ? `₹${max} se zyada nahi maang sakte` : `Zyada se zyada ₹${max}`}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">{chosen.needsReason ? 'Wajah' : 'Wajah (zaroori nahi)'}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Jaise: raaste mein toll plaza tha…"
              className="w-full rounded-lg border-2 border-gray-200 p-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="font-bold">Naya kiraya</span>
            <span className="text-xl font-black">₹{Math.round((info?.fare || 0) + amt)}</span>
          </div>
        </>
      )}

      <p className="rounded-lg bg-blue-50 p-3 text-xs text-gray-700">
        Customer ke app mein jaayega. Unke &lsquo;Haan&rsquo; dabane par hi kiraya badhega. 5 minute mein jawab na aaye to request khatam.
      </p>

      <button
        onClick={send}
        disabled={!chosen || amt <= 0 || over || saving}
        className="w-full rounded-xl bg-brand py-3.5 font-black text-ink disabled:opacity-50"
      >
        {saving ? 'Bhej rahe hain…' : 'Customer ko bhejein'}
      </button>
    </div>
  );
};

export default DriverExtraCharge;
