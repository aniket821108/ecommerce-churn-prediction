import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';

const BillingAddress = () => {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const shippingAddress = watch('shippingAddress');

  useEffect(() => {
    if (sameAsShipping) {
      setValue('billingAddress', shippingAddress);
    }
  }, [sameAsShipping, shippingAddress, setValue]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
        Billing Address
      </h2>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={sameAsShipping}
            onChange={(e) => setSameAsShipping(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Same as shipping address</span>
        </label>
      </div>

      {!sameAsShipping && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              {...register('billingAddress.street')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.billingAddress?.street && (
              <p className="mt-1 text-sm text-red-600">{errors.billingAddress.street.message}</p>
            )}
          </div>
          {/* Other billing fields – same as shipping but optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              {...register('billingAddress.city')}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              {...register('billingAddress.state')}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              {...register('billingAddress.zipCode')}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              {...register('billingAddress.country')}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAddress;