import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/Button';
import { EnvelopeIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, loadUser } = useAuthStore();

  const email = location.state?.email || '';
  const name = location.state?.name || 'Shopper';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimer((p) => {
        if (p <= 1) {
          clearInterval(iv);
          setCanResend(true);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCanResend(true), 60000); // Allow resend after 1 min
    return () => clearTimeout(t);
  }, []);

  const fmt = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp];
    n[i] = val.slice(-1);
    setOtp(n);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) {
      setOtp(p.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpVal = otp.join('');
    if (otpVal.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpVal });
      const { user } = res.data;

      // ✅ Fix FE-001: setAuth updates Zustand store and cookies authenticate session
      setAuth(user);
      await loadUser();

      toast.success(`Welcome to E-Shop, ${user?.name || name}! 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or expired verification code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A fresh 6-digit code has been sent to your email! 📧');
      setOtp(['', '', '', '', '', '']);
      setTimer(600);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      setTimeout(() => setCanResend(true), 60000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.join('').length === 6;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-violet-100 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
          <EnvelopeIcon className="w-8 h-8" />
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            We sent a 6-digit security code to
          </p>
          <p className="text-sm font-bold text-indigo-600 bg-indigo-50/60 py-1 px-3 rounded-lg inline-block border border-indigo-100/60">
            {email}
          </p>
        </div>

        {/* 6 Digit Input Group */}
        <div className="flex gap-2 sm:gap-2.5 justify-center py-2" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border border-slate-200/90 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-800"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Countdown & Resend */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Code expires in: <strong className="text-slate-800 font-mono">{fmt(timer)}</strong></span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending…' : 'Resend Code'}</span>
            </button>
          ) : (
            <span className="text-slate-400">Resend in {timer > 540 ? `${timer - 540}s` : 'soon'}</span>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleVerify}
          isLoading={loading}
          disabled={!isComplete}
          variant="primary"
          size="lg"
          fullWidth
        >
          Verify & Sign In →
        </Button>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            to="/register"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Wrong email? Register again</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
