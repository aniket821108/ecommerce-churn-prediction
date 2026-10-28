import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: 'white', color: '#111827',
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      // Server always returns generic — this only fires on network error
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '16px', padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {!sent ? (
          <>
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '32px' }}>
                🔑
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
              Forgot your password?
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', marginBottom: '28px', lineHeight: 1.6 }}>
              No worries — enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
              <div>
                <label htmlFor="forgot-email" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input id="forgot-email" {...register('email')} type="email"
                  placeholder="you@example.com" autoComplete="email"
                  aria-invalid={!!errors.email} style={inputStyle(errors.email)} />
                {errors.email && <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} style={{
                width: '100%', padding: '12px',
                background: isSubmitting ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}>
                {isSubmitting ? 'Sending…' : 'Send Reset Link →'}
              </button>
            </form>
          </>
        ) : (
          /* ── Success state ── */
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '32px' }}>
                ✉️
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
              Check your email
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', lineHeight: 1.6, marginBottom: '8px' }}>
              If an account exists for <strong style={{ color: '#4F46E5' }}>{getValues('email')}</strong>, we've sent a password reset link.
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>
              The link expires in 30 minutes.
            </p>

            <button onClick={() => setSent(false)} style={{
              width: '100%', padding: '12px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
              Didn't receive it? Try again
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
          <Link to="/login" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
