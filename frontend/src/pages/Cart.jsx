import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Loader from '../components/common/Loader';
import { EmptyState } from '../components/ui/EmptyState';

const Cart = () => {
  const { items, subtotal, loading, fetchCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => { 
    if (!isAdmin) fetchCart(); 
  }, [isAdmin, fetchCart]);

  if (loading) return <Loader />;

  // ── Admin State ──
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center text-center px-4 font-sans">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-purple-50 text-purple-600">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          Cart Disabled for Admin
        </h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm">
          Administrative accounts cannot maintain a customer shopping cart or checkout orders. To place customer orders, please log in with a standard customer account.
        </p>
        <Link to="/admin"
          className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md bg-gradient-to-r from-indigo-600 to-violet-600">
          Go to Admin Dashboard
        </Link>
      </div>
    );
  }

  const discount = 0;
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.18;
  const total = subtotal + tax + shipping - discount;

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore our curated catalog to discover amazing products!"
          actionLabel="Start Shopping"
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans">

      {/* Header */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart
            <span className="ml-3 text-lg font-bold text-slate-400">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>
        <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            tax={tax}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;