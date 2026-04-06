import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore'; // ✅ default import (not named)

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const login    = useAuthStore((state) => state.login); // ✅ login(user, token)

  const email = location.state?.email || '';

  const [otp, setOtp]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => { if (!email) navigate('/register'); }, [email, navigate]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimer(p => { if (p <= 1) { clearInterval(iv); setCanResend(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCanResend(true), 60000);
    return () => clearTimeout(t);
  }, []);

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[i] = val.slice(-1); setOtp(n);
    if (val && i < 5) inputRefs.current[i+1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i-1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length === 6) { setOtp(p.split('')); inputRefs.current[5]?.focus(); }
  };

  const handleVerify = async () => {
    const otpVal = otp.join('');
    if (otpVal.length !== 6) { toast.error('Enter complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpVal });
      const { token, user } = res.data; // ✅ backend returns { token, user }
      login(user, token);               // ✅ store login
      toast.success(`Welcome to E-Shop, ${user.name}! 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
      setOtp(['','','','','','']);
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent!');
      setOtp(['','','','','','']);
      setTimer(600); setCanResend(false);
      inputRefs.current[0]?.focus();
      setTimeout(() => setCanResend(true), 60000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend');
    } finally { setResending(false); }
  };

  const done = otp.join('').length === 6;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'440px', background:'white', borderRadius:'16px', padding:'40px 36px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>

        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#EEF2FF,#DDD6FE)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:'32px' }}>📧</div>
        </div>

        <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#111827', textAlign:'center', marginBottom:'8px' }}>Verify your email</h2>
        <p style={{ color:'#6B7280', fontSize:'14px', textAlign:'center', marginBottom:'6px' }}>We sent a 6-digit code to</p>
        <p style={{ color:'#4F46E5', fontSize:'15px', fontWeight:'600', textAlign:'center', marginBottom:'28px' }}>{email}</p>

        <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'24px' }}>
          {otp.map((digit, i) => (
            <input key={i} ref={el => inputRefs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
              style={{ width:'48px', height:'56px', textAlign:'center', fontSize:'22px', fontWeight:'700', borderRadius:'10px', border:`2px solid ${digit?'#4F46E5':'#D1D5DB'}`, background:digit?'#EEF2FF':'white', color:'#111827', outline:'none', transition:'all 0.15s' }}
              onFocus={e => e.target.style.borderColor='#4F46E5'}
              onBlur={e => e.target.style.borderColor=digit?'#4F46E5':'#D1D5DB'}
            />
          ))}
        </div>

        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          {timer > 0
            ? <p style={{ fontSize:'13px', color:'#6B7280' }}>Expires in <span style={{ color:'#4F46E5', fontWeight:'600' }}>{fmt(timer)}</span></p>
            : <p style={{ fontSize:'13px', color:'#EF4444' }}>OTP expired. Please resend.</p>
          }
        </div>

        <button onClick={handleVerify} disabled={loading || !done}
          style={{ width:'100%', padding:'13px', background:loading||!done?'#A5B4FC':'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:loading||!done?'not-allowed':'pointer', marginBottom:'14px' }}>
          {loading ? 'Verifying...' : 'Verify & Create Account ✓'}
        </button>

        <div style={{ textAlign:'center' }}>
          {canResend
            ? <button onClick={handleResend} disabled={resending} style={{ background:'none', border:'none', color:'#4F46E5', fontSize:'14px', fontWeight:'600', cursor:'pointer', textDecoration:'underline' }}>{resending?'Sending...':'Resend OTP'}</button>
            : <p style={{ fontSize:'13px', color:'#9CA3AF' }}>Resend available after 60 seconds</p>
          }
        </div>

        <div style={{ textAlign:'center', marginTop:'20px', borderTop:'1px solid #F3F4F6', paddingTop:'16px' }}>
          <Link to="/register" style={{ fontSize:'13px', color:'#6B7280', textDecoration:'none' }}>← Back to registration</Link>
        </div>
      </div>
    </div>
  );
}