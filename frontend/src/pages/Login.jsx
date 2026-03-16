import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Shared input component ────────────────────────────────
const FormInput = ({ label, error, icon, type = 'text', register, showToggle, onToggle, showPassword, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: '6px' }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? '#4f46e5' : '#9ca3af' }}>
            {icon}
          </div>
        )}
        <input
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          {...register}
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `11px ${showToggle ? '44px' : '14px'} 11px ${icon ? '42px' : '14px'}`,
            borderRadius: '12px',
            fontSize: '14px',
            outline: 'none',
            background: focused ? '#fff' : '#f9fafb',
            border: `1.5px solid ${error ? '#ef4444' : focused ? '#4f46e5' : '#e5e7eb'}`,
            color: '#111827',
            transition: 'all 0.15s',
            boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
          }}
        />
        {showToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: '#9ca3af' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={showPassword
                  ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                  : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                }
              />
            </svg>
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 flex" style={{ top: '64px' }}> {/* offset for sticky header */}

      {/* ── Left: Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo mark */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>E</div>
            <span className="font-black text-gray-900" style={{ letterSpacing: '-0.03em' }}>E‑Shop</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">Sign in to your account to continue shopping.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Email Address"
              type="email"
              register={register('email')}
              error={errors.email?.message}
              placeholder="you@example.com"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <FormInput
              label="Password"
              register={register('password')}
              error={errors.password?.message}
              placeholder="Enter your password"
              showToggle
              showPassword={showPassword}
              onToggle={() => setShowPassword(p => !p)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.35)', marginTop: '8px' }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
            <span className="text-xs text-gray-400 font-medium">New to E‑Shop?</span>
            <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
          </div>

          <Link to="/register"
            className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ background: '#f5f3ff', color: '#4f46e5', border: '1.5px solid #e0e7ff' }}>
            Create a free account →
          </Link>

          {/* Trust note */}
          <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured with 256-bit SSL encryption
          </p>
        </div>
      </div>

      {/* ── Right: Visual Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: '#7c3aed' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: '#4f46e5' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 px-12 text-center">
          {/* Big emoji / icon */}
          <div className="text-7xl mb-8">🛍️</div>

          <h2 className="text-3xl font-black text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            Shop smarter,<br />
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              not harder.
            </span>
          </h2>
          <p className="text-indigo-300 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
            Thousands of genuine products, fast delivery, and easy returns — all in one place.
          </p>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '10K+', label: 'Products' },
              { value: '50K+', label: 'Customers' },
              { value: '4.8★', label: 'Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-8 p-5 rounded-2xl text-left"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5" fill="#fbbf24" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed">
              "Best shopping experience I've had online. Fast delivery and great prices!"
            </p>
            <p className="text-xs text-indigo-400 mt-2 font-semibold">— Priya S., Mumbai</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;