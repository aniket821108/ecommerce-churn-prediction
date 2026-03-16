import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

const inputStyle = (error, focused) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: focused ? '#fff' : '#f9fafb',
  border: `1.5px solid ${error ? '#ef4444' : focused ? '#4f46e5' : '#e5e7eb'}`,
  color: '#111827',
  transition: 'all 0.15s',
  boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.08)' : 'none',
});

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#9ca3af', marginBottom: '6px',
};

const Field = ({ label, error, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && <p className="mt-1.5 text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}
  </div>
);

const FocusInput = ({ registerProps, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...registerProps}
      {...props}
      style={inputStyle(error, focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

const ShippingAddress = () => {
  const { register, formState: { errors } } = useFormContext();
  const e = errors.shippingAddress || {};

  return (
    <div className="rounded-2xl p-6"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>1</div>
        <h2 className="text-base font-black text-gray-900">Shipping Address</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Street Address *" error={e.street?.message}>
            <FocusInput registerProps={register('shippingAddress.street')} error={e.street} placeholder="House no., street, area" />
          </Field>
        </div>
        <Field label="City *" error={e.city?.message}>
          <FocusInput registerProps={register('shippingAddress.city')} error={e.city} placeholder="City" />
        </Field>
        <Field label="State *" error={e.state?.message}>
          <FocusInput registerProps={register('shippingAddress.state')} error={e.state} placeholder="State" />
        </Field>
        <Field label="PIN Code *" error={e.zipCode?.message}>
          <FocusInput registerProps={register('shippingAddress.zipCode')} error={e.zipCode} placeholder="6-digit PIN" />
        </Field>
        <Field label="Country *" error={e.country?.message}>
          <FocusInput registerProps={register('shippingAddress.country')} error={e.country} placeholder="India" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Phone Number *" error={e.phone?.message}>
            <FocusInput registerProps={register('shippingAddress.phone')} error={e.phone} placeholder="10-digit mobile number" type="tel" />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;