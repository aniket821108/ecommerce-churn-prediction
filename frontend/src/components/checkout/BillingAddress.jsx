import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';

const inputStyle = (focused) => ({
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  fontSize: '14px', outline: 'none',
  background: focused ? '#fff' : '#f9fafb',
  border: `1.5px solid ${focused ? '#4f46e5' : '#e5e7eb'}`,
  color: '#111827', transition: 'all 0.15s',
  boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
});

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#9ca3af', marginBottom: '6px',
};

const FocusInput = ({ registerProps, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input {...registerProps} {...props}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

const BillingAddress = () => {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const shippingAddress = watch('shippingAddress');

  useEffect(() => {
    if (sameAsShipping) setValue('billingAddress', shippingAddress);
  }, [sameAsShipping, shippingAddress, setValue]);

  return (
    <div className="rounded-2xl p-6"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>2</div>
        <h2 className="text-base font-black text-gray-900">Billing Address</h2>
      </div>

      {/* Same as shipping toggle */}
      <div
        className="flex items-center gap-3 p-3.5 rounded-xl mb-5 cursor-pointer"
        style={{ background: sameAsShipping ? '#f5f3ff' : '#f9fafb', border: `1.5px solid ${sameAsShipping ? '#c4b5fd' : '#e5e7eb'}` }}
        onClick={() => setSameAsShipping(s => !s)}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: sameAsShipping ? '#4f46e5' : '#fff', border: `1.5px solid ${sameAsShipping ? '#4f46e5' : '#d1d5db'}` }}
        >
          {sameAsShipping && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm font-semibold" style={{ color: sameAsShipping ? '#4f46e5' : '#6b7280' }}>
          Same as shipping address
        </span>
      </div>

      {!sameAsShipping && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label style={labelStyle}>Street Address</label>
            <FocusInput registerProps={register('billingAddress.street')} placeholder="House no., street, area" />
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <FocusInput registerProps={register('billingAddress.city')} placeholder="City" />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <FocusInput registerProps={register('billingAddress.state')} placeholder="State" />
          </div>
          <div>
            <label style={labelStyle}>PIN Code</label>
            <FocusInput registerProps={register('billingAddress.zipCode')} placeholder="6-digit PIN" />
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <FocusInput registerProps={register('billingAddress.country')} placeholder="India" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAddress;