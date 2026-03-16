import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Loader from '../components/common/Loader';

const Cart = () => {
  const { items, subtotal, loading, fetchCart } = useCartStore();

  useEffect(() => { fetchCart(); }, []);

  if (loading) return <Loader />;

  const discount = 0;
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.18;
  const total = subtotal + tax + shipping - discount;

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: '#f5f3ff' }}>
          <svg className="w-10 h-10" style={{ color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
          Your cart is empty
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">
          Looks like you haven't added anything yet. Start exploring our store!
        </p>
        <Link to="/shop"
          className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Your</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Shopping Cart
            <span className="ml-3 text-lg font-bold text-gray-400">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>
        <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
              style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <div className="divide-y divide-gray-50">
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