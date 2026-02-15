import { useFormContext } from 'react-hook-form';

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', name: 'Cash on Delivery', icon: '💵' },
  { id: 'razorpay', name: 'Razorpay', icon: '💳' },
  { id: 'stripe', name: 'Credit/Debit Card (Stripe)', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️' },
];

const PaymentMethod = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
        Payment Method
      </h2>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value={method.id}
              {...register('paymentMethod')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 flex items-center">
              <span className="text-xl mr-2">{method.icon}</span>
              <span className="text-sm font-medium text-gray-700">{method.name}</span>
            </span>
          </label>
        ))}
        {errors.paymentMethod && (
          <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;