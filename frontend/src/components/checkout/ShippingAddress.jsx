import { useFormContext } from 'react-hook-form';

const ShippingAddress = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
        Shipping Address
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
          <input
            {...register('shippingAddress.street')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.street && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.street.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            {...register('shippingAddress.city')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <input
            {...register('shippingAddress.state')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.state && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
          <input
            {...register('shippingAddress.zipCode')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.zipCode.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
          <input
            {...register('shippingAddress.country')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.country && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.country.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            {...register('shippingAddress.phone')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.shippingAddress?.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;