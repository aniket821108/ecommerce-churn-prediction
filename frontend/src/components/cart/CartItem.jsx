import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import useCartStore from '../../store/cartStore';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1 || loading) return;
    setQuantity(newQty);
    setLoading(true);
    try {
      await updateQuantity(item.product._id, newQty);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeItem(item.product._id);
    } finally {
      setRemoving(false);
    }
  };

  const lineTotal = (item.price * quantity).toLocaleString('en-IN');

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 transition-all duration-200"
      style={{ opacity: removing ? 0.4 : 1 }}
    >
      {/* Image */}
      <Link to={`/product/${item.product._id}`} className="flex-shrink-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden"
          style={{ border: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <img
            src={item.product.images?.[0]?.url || '/placeholder.png'}
            alt={item.product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Name + brand — col-span-4 */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product._id}`}>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
            {item.product.name}
          </h3>
        </Link>
        {item.product.brand && (
          <p className="text-xs text-gray-400 mt-0.5 font-medium">{item.product.brand}</p>
        )}
        {/* Mobile price */}
        <p className="text-sm font-bold text-indigo-600 mt-1 sm:hidden">
          ₹{item.price.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Unit price — hidden on mobile */}
      <div className="hidden sm:block w-20 text-center">
        <span className="text-sm font-semibold text-gray-700">
          ₹{item.price.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Quantity control */}
      <div className="flex items-center rounded-xl overflow-hidden flex-shrink-0"
        style={{ border: '1.5px solid #e5e7eb' }}>
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1 || loading}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 text-lg font-bold"
        >−</button>
        <span className="w-8 text-center text-sm font-bold text-gray-900"
          style={{ borderLeft: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb', lineHeight: '32px' }}>
          {loading ? (
            <svg className="animate-spin w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="4" />
              <path className="opacity-75" fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : quantity}
        </span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={loading}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-30 text-lg font-bold"
        >+</button>
      </div>

      {/* Line total */}
      <div className="hidden sm:block w-20 text-right">
        <span className="text-sm font-black text-gray-900">₹{lineTotal}</span>
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
        style={{ color: '#9ca3af' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CartItem;