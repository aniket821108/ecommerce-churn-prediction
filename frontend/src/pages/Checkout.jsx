import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderService } from '../services/orderService';
import ShippingAddress from '../components/checkout/ShippingAddress';
import BillingAddress from '../components/checkout/BillingAddress';
import PaymentMethod from '../components/checkout/PaymentMethod';
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
    phone: z.string().length(10, 'Phone must be 10 digits'),
  }),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'razorpay', 'credit_card', 'debit_card', 'paypal', 'stripe']),
  notes: z.string().optional(),
});

// ── Load Razorpay script dynamically ─────────────────────
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const STEPS = ['Shipping', 'Billing', 'Payment', 'Review'];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, subtotal, fetchCart, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCart(); }, []);
  useEffect(() => {
    if (items.length === 0 && !loading) navigate('/cart');
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

  // ── COD Checkout ──────────────────────────────────────
  const handleCOD = async (data) => {
    const orderData = {
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress?.street ? data.billingAddress : data.shippingAddress,
      paymentMethod: 'cash_on_delivery',
      notes: data.notes,
    };
    const response = await orderService.createFromCart(orderData);
    toast.success('Order placed successfully! 🎉');
    await clearCart();
    navigate(`/orders/${response.data.order._id}`);
  };

  // ── Razorpay Checkout ─────────────────────────────────
  const handleRazorpay = async (data) => {
    // 1. Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      return;
    }

    // 2. Create order on backend first
    const orderData = {
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress?.street ? data.billingAddress : data.shippingAddress,
      paymentMethod: 'razorpay',
      notes: data.notes,
    };
    const orderResponse = await orderService.createFromCart(orderData);
    const order = orderResponse.data.order;

    // 3. Calculate amount in paise
    const amountInPaise = Math.round(order.total * 100);

    // 4. Open Razorpay popup
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      name: 'E-Shop',
      description: `Order #${order.orderNumber}`,
      order_id: order.razorpayOrderId || undefined, // if you generate server-side Razorpay order
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: data.shippingAddress.phone || user?.phone || '',
      },
      theme: { color: '#4f46e5' },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled.');
          setLoading(false);
        },
      },
      handler: async (razorpayResponse) => {
        try {
          // ✅ Use user-accessible confirm-payment route
          await orderService.confirmPayment(order._id, {
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          });
          toast.success('Payment successful! 🎉');
          await clearCart();
          navigate(`/orders/${order._id}`);
        } catch (err) {
          toast.error('Payment done but verification failed. Contact support.');
          navigate(`/orders/${order._id}`);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast.error(`Payment failed: ${response.error.description}`);
      setLoading(false);
    });
    rzp.open();
  };

  // ── Main submit handler ───────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (data.paymentMethod === 'razorpay') {
        await handleRazorpay(data);
      } else {
        await handleCOD(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">

      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Secure</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Checkout
          </h1>
        </div>
        <Link to="/cart" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Cart
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: '#4f46e5', color: '#fff' }}>
                {i + 1}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: '#4f46e5' }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2" style={{ background: '#e5e7eb' }} />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left */}
            <div className="lg:col-span-2 space-y-5">
              <ShippingAddress />
              <BillingAddress />
              <PaymentMethod />

              {/* Notes */}
              <div className="rounded-2xl p-6"
                style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>4</div>
                  <h2 className="text-base font-black text-gray-900">Order Notes</h2>
                  <span className="text-xs text-gray-400 font-medium">(optional)</span>
                </div>
                <textarea
                  {...methods.register('notes')}
                  rows={3}
                  placeholder="Any special instructions for your order or delivery…"
                  className="w-full rounded-xl text-sm outline-none resize-none"
                  style={{ padding: '10px 14px', background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#374151' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-1 space-y-4">
              <OrderSummary />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 20px rgba(79,70,229,0.35)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {methods.watch('paymentMethod') === 'razorpay' ? 'Opening Payment…' : 'Placing Order…'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d={methods.watch('paymentMethod') === 'razorpay'
                          ? 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                          : 'M5 13l4 4L19 7'} />
                    </svg>
                    {methods.watch('paymentMethod') === 'razorpay' ? 'Pay with Razorpay' : 'Place Order'}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                256-bit SSL encrypted checkout
              </p>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Checkout;