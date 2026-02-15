import { FormProvider } from 'react-hook-form';
import ShippingAddress from './ShippingAddress';
import BillingAddress from './BillingAddress';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';

const CheckoutForm = ({ methods, onSubmit, children }) => {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ShippingAddress />
          <BillingAddress />
          <PaymentMethod />
        </div>
        <div className="lg:col-span-1">
          {children}
        </div>
      </form>
    </FormProvider>
  );
};

export default CheckoutForm;