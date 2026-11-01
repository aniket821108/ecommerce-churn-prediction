import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const schema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const [loading, setLoading] = useState(false);

  // Safe redirect — only allow relative internal paths
  const nextParam = searchParams.get('next');
  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? decodeURIComponent(nextParam)
      : '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await loginWithCredentials(data.email, data.password, data.rememberMe);
      toast.success('Signed in successfully! 👋');
      navigate(safeNext, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white relative overflow-hidden">
        {/* Subtle decorative glow orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -ml-20 -mt-20" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mb-20" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              E
            </div>
            <span className="text-xl font-black tracking-tight text-white">E-Shop</span>
          </Link>
        </div>

        {/* Brand Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>Welcome Back</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Your shopping journey continues here.
          </h2>

          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Access your orders, track live package dispatches, and manage your saved addresses with secure HttpOnly authenticated sessions.
          </p>

          <div className="space-y-3 pt-4 border-t border-white/10">
            {[
              { icon: ShieldCheckIcon, text: 'End-to-end encrypted user authentication' },
              { icon: ShoppingBagIcon, text: 'Instant reorder from purchase history' },
              { icon: SparklesIcon, text: 'Personalized product recommendations' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} E-Shop Inc. All rights reserved.
        </div>
      </div>

      {/* ── Right Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign in to E-Shop
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Don’t have an account?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                Create one now
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
              required
            />

            <Input
              label="Password"
              isPassword
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
              required
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                loadingText="Signing in..."
                fullWidth
              >
                Sign In →
              </Button>
            </div>
          </form>

          {/* Quick Demo Hint for Assessment */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center text-xs text-slate-500 font-medium">
            <span>Customer or Admin account? Session cookies automatically handle role routing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
