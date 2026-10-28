import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';

const schema = z.object({
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/\d/, 'Must contain a number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
});

const getStrength = (pw) => {
  let s = 0;
  if (!pw) return s;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

const rules = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'Uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'Number', test: pw => /\d/.test(pw) },
  { label: 'Special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: 'white', color: '#111827',
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const pw = watch('password', '');
  const strength = getStrength(pw);

  const onSubmit = async (data) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';
      setError(msg);
      toast.error(msg);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '16px', padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Invalid Reset Link</h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Request a new link →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '16px', padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {success ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✅</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Password Reset!</h2>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Your password has been updated. Redirecting to login…</p>
              <Link to="/login" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none', fontSize: '14px' }}>Go to Login →</Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '32px' }}>🔐</div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>Set New Password</h2>
            <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', marginBottom: '28px' }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#991B1B', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>

              <div>
                <label htmlFor="reset-password" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reset-password" {...register('password')} type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters" autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    style={{ ...inputStyle(errors.password), paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9CA3AF' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}

                {/* Strength meter */}
                {pw && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? strengthColor[strength] : '#E5E7EB', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: strengthColor[strength], marginBottom: '8px' }}>{strengthLabel[strength]} password</p>

                    {/* Rules checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {rules.map(r => (
                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: r.test(pw) ? '#16A34A' : '#9CA3AF' }}>
                          <span>{r.test(pw) ? '✓' : '✗'}</span> {r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reset-confirm" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
                <input id="reset-confirm" {...register('confirmPassword')} type="password"
                  placeholder="Repeat password" autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword} style={inputStyle(errors.confirmPassword)} />
                {errors.confirmPassword && <p role="alert" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} style={{
                width: '100%', padding: '12px',
                background: isSubmitting ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}>
                {isSubmitting ? 'Resetting…' : 'Reset Password →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              <Link to="/login" style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}>← Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
