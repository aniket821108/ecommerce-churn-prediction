import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Chandigarh', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const BillingAddress = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const shippingAddress = watch('shippingAddress');
  const e = errors.billingAddress || {};

  useEffect(() => {
    if (sameAsShipping) {
      setValue('billingAddress', shippingAddress);
    }
  }, [sameAsShipping, shippingAddress, setValue]);

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-100 shadow-sm font-sans space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xs">
          2
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Billing Address
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Address used for generating your statutory GST Tax Invoice.
          </p>
        </div>
      </div>

      {/* Same as shipping address toggle checkbox card */}
      <div
        onClick={() => setSameAsShipping((s) => !s)}
        className={`flex items-center gap-3.5 p-4 rounded-2xl cursor-pointer transition-all border ${
          sameAsShipping
            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
            sameAsShipping
              ? 'bg-indigo-600 text-white'
              : 'border-2 border-slate-300 bg-white'
          }`}
        >
          {sameAsShipping && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold">
            Same as shipping address
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            The statutory tax invoice will be billed to the shipping location.
          </p>
        </div>
      </div>

      {!sameAsShipping && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Billing Street Address
            </label>
            <input
              {...register('billingAddress.street')}
              placeholder="Flat / House No., Building, Area"
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Billing City
            </label>
            <input
              {...register('billingAddress.city')}
              placeholder="City"
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Billing State
            </label>
            <select
              {...register('billingAddress.state')}
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 font-medium cursor-pointer"
            >
              <option value="">Select Billing State</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              PIN Code
            </label>
            <input
              {...register('billingAddress.zipCode')}
              maxLength={6}
              placeholder="6-digit PIN"
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Country
            </label>
            <input
              {...register('billingAddress.country')}
              readOnly
              defaultValue="India"
              className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAddress;