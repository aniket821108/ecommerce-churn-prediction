import { useFormContext } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import {
  MapPinIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Chandigarh', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const ShippingAddress = () => {
  const { register, setValue, formState: { errors } } = useFormContext();
  const { user } = useAuthStore();
  const e = errors.shippingAddress || {};

  const handleUseSavedAddress = () => {
    if (!user?.address) return;
    setValue('shippingAddress.street', user.address.street || '', { shouldValidate: true });
    setValue('shippingAddress.city', user.address.city || '', { shouldValidate: true });
    setValue('shippingAddress.state', user.address.state || '', { shouldValidate: true });
    setValue('shippingAddress.zipCode', user.address.zipCode || '', { shouldValidate: true });
    setValue('shippingAddress.country', user.address.country || 'India', { shouldValidate: true });
    if (user.phone) {
      setValue('shippingAddress.phone', user.phone, { shouldValidate: true });
    }
  };

  const hasSavedAddress = Boolean(user?.address?.street && user?.address?.city);

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-100 shadow-sm font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xs">
            1
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Shipping & Delivery Address
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Where should we deliver your order?
            </p>
          </div>
        </div>

        {hasSavedAddress && (
          <button
            type="button"
            onClick={handleUseSavedAddress}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all active:scale-95 shrink-0"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Use Profile Address</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Street Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Street Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('shippingAddress.street')}
              placeholder="Flat / House No., Building, Street Name, Area"
              className={`w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400 ${
                e.street ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
          </div>
          {e.street && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{e.street.message}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            City <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('shippingAddress.city')}
            placeholder="e.g. Mumbai, New Delhi, Bengaluru"
            className={`w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400 ${
              e.city ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {e.city && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{e.city.message}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            State / Union Territory <span className="text-rose-500">*</span>
          </label>
          <select
            {...register('shippingAddress.state')}
            className={`w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 font-medium cursor-pointer ${
              e.state ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          >
            <option value="">Select Delivery State</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {e.state && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{e.state.message}</p>
          )}
        </div>

        {/* PIN Code */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            PIN Code (Postal Code) <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('shippingAddress.zipCode')}
            maxLength={6}
            placeholder="6-digit Indian PIN (e.g. 400001)"
            className={`w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400 ${
              e.zipCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {e.zipCode && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{e.zipCode.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Country <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('shippingAddress.country')}
            readOnly
            defaultValue="India"
            className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Delivery Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-xs font-bold text-slate-400 pointer-events-none">
              +91
            </span>
            <input
              {...register('shippingAddress.phone')}
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number for dispatch updates"
              className={`w-full pl-14 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400 ${
                e.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
          </div>
          {e.phone && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{e.phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;