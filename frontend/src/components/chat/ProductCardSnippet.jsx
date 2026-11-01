import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon, CheckIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ProductCardSnippet = ({ product }) => {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();

  if (!product) return null;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (user?.role === 'admin') {
      toast.error('Admins cannot make purchases. Use a customer account.');
      return;
    }


    if (product.stock <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    setAdding(true);
    try {
      await addItem(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (_) {
      // Error is already toasted by store
    } finally {
      setAdding(false);
    }
  };

  const discountPercent =
    product.discountPercent ||
    (product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0);

  const productUrl = `/product/${product._id}`;

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden text-left w-full max-w-[240px] flex-shrink-0">
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
              e.target.parentElement.innerHTML = '<span class="text-xs text-slate-400 font-medium">No Image</span>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
            No Image
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* In-Stock Indicator */}
        <span
          className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md shadow-xs ${
            product.stock <= 0
              ? 'bg-rose-100/90 text-rose-700 border border-rose-200'
              : product.stock <= 5
              ? 'bg-amber-100/90 text-amber-800 border border-amber-200'
              : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
          }`}
        >
          {product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `${product.stock} left` : 'In stock'}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Brand & Category */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-0.5 truncate">
            {product.brand || product.category || 'E-Shop'}
          </div>

          {/* Title */}
          <Link
            to={productUrl}
            className="text-xs font-semibold text-slate-900 hover:text-violet-600 transition-colors line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through">
                ₹{Number(product.compareAtPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
          <Link
            to={productUrl}
            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            <span>View</span>
            <ArrowTopRightOnSquareIcon className="w-3 h-3 text-slate-500" />
          </Link>

          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock <= 0}
            className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg shadow-xs transition-all ${
              product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95'
            }`}
          >
            {adding ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : added ? (
              <>
                <CheckIcon className="w-3 h-3 stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBagIcon className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSnippet;

