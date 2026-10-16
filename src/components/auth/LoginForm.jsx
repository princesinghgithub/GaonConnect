// components/auth/LoginForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Website login — Rapido/Uber web jaisa: mobile number → OTP → (naya ho to)
// naam → wahin wapas jahan booking chhodi thi.
//
// Pehle naye number par "Is number se koi account nahi mila. Pehle Register
// karein" aata tha aur 1000 line ka register form khulta tha — jo customer
// sirf ek auto book karne aaya tha wo wahin chala jaata. Backend OTP verify par
// naya customer khud bana deta hai, isliye alag register ki zaroorat hi nahi.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../services/api';
import { openDriverApp } from '../../utils/appDownload';
import { trackEvent } from '../../utils/analytics';

const RESEND_SECONDS = 30;
const FALLBACK_NAME = /^User\d{4}$/; // backend naye customer ko yahi naam deta hai

// Login ke baad kahan jaana hai — booking adhoori ho to wahi, warna dashboard
const afterLoginPath = () => {
  const saved = sessionStorage.getItem('afterLogin');
  sessionStorage.removeItem('afterLogin');
  if (saved && saved.startsWith('/') && !saved.startsWith('/auth')) return saved;
  return '/customer';
};

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // phone → otp → name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const otpRefs = useRef([]);
  const session = useRef(null); // { user, accessToken, refreshToken }

  // Resend ka ulta ginti
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const otpValue = otp.join('');
  const validPhone = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async () => {
    setError('');
    if (!validPhone) {
      setError('Sahi 10 ankon ka mobile number daaliye');
      return false;
    }
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(phone);
      // Sirf test server OTP lautata hai — live par SMS hi aata hai
      setDevOtp(res.data?.otp ? String(res.data.otp) : '');
      setResendIn(RESEND_SECONDS);
      trackEvent('login_otp_sent');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP nahi bhej paaye. Thodi der baad koshish karein.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (e) => {
    e.preventDefault();
    if (await sendOtp()) {
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  };

  const finish = (user, accessToken, refreshToken) => {
    onLoginSuccess(user, accessToken, refreshToken);
    trackEvent('login_success');
    navigate(afterLoginPath(), { replace: true });
  };

  const verify = async (code) => {
    if (code.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(phone, code);
      const data = res?.data;
      if (!data?.success) {
        setError(data?.message || 'OTP galat hai');
        return;
      }
      if (!data.user?.name || FALLBACK_NAME.test(data.user.name)) {
        // Naya customer — pehle naam, phir andar
        session.current = data;
        localStorage.setItem('token', data.accessToken); // naam save karne ke liye
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        setStep('name');
        return;
      }
      finish(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP galat hai, dobara daaliye');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (i, raw) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setOtp((o) => o.map((d, idx) => (idx === i ? '' : d)));
      return;
    }
    // Paste ya SMS autofill — poora code ek saath
    const next = [...otp];
    for (let k = 0; k < digits.length && i + k < 6; k++) next[i + k] = digits[k];
    setOtp(next);
    const focusAt = Math.min(i + digits.length, 5);
    otpRefs.current[focusAt]?.focus();
    const code = next.join('');
    if (code.length === 6) verify(code);
  };

  const onOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const onNameSubmit = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      setError('Apna naam likhiye');
      return;
    }
    setError('');
    setLoading(true);
    const { user, accessToken, refreshToken } = session.current || {};
    try {
      await authAPI.updateProfile({ name: clean });
    } catch {
      // Naam baad mein profile se bhi badal sakte hain — booking mat roko
    } finally {
      setLoading(false);
    }
    finish({ ...user, name: clean }, accessToken, refreshToken);
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* ── Bayan: brand (sirf bade screen par) ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand to-amber-500 p-12 text-ink">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 w-fit">
          <img src="/gaonconnect-icon.png" alt="" className="h-11 w-11 rounded-xl bg-white" />
          <span className="text-2xl font-black tracking-tight">GaonConnect</span>
        </button>
        <div>
          <h2 className="text-5xl font-black leading-tight">Gaon ki har sawari,<br />ek click mein.</h2>
          <p className="mt-4 text-lg text-white/90 max-w-md">Auto, car, tractor, JCB — paas ki gaadi, pehle se tay kiraya, aur cash ya online bhugtaan.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {['/vehicles/tractor.webp', '/vehicles/auto.webp', '/vehicles/car.webp'].map((src) => (
            <img key={src} src={src} alt="" className="h-24 w-full object-contain rounded-2xl bg-white/95 p-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ))}
        </div>
      </div>

      {/* ── Dayan: form ── */}
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:justify-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src="/gaonconnect-icon.png" alt="" className="h-9 w-9 rounded-lg" />
              <span className="text-xl font-black text-gray-900">GaonConnect</span>
            </button>
          </div>

          {step !== 'phone' && (
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="mb-6 flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft size={16} /> Number badlein
            </button>
          )}

          {step === 'phone' && (
            <form onSubmit={onPhoneSubmit}>
              <h1 className="text-3xl font-black text-gray-900">Apna mobile number daaliye</h1>
              <p className="mt-2 text-gray-500">Is number par OTP aayega. Naya hai to account apne aap ban jaayega.</p>

              <label htmlFor="phone" className="sr-only">Mobile number</label>
              <div className={`mt-8 flex items-center rounded-xl border-2 bg-white px-4 transition ${error ? 'border-red-400' : 'border-gray-200 focus-within:border-orange-500'}`}>
                <span className="pr-3 text-lg font-semibold text-gray-500 border-r border-gray-200">+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(-10)); setError(''); }}
                  placeholder="98765 43210"
                  className="w-full bg-transparent py-4 pl-3 text-lg font-semibold tracking-wide text-gray-900 outline-none"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || !validPhone}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-lg font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Aage badhein <ArrowRight size={20} /></>}
              </button>

              <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
                Aage badhkar aap hamari <a href="/privacy-policy" className="underline">Privacy Policy</a> se sahmat hain.
              </p>

              <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                Gaadi chalate hain?{' '}
                <button type="button" onClick={openDriverApp} className="font-bold text-orange-600 hover:underline">
                  GaonConnect Driver app se judiye →
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <h1 className="text-3xl font-black text-gray-900">OTP daaliye</h1>
              <p className="mt-2 text-gray-500">+91 {phone} par 6 ankon ka code bheja gaya hai</p>

              <div className="mt-8 flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); onOtpChange(0, e.clipboardData.getData('text')); }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    value={d}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKey(i, e)}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={6}
                    aria-label={`OTP ank ${i + 1}`}
                    className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold text-gray-900 outline-none transition sm:w-14 ${error ? 'border-red-400' : d ? 'border-gray-900' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                ))}
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {devOtp && <p className="mt-3 text-xs text-gray-400">Test server OTP: {devOtp}</p>}

              <button
                type="button"
                onClick={() => verify(otpValue)}
                disabled={loading || otpValue.length !== 6}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-lg font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify karein <ShieldCheck size={20} /></>}
              </button>

              <div className="mt-5 text-center text-sm">
                {resendIn > 0 ? (
                  <span className="text-gray-400">OTP dobara {resendIn}s mein</span>
                ) : (
                  <button type="button" onClick={sendOtp} disabled={loading} className="font-bold text-orange-600 hover:underline">
                    OTP dobara bhejein
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'name' && (
            <form onSubmit={onNameSubmit}>
              <h1 className="text-3xl font-black text-gray-900">Aapka naam?</h1>
              <p className="mt-2 text-gray-500">Driver aapko isi naam se pehchanega</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value.slice(0, 50)); setError(''); }}
                placeholder="Jaise: Ramesh Patel"
                autoComplete="name"
                className={`mt-8 w-full rounded-xl border-2 px-4 py-4 text-lg font-semibold text-gray-900 outline-none transition ${error ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'}`}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading || name.trim().length < 2}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-lg font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Shuru karein <ArrowRight size={20} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
