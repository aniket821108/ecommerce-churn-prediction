import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { productService } from '../services/productService';
import useCartStore from '../store/cartStore';
import Loader from '../components/common/Loader';
import ProductGrid from '../components/product/ProductGrid';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────
const Stars = ({ rating = 0, size = 'sm', interactive = false, onRate }) => {
  const [hovered, setHovered] = useState(0);
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i}
          className={`${s} cursor-${interactive ? 'pointer' : 'default'} transition-colors`}
          fill={i <= (interactive ? hovered || rating : Math.round(rating)) ? '#f59e0b' : '#e5e7eb'}
          viewBox="0 0 20 20"
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(i)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Mock reviews (replace with real API when available)
const MOCK_REVIEWS = [
  { id: 1, name: 'Priya S.', location: 'Mumbai', rating: 5, date: '12 Feb 2026', text: 'Absolutely love this product! Quality is top-notch and delivery was super fast.', avatar: 'PS', color: '#ec4899' },
  { id: 2, name: 'Rahul V.', location: 'Delhi', rating: 4, date: '8 Feb 2026', text: 'Great value for money. Exactly as described. Would definitely buy again.', avatar: 'RV', color: '#3b82f6' },
  { id: 3, name: 'Ananya K.', location: 'Bangalore', rating: 5, date: '3 Feb 2026', text: 'Packaging was excellent and the product looks even better in person!', avatar: 'AK', color: '#10b981' },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // ── Queries ──
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
  });

  const { data: relatedData } = useQuery({
    queryKey: ['relatedProducts', data?.data?.product?.category],
    queryFn: () => productService.getProducts({ category: data?.data?.product?.category, limit: 4 }),
    enabled: !!data?.data?.product?.category,
  });

  const product = data?.data?.product;
  const relatedProducts = (relatedData?.data?.products || []).filter(p => p._id !== id).slice(0, 4);

  if (isLoading) return <Loader />;
  if (error || !product) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-bold text-gray-700">Product not found</p>
      <Link to="/shop" className="mt-4 text-sm text-indigo-600 hover:underline">← Back to Shop</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: '/placeholder.png' }];
  const discountPct = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const avgRating = product.ratings?.average || 4.5;
  const reviewCount = product.ratings?.count || MOCK_REVIEWS.length;

  // ── Handlers ──
  const handleAddToCart = async () => {
    if (adding || isOutOfStock) return;
    setAdding(true);
    await addItem(product._id, quantity);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    if (buyingNow || isOutOfStock) return;
    setBuyingNow(true);
    try {
      await addItem(product._id, quantity);
      navigate('/checkout');
    } catch {
      setBuyingNow(false);
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-16">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm pt-2">
        <Link to="/" className="text-gray-400 hover:text-indigo-600 transition-colors">Home</Link>
        <span className="text-gray-300">/</span>
        <Link to="/shop" className="text-gray-400 hover:text-indigo-600 transition-colors">Shop</Link>
        <span className="text-gray-300">/</span>
        {product.category && (
          <>
            <Link to={`/shop?category=${product.category}`}
              className="text-gray-400 hover:text-indigo-600 transition-colors capitalize">
              {product.category}
            </Link>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* ── Main Product Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Image Gallery ── */}
        <div className="space-y-3">
          {/* Main image with zoom */}
          <div
            className="relative overflow-hidden rounded-2xl cursor-crosshair"
            style={{
              height: '480px',
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={images[selectedImage]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-200"
              style={{ transform: isZoomed ? 'scale(1.8)' : 'scale(1)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {discountPct && (
                <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                  -{discountPct}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Sold Out
                </span>
              )}
              {isLowStock && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Zoom hint */}
            {!isZoomed && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Hover to zoom
              </div>
            )}

            {/* Arrow nav */}
            {images.length > 1 && (
              <>
                <button onClick={() => setSelectedImage(i => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => setSelectedImage(i => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 hover:scale-105"
                  style={{
                    width: '72px', height: '72px',
                    border: `2px solid ${selectedImage === idx ? '#4f46e5' : '#e5e7eb'}`,
                    boxShadow: selectedImage === idx ? '0 0 0 2px rgba(79,70,229,0.2)' : 'none',
                  }}
                >
                  <img src={img.url} alt={product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="space-y-5">
          {/* Brand */}
          {product.brand && (
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#4f46e5' }}>
              {product.brand}
            </span>
          )}

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {product.name}
          </h1>

          {/* Rating row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Stars rating={avgRating} />
            <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({reviewCount} reviews)</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className={`text-sm font-semibold ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left` : 'In Stock'}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 py-2">
            <span className="text-3xl font-black text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: '#fef2f2', color: '#ef4444' }}>
                  Save ₹{(product.compareAtPrice - product.price).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#f1f5f9' }} />

          {/* Short description */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {product.description}
          </p>

          {/* Quantity + Add to Cart */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ border: '1.5px solid #e5e7eb' }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >−</button>
                <span className="w-12 text-center text-sm font-bold text-gray-900"
                  style={{ borderLeft: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb', lineHeight: '44px' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  className="w-10 h-11 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                  disabled={quantity >= (product.stock || 99)}
                >+</button>
              </div>

              <span className="text-xs text-gray-400">
                {product.stock > 0 ? `${product.stock} available` : ''}
              </span>
            </div>

            {/* Add to Cart + Wishlist + Share */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={adding || isOutOfStock}
                className="flex-1 py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: isOutOfStock ? '#9ca3af' : added ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: isOutOfStock ? 'none' : '0 4px 16px rgba(79,70,229,0.3)',
                }}
              >
                {adding ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding…
                  </>
                ) : added ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Cart!
                  </>
                ) : isOutOfStock ? 'Out of Stock' : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => { setWishlisted(w => !w); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!'); }}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                style={{
                  border: `1.5px solid ${wishlisted ? '#ef4444' : '#e5e7eb'}`,
                  background: wishlisted ? '#fef2f2' : '#fff',
                  color: wishlisted ? '#ef4444' : '#9ca3af',
                }}
              >
                <svg className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                style={{ border: '1.5px solid #e5e7eb', background: '#fff', color: '#9ca3af' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            {/* ── Buy Now button ── */}
            <button
              onClick={handleBuyNow}
              disabled={buyingNow || isOutOfStock}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: isOutOfStock ? '#f3f4f6' : '#fff',
                color: isOutOfStock ? '#9ca3af' : '#4f46e5',
                border: `2px solid ${isOutOfStock ? '#e5e7eb' : '#4f46e5'}`,
              }}
            >
              {buyingNow ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Buy Now
                </>
              )}
            </button>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { icon: '🚚', text: 'Free delivery above ₹499' },
              { icon: '↩️', text: '7-day returns' },
              { icon: '✅', text: 'Genuine product' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <span>{icon}</span>{text}
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="space-y-1.5 pt-1">
            {[
              { label: 'Category', value: product.category, link: `/shop?category=${product.category}` },
              { label: 'Brand', value: product.brand },
              { label: 'SKU', value: product.sku },
            ].filter(m => m.value).map(({ label, value, link }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-20 flex-shrink-0">{label}:</span>
                {link
                  ? <Link to={link} className="font-semibold text-indigo-600 hover:underline capitalize">{value}</Link>
                  : <span className="font-semibold text-gray-700 capitalize">{value}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Specs / Reviews ── */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          {[
            { id: 'description', label: 'Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'reviews', label: `Reviews (${reviewCount})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
              style={{
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#4f46e5' : '#9ca3af',
                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description */}
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          </div>
        )}

        {/* Specs */}
        {activeTab === 'specs' && (
          <div>
            {product.specifications?.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
                {product.specifications.map((spec, i) => (
                  <div key={i} className="flex"
                    style={{ borderBottom: i < product.specifications.length - 1 ? '1px solid #f8fafc' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <div className="w-40 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 flex-shrink-0">{spec.key}</div>
                    <div className="px-5 py-3.5 text-sm font-medium text-gray-800">{spec.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No specifications available.</p>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating summary */}
            <div className="flex items-center gap-8 p-6 rounded-2xl"
              style={{ background: '#fafafa', border: '1px solid #f1f5f9' }}>
              <div className="text-center flex-shrink-0">
                <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                <Stars rating={avgRating} size="sm" />
                <p className="text-xs text-gray-400 mt-1">{reviewCount} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5,4,3,2,1].map(star => {
                  const pct = star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-3">{star}</span>
                      <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#f59e0b' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-7">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards */}
            <div className="space-y-4">
              {MOCK_REVIEWS.map(review => (
                <div key={review.id} className="p-5 rounded-2xl"
                  style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background: review.color }}>{review.avatar}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Stars rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">You may also like</p>
              <h2 className="text-2xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                Related Products
              </h2>
            </div>
            <Link to={`/shop?category=${product.category}`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              View all →
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
};

export default ProductDetail;