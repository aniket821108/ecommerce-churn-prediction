import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const schema = z.object({
  email:      z.string().email('Invalid email address'),
  password:   z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: `1.5px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  background: 'white', color: '#111827', transition: 'border-color 0.15s',
});

const Field = ({ label, error, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
      {label}
    </label>
    {children}
    {error && <p role="alert" aria-live="polite" style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const [showPw, setShowPw] = useState(false);

  // Safe redirect — only allow relative internal paths
  const nextParam = searchParams.get('next');
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? decodeURIComponent(nextParam) : '/';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data) => {
    try {
      await loginWithCredentials(data.email, data.password, data.rememberMe);
      toast.success('Logged in successfully!');
      navigate(safeNext, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f9fafb' }}>

      {/* ── Left: Brand panel ── */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'none', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '48px', color: 'white',
      }} className="md:flex">
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛒</div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>Welcome Back</h1>
        <p style={{ fontSize: '16px', opacity: 0.85, textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 }}>
          Sign in to access your account, track orders, and discover amazing deals.
        </p>
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {['🔒 Secure Authentication', '📦 Track Your Orders', '💰 Exclusive Member Deals'].map(f => (
            <div key={f} style={{ fontSize: '15px', opacity: 0.9 }}>{f}</div>
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Sign in to E‑Shop</h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '28px' }}>
            Enter your credentials to access your account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>

            <Field label="Email Address" error={errors.email?.message} htmlFor="login-email">
              <input id="login-email" {...register('email')} type="email"
                placeholder="you@example.com" autoComplete="email"
                aria-invalid={!!errors.email} style={inputStyle(errors.email)} />
            </Field>

            <Field label="Password" error={errors.password?.message} htmlFor="login-password">
              <div style={{ position: 'relative' }}>
                <input id="login-password" {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password" autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  style={{ ...inputStyle(errors.password), paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9CA3AF' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>

            {/* Remember Me + Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                <input {...register('rememberMe')} type="checkbox"
                  style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer' }} />
                Remember me
              </label>
              <Link to="/forgot-password"
                style={{ fontSize: '13px', color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} style={{
              width: '100%', padding: '12px',
              background: isSubmitting ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '4px', transition: 'opacity 0.2s',
            }}>
              {isSubmitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}