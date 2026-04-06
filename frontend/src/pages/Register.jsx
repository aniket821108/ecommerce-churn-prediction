import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  phone:    z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
});

const getStrength = (pw) => {
  let s = 0;
  if (!pw) return s;
  if (pw.length >= 6)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

const Field = ({ label, error, children }) => (
  <div>
    <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>
      {label}
    </label>
    {children}
    {error && <p style={{ color:'#EF4444', fontSize:'12px', marginTop:'4px' }}>{error}</p>}
  </div>
);

const inputStyle = (hasError) => ({
  width:'100%', padding:'10px 14px', borderRadius:'8px',
  border:`1.5px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
  fontSize:'14px', outline:'none', boxSizing:'border-box',
  background:'white', color:'#111827',
});

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, watch, formState:{ errors } } =
    useForm({ resolver: zodResolver(schema) });

  const pw = watch('password', '');
  const strength = getStrength(pw);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        name: data.name, email: data.email,
        phone: data.phone, password: data.password,
      });
      toast.success('OTP sent to your email! 📧');
      navigate('/verify-otp', { state: { email: data.email, name: data.name } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f9fafb' }}>

      {/* Left panel */}
      <div style={{
        flex:1, background:'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display:'none', flexDirection:'column', justifyContent:'center',
        alignItems:'center', padding:'48px', color:'white',
      }} className="md:flex">
        <div style={{ fontSize:'52px', marginBottom:'16px' }}>🛒</div>
        <h1 style={{ fontSize:'32px', fontWeight:'700', marginBottom:'12px' }}>E-Shop</h1>
        <p style={{ fontSize:'16px', opacity:0.85, textAlign:'center', maxWidth:'300px', lineHeight:1.6 }}>
          Join thousands of happy shoppers. Discover amazing products every day.
        </p>
        <div style={{ marginTop:'40px', display:'flex', flexDirection:'column', gap:'14px' }}>
          {['✅ Secure Email OTP Verification','🚀 Fast & Easy Checkout','📦 Real-time Order Tracking'].map(f=>(
            <div key={f} style={{ fontSize:'15px', opacity:0.9 }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'32px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:'440px' }}>

          <h2 style={{ fontSize:'26px', fontWeight:'700', color:'#111827', marginBottom:'6px' }}>Create your account</h2>
          <p style={{ color:'#6B7280', fontSize:'14px', marginBottom:'28px' }}>
            We'll send a 6-digit verification code to your email.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            <Field label="Full Name" error={errors.name?.message}>
              <input {...register('name')} placeholder="Aniket Kumar" style={inputStyle(errors.name)} />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="you@example.com" style={inputStyle(errors.email)} />
            </Field>

            <Field label="Phone Number" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="10-digit number" maxLength={10} style={inputStyle(errors.phone)} />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div style={{ position:'relative' }}>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  style={{ ...inputStyle(errors.password), paddingRight:'44px' }}
                />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{
                  position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#9CA3AF'
                }}>{showPw ? '🙈' : '👁️'}</button>
              </div>
              {pw && (
                <div style={{ marginTop:'8px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i<=strength ? strengthColor[strength] : '#E5E7EB', transition:'background 0.3s' }} />
                    ))}
                  </div>
                  <p style={{ fontSize:'11px', color:strengthColor[strength] }}>{strengthLabel[strength]} password</p>
                </div>
              )}
            </Field>

            <Field label="Confirm Password" error={errors.confirmPassword?.message}>
              <input {...register('confirmPassword')} type="password" placeholder="Repeat password" style={inputStyle(errors.confirmPassword)} />
            </Field>

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px',
              background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color:'white', border:'none', borderRadius:'8px',
              fontSize:'15px', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop:'4px',
            }}>
              {loading ? 'Sending OTP...' : 'Send Verification Code →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'#6B7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#4F46E5', fontWeight:'600', textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}