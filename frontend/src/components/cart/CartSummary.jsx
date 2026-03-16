import { Link } from 'react-router-dom';

const Row = ({ label, value, highlight, free, sub }) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${sub ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-indigo-600 font-black text-base' : free ? 'text-emerald-600' : 'text-gray-800'}`}>
      {value}
    </span>
  </div>
);

const CartSummary = ({ subtotal = 0, discount = 0, shipping = 0, tax = 0, total = 0 }) => {
  return (
    <div className="rounded-2xl overflow-hidden sticky top-24"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Order Summary</h2>
      </div>

      <div className="px-6 py-5 space-y-3">
        <Row label="Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
        {discount > 0 && <Row label="Discount" value={`-₹${discount.toLocaleString('en-IN')}`} sub />}
        <Row
          label={shipping === 0 ? 'Shipping 🎉' : 'Shipping'}
          value={shipping === 0 ? 'Free' : `₹${shipping}`}
          free={shipping === 0}
        />
        <Row label="Tax (18% GST)" value={`₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub />

        {/* Divider */}
        <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

        <Row label="Total" value={`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} highlight />
      </div>

      {/* Free shipping nudge */}
      {subtotal < 1000 && subtotal > 0 && (
        <div className="mx-6 mb-4 px-4 py-3 rounded-xl"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p className="text-xs font-semibold text-emerald-700">
            🚚 Add ₹{(1000 - subtotal).toLocaleString('en-IN')} more for free shipping!
          </p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#d1fae5' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((subtotal / 1000) * 100, 100)}%`, background: '#10b981' }} />
          </div>
        </div>
      )}

      <div className="px-6 pb-6">
        <Link to="/checkout"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] active:scale-95"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
          Proceed to Checkout
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {['🔒 Secure', '↩️ Returns', '✅ Genuine'].map(b => (
            <span key={b} className="text-xs text-gray-400 font-medium">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartSummary;