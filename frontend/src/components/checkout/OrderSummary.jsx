import useCartStore from '../../store/cartStore';
import { Link } from 'react-router-dom';

const OrderSummary = () => {
  const { items, subtotal } = useCartStore();
  const safeSubtotal = subtotal || 0;
  const shippingCost = safeSubtotal > 1000 ? 0 : 50;
  const taxAmount = safeSubtotal * 0.18;
  const finalTotal = safeSubtotal + taxAmount + shippingCost;

  return (
    <div className="rounded-2xl overflow-hidden sticky top-24"
      style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Your Order</h2>
        <Link to="/cart" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
          Edit cart
        </Link>
      </div>

      {/* Items */}
      <div className="px-6 py-4 space-y-3 max-h-48 overflow-y-auto"
        style={{ borderBottom: '1px solid #f8fafc' }}>
        {items.map((item) => (
          <div key={item.product._id} className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={item.product.images?.[0]?.url || '/placeholder.png'}
                alt={item.product.name}
                className="w-10 h-10 rounded-lg object-cover"
                style={{ border: '1px solid #f1f5f9' }}
              />
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-black"
                style={{ background: '#4f46e5', fontSize: '10px' }}
              >{item.quantity}</span>
            </div>
            <p className="flex-1 text-xs font-medium text-gray-700 line-clamp-2">{item.product.name}</p>
            <p className="text-xs font-black text-gray-900 flex-shrink-0">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-6 py-4 space-y-2.5">
        {[
          { label: 'Subtotal', value: `₹${safeSubtotal.toLocaleString('en-IN')}` },
          { label: 'Shipping', value: shippingCost === 0 ? 'Free 🎉' : `₹${shippingCost}`, green: shippingCost === 0 },
          { label: 'Tax (18% GST)', value: `₹${taxAmount.toFixed(2)}`, muted: true },
        ].map(({ label, value, green, muted }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-xs font-semibold ${green ? 'text-emerald-600' : muted ? 'text-gray-500' : 'text-gray-800'}`}>
              {value}
            </span>
          </div>
        ))}

        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-gray-900">Total</span>
          <span className="text-base font-black" style={{ color: '#4f46e5' }}>
            ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;