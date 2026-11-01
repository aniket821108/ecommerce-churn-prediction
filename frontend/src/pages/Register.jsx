import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  ShieldCheckIcon,
  TruckIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    phone: z.string().trim().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character (!@#$%^&*)'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const pw = watch('password', '');

  // Password criteria verification checklist
  const criteria = [
    { label: 'At least 8 characters', valid: pw.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(pw) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(pw) },
    { label: 'One special symbol (!@#$...)', valid: /[^A-Za-z0-9]/.test(pw) },
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success('6-digit security code sent to your email! 📧');
      navigate('/verify-otp', { state: { email: data.email, name: data.name } });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white relative overflow-hidden">
        {/* Subtle decorative glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-white to-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shadow-sm">
              E
            </div>
            <span className="text-xl font-black tracking-tight text-white">E-Shop</span>
          </Link>
        </div>

        {/* Brand Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Retail Experience</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Start shopping with confidence and speed.
          </h2>

          <p className="text-sm text-indigo-200 font-medium leading-relaxed">
            Create your account to unlock AI-powered visual catalog search, live delivery tracking, and member-exclusive discount offers.
          </p>

          <div className="space-y-3 pt-4 border-t border-white/10">
            {[
              { icon: ShieldCheckIcon, text: 'Cryptographic HMAC verified payments' },
              { icon: TruckIcon, text: 'Real-time turn-by-turn delivery tracking' },
              { icon: SparklesIcon, text: 'AI Gemini Vision instant catalog matching' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-indigo-300">
          © {new Date().getFullYear()} E-Shop Inc. All rights reserved.
        </div>
      </div>

      {/* ── Right Registration Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              error={errors.name?.message}
              {...register('name')}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="10-digit phone number"
              error={errors.phone?.message}
              {...register('phone')}
              required
            />

            <Input
              label="Password"
              isPassword
              placeholder="Minimum 8 characters"
              error={errors.password?.message}
              {...register('password')}
              required
            />

            {/* Live Password Strength Criteria */}
            {pw && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {criteria.map((c) => (
                    <div
                      key={c.label}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${
                        c.valid ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {c.valid ? (
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="truncate">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Input
              label="Confirm Password"
              isPassword
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                loadingText="Creating account..."
                fullWidth
              >
                Continue to Verification →
              </Button>
            </div>
          </form>

          <p className="text-[11px] text-center text-slate-400 font-medium leading-relaxed">
            By creating an account, you agree to E-Shop’s{' '}
            <span className="text-slate-600 underline">Terms of Service</span> and{' '}
            <span className="text-slate-600 underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
