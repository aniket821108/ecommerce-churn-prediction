import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderService } from '../services/orderService';
import CheckoutForm from '../components/checkout/CheckoutForm';
import OrderSummary from '../components/checkout/OrderSummary';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const checkoutSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().length(6, 'ZIP code must be 6 digits'),
    country: z.string().min(1, 'Country is required').default('India'),
    phone: z.string().length(10, 'Phone number must be 10 digits'),
  }),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'razorpay', 'stripe']),
  notes: z.string().optional(),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, subtotal, fetchCart, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      navigate('/cart');
    }
  }, [items, navigate, loading]);

  const methods = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || 'India',
        phone: user?.phone || '',
      },
      billingAddress: {},
      paymentMethod: 'cash_on_delivery',
      notes: '',
    },
  });

  const tax = subtotal * 0.18;
  const shippingCost = subtotal > 1000 ? 0 : 50;
  const discount = 0;
  const total = subtotal + tax + shippingCost - discount;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const orderData = {
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress?.street ? data.billingAddress : data.shippingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      };
      const response = await orderService.createFromCart(orderData);
      toast.success('Order placed successfully!');
      await clearCart();
      navigate(`/orders/${response.data.order._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <CheckoutForm methods={methods} onSubmit={onSubmit}>
        <OrderSummary
          subtotal={subtotal}
          tax={tax}
          shippingCost={shippingCost}
          discount={discount}
          total={total}
        />
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </CheckoutForm>
    </div>
  );
};

export default Checkout;