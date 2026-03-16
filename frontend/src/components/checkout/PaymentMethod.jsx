import { useFormContext } from 'react-hook-form';

const PAYMENT_METHODS = [
  {
    id: 'cash_on_delivery',
    name: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    icon: '💵',
    color: '#10b981',
    bg: '#ecfdf5',
    active: true,
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    desc: 'UPI, cards, netbanking & wallets',
    icon: '⚡',
    color: '#6366f1',
    bg: '#eef2ff',
    active: true,
  },
  {
    id: 'stripe',
    name: 'Credit / Debit Card',
    desc: 'Powered by Stripe — coming soon',
    icon: '💳',
    color: '#0891b2',
    bg: '#ecfeff',
    active: false,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    desc: 'Coming soon',
    icon: '🅿️',
    color: '#1d4ed8',
    bg: '#eff6ff',
    active: false,
  },
];

const PaymentMethod = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const selected = watch('paymentMethod');

  return (
    <div className="rounded-2xl p-6"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>3</div>
        <h2 className="text-base font-black text-gray-900">Payment Method</h2>
      </div>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selected === method.id;

          if (!method.active) {
            return (
              <div key={method.id}
                className="flex items-center gap-4 p-4 rounded-xl cursor-not-allowed"
                style={{ border: '1.5px solid #e5e7eb', background: '#fafafa', opacity: 0.45 }}>
                <div className="w-5 h-5 rounded-full flex-shrink-0"
                  style={{ border: '2px solid #d1d5db', background: '#fff' }} />
                <span className="text-2xl flex-shrink-0">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-500">{method.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{method.desc}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                  Coming Soon
                </span>
              </div>
            );
          }

          return (
            <label key={method.id}
              className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-150"
              style={{
                border: `1.5px solid ${isSelected ? method.color : '#e5e7eb'}`,
                background: isSelected ? method.bg : '#fafafa',
                boxShadow: isSelected ? `0 0 0 1px ${method.color}33` : 'none',
              }}>
              <input type="radio" value={method.id} {...register('paymentMethod')} className="sr-only" />
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  border: `2px solid ${isSelected ? method.color : '#d1d5db'}`,
                  background: isSelected ? method.color : '#fff',
                }}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="text-2xl flex-shrink-0">{method.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{method.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{method.desc}</p>
              </div>
              {isSelected && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: method.bg, color: method.color }}>
                  Selected
                </span>
              )}
            </label>
          );
        })}
      </div>

      {errors.paymentMethod && (
        <p className="mt-2 text-xs font-medium" style={{ color: '#ef4444' }}>
          {errors.paymentMethod.message}
        </p>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #f8fafc' }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-gray-400">Your payment information is encrypted and secure.</p>
      </div>
    </div>
  );
};

export default PaymentMethod;