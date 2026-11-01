import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { KeyIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const schema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
      toast.success('Reset link dispatched! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6 text-center">
        {!sent ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
              <KeyIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Forgot password?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                No worries! Enter your registered email address and we'll send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  loadingText="Sending reset link..."
                  fullWidth
                >
                  Send Reset Link →
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
                Check your inbox
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                We sent a secure password reset link to:
              </p>
              <p className="text-sm font-bold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-lg inline-block border border-indigo-100">
                {getValues('email')}
              </p>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Didn't receive an email? Check your spam folder or try again in a few minutes.
            </p>

            <Button
              onClick={() => setSent(false)}
              variant="secondary"
              size="md"
              fullWidth
            >
              Try another email
            </Button>
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
