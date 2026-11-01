import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/\d/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special symbol'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
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

  const criteria = [
    { label: 'At least 8 characters', valid: pw.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(pw) },
    { label: 'One numeric digit', valid: /\d/.test(pw) },
    { label: 'One special symbol', valid: /[^A-Za-z0-9]/.test(pw) },
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setSuccess(true);
      toast.success('Password updated successfully! 🎉');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed or token expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6 text-center">
        {!success ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
              <LockClosedIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Choose a strong, memorable new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
              <Input
                label="New Password"
                isPassword
                placeholder="Minimum 8 characters"
                error={errors.password?.message}
                {...register('password')}
                required
              />

              {/* Password strength checklist */}
              {pw && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Security Requirements:
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
                label="Confirm New Password"
                isPassword
                placeholder="Re-enter new password"
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
                  loadingText="Updating password..."
                  fullWidth
                >
                  Save New Password →
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
              <CheckCircleIcon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Password Reset!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Your password has been successfully updated. Redirecting you to sign in...
              </p>
            </div>

            <Link to="/login" className="block pt-2">
              <Button variant="primary" size="md" fullWidth>
                Sign in with New Password
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
