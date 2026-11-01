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
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import {
  CheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LockClosedIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BoltIcon,
  BanknotesIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const checkoutSchema = z.object({
  shippingAddress: z.object({
    street: z.string().trim().min(3, 'Street address must be at least 3 characters'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State is required'),
    zipCode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    country: z.string().min(1, 'Country is required').default('India'),
    phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
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

// Load Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const WIZARD_STEPS = [
  { id: 1, key: 'shipping', label: 'Shipping Address' },
  { id: 2, key: 'payment', label: 'Payment Method' },
  { id: 3, key: 'review', label: 'Review & Confirm' },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, fetchCart, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Admin guard: Admins cannot shop or checkout
  useEffect(() => {
    if (user?.role === 'admin') {
      toast.error('Admin accounts cannot place customer orders.');
      navigate('/admin');
      return;
    }
    fetchCart();
  }, [user, navigate, fetchCart]);

  // Empty cart guard
  useEffect(() => {
    if (user?.role !== 'admin' && items.length === 0 && !loading) {
      navigate('/cart');
    }
  }, [items, navigate, loading, user?.role]);

  const methods = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
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
      paymentMethod: 'razorpay',
      notes: '',
    },
  });

  // Step 1 Validation & Progression
  const handleProceedToPayment = async () => {
    const isStep1Valid = await methods.trigger('shippingAddress');
    if (isStep1Valid) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Please complete all required shipping fields accurately.');
    }
  };

  // Step 2 Validation & Progression
  const handleProceedToReview = async () => {
    const isPaymentValid = await methods.trigger('paymentMethod');
    if (isPaymentValid) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── COD Order Placement ──────────────────────────────────
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

  // ── Razorpay Order Placement with HMAC Verification ─────
  const handleRazorpay = async (data) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load Razorpay payment gateway. Please retry.');
      return;
    }

    const orderData = {
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress?.street ? data.billingAddress : data.shippingAddress,
      paymentMethod: 'razorpay',
      notes: data.notes,
    };

    // 1. Create order on backend (reserves inventory atomically)
    const orderResponse = await orderService.createFromCart(orderData);
    const order = orderResponse.data.order;

    // 2. Generate server-side Razorpay order
    const rzpOrderResponse = await orderService.createRazorpayOrder(order._id);
    const rzpData = rzpOrderResponse.data;

    // 3. Open Razorpay checkout modal
    const options = {
      key: rzpData.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: Math.round(order.total * 100),
      currency: 'INR',
      name: 'E-Shop Platform',
      description: `Order #${order.orderNumber}`,
      order_id: rzpData.orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: data.shippingAddress.phone || user?.phone || '',
      },
      theme: { color: '#4f46e5' },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled. You can retry from your orders page.');
          setLoading(false);
          navigate(`/orders/${order._id}`);
        },
      },
      handler: async (razorpayResponse) => {
        try {
          // Cryptographic HMAC-SHA256 verification on backend
          await orderService.verifyRazorpayPayment(order._id, {
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          });
          toast.success('Payment verified successfully! 🎉');
          await clearCart();
          navigate(`/orders/${order._id}`);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Payment verification failed.');
          navigate(`/orders/${order._id}`);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      setLoading(false);
      navigate(`/orders/${order._id}`);
    });
    rzp.open();
  };

  // Main Submit Handler
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

  const formValues = methods.watch();
  const selectedPaymentMethod = formValues.paymentMethod;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 font-sans">
      {/* ── Page Header ── */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
            Checkout
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Your Order
          </h1>
        </div>
        <Link
          to="/cart"
          className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          <span>← Back to Cart</span>
        </Link>
      </div>

      {/* ── Interactive Multi-Step Stepper ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {WIZARD_STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    // Allow clicking completed previous steps
                    if (s.id < currentStep) setCurrentStep(s.id);
                  }}
                  disabled={s.id > currentStep}
                  className={`flex items-center gap-2.5 text-left transition-all ${
                    s.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs ring-4 ring-indigo-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckIcon className="w-4 h-4 stroke-[3]" /> : s.id}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-indigo-600 font-black' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Upcoming'}
                    </p>
                  </div>
                </button>

                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-6 rounded-full transition-all ${
                      currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Form Body & Wizard Sections ── */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            {/* Left 2 Columns: Active Wizard Step Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* ── STEP 1: Shipping Address ── */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <ShippingAddress />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleProceedToPayment}
                      variant="primary"
                      size="lg"
                      className="px-8 shadow-md"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Payment Method & Billing ── */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <PaymentMethod />
                  <BillingAddress />
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      size="md"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                      <span>Back to Shipping</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProceedToReview}
                      variant="primary"
                      size="lg"
                      className="px-8 shadow-md"
                    >
                      <span>Review Order</span>
                      <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Order Review & Confirmation ── */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Shipping & Payment Recap Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Destination Recap */}
                    <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <MapPinIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Delivery To
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {formValues.shippingAddress?.street}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {formValues.shippingAddress?.city}, {formValues.shippingAddress?.state} – {formValues.shippingAddress?.zipCode}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        📞 +91 {formValues.shippingAddress?.phone}
                      </p>
                    </div>

                    {/* Payment Method Recap */}
                    <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <CreditCardIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Payment Method
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {selectedPaymentMethod === 'razorpay' ? (
                          <>
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                              <BoltIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">Razorpay Gateway</p>
                              <p className="text-[11px] text-slate-500 font-medium">Instant UPI, Cards & NetBanking</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                              <BanknotesIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">Cash on Delivery</p>
                              <p className="text-[11px] text-slate-500 font-medium">Pay at Doorstep upon Arrival</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-2.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                      Special Delivery Instructions (Optional)
                    </label>
                    <textarea
                      {...methods.register('notes')}
                      rows={2}
                      placeholder="e.g. Ring doorbell, leave package with security guard, landmark details…"
                      className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  {/* Step 3 Navigation Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      size="md"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                      <span>Back to Payment</span>
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="primary"
                      size="lg"
                      className="px-8 shadow-md"
                    >
                      {loading ? (
                        <span>Processing Order…</span>
                      ) : selectedPaymentMethod === 'razorpay' ? (
                        <>
                          <BoltIcon className="w-4 h-4 mr-1.5" />
                          <span>Pay with Razorpay</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-1.5 stroke-[3]" />
                          <span>Confirm Order (COD)</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (Visible on all steps) */}
            <div className="lg:col-span-1 space-y-4">
              <OrderSummary />

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Statutory GST Invoice Guaranteed</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Verifiable digital tax invoice PDF will be generated immediately upon order creation.
                </p>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Checkout;