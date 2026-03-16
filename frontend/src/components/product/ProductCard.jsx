import { Link } from 'react-router-dom';
import { useState } from 'react';
import useCartStore from '../../store/cartStore';

const ProductCard = ({ product, index = 0 }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    await addItem(product._id, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ── Image Container ── */}
      <Link to={`/product/${product._id}`} className="relative overflow-hidden block bg-gray-50">
        <img
          src={product.images?.[0]?.url || '/placeholder.png'}
          alt={product.name}
          className="w-full h-56 sm:h-52 lg:h-56 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
              Sold Out
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Quick-add button slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out px-3 pb-3">
          <button
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={`w-full py-2 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-200 shadow-lg
              ${isOutOfStock
                ? 'bg-gray-400/80 text-white cursor-not-allowed'
                : added
                ? 'bg-emerald-500/90 text-white'
                : 'bg-white/90 text-gray-900 hover:bg-white'
              }`}
          >
            {isOutOfStock ? 'Out of Stock' : adding ? 'Adding…' : added ? '✓ Added to Cart' : 'Quick Add'}
          </button>
        </div>
      </Link>

      {/* ── Card Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Brand */}
        {product.brand && (
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
            {product.brand}
          </span>
        )}

        {/* Product Name */}
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-indigo-600 transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratings?.average > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(product.ratings.average)
                      ? 'text-amber-400'
                      : 'text-gray-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {product.ratings.average.toFixed(1)}
              {product.ratings.count > 0 && ` (${product.ratings.count})`}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price Row */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Desktop Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
              }`}
          >
            {isOutOfStock ? 'Sold Out' : adding ? '…' : added ? '✓' : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>

        {/* Mobile full-width button */}
        <button
          onClick={handleAddToCart}
          disabled={adding || isOutOfStock}
          className={`sm:hidden w-full py-2 rounded-xl text-sm font-semibold transition-all duration-200 mt-1
            ${isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : added
              ? 'bg-emerald-500 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
        >
          {isOutOfStock ? 'Out of Stock' : adding ? 'Adding…' : added ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;