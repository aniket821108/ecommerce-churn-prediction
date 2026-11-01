import { useFormContext } from 'react-hook-form';
import {
  BoltIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';

const METHODS = [
  {
    id: 'razorpay',
    title: 'Razorpay Instant Payment',
    badge: 'Recommended',
    desc: 'Instant checkout via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets.',
    icon: <BoltIcon className="w-5 h-5 text-indigo-600" />,
    color: 'indigo',
    active: true,
  },
  {
    id: 'cash_on_delivery',
    title: 'Cash on Delivery (COD)',
    badge: null,
    desc: 'Pay cash or UPI upon delivery at your doorstep when your package arrives.',
    icon: <BanknotesIcon className="w-5 h-5 text-emerald-600" />,
    color: 'emerald',
    active: true,
  },
  {
    id: 'stripe',
    title: 'International Card (Stripe)',
    badge: 'Coming Soon',
    desc: 'Direct USD/EUR international currency credit card processing.',
    icon: <CreditCardIcon className="w-5 h-5 text-slate-400" />,
    color: 'slate',
    active: false,
  },
];

const PaymentMethod = () => {
  const { register, watch, setValue } = useFormContext();
  const selected = watch('paymentMethod') || 'razorpay';

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-100 shadow-sm font-sans space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xs">
          3
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Select Payment Method
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Choose your preferred secure payment instrument.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {METHODS.map((method) => {
          const isSelected = selected === method.id;

          if (!method.active) {
            return (
              <div
                key={method.id}
                className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 opacity-50 cursor-not-allowed"
              >
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
                <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-500">
                      {method.title}
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      {method.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {method.desc}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <label
              key={method.id}
              onClick={() => setValue('paymentMethod', method.id, { shouldValidate: true })}
              className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                value={method.id}
                {...register('paymentMethod')}
                className="sr-only"
              />

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {method.id === 'razorpay' ? (
                  <BoltIcon className="w-5 h-5 text-current" />
                ) : (
                  <BanknotesIcon className="w-5 h-5 text-current" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-black text-slate-900">
                    {method.title}
                  </p>
                  {method.badge && (
                    <Badge variant="primary" size="sm" className="font-bold">
                      {method.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
                  {method.desc}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Security Assurance Footer */}
      <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
        <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Cryptographically verified 256-bit HMAC transaction channel.</span>
      </div>
    </div>
  );
};

export default PaymentMethod;