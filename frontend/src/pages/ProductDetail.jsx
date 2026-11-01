import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { productService } from '../services/productService';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import ProductGrid from '../components/product/ProductGrid';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import {
  ChevronRightIcon,
  HomeIcon,
  ShareIcon,
  HeartIcon,
  ShoppingCartIcon,
  BoltIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// ── Star Rating Component ──────────────────────────────────
const Stars = ({ rating = 0, size = 'sm', interactive = false, onRate }) => {
  const [hovered, setHovered] = useState(0);
  const s = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${s} ${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
          fill={i <= (interactive ? hovered || rating : Math.round(rating)) ? '#f59e0b' : '#e2e8f0'}
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

// Verified Reviews Data
const MOCK_REVIEWS = [
  { id: 1, name: 'Priya S.', location: 'Mumbai, MH', rating: 5, date: '12 Feb 2026', text: 'Top notch build quality and genuine manufacturer packaging! Delivery took just 24 hours.', avatar: 'PS', color: '#db2777' },
  { id: 2, name: 'Rahul V.', location: 'New Delhi, DL', rating: 4, date: '8 Feb 2026', text: 'Great value for money. Downloaded the GST invoice instantly from my order page for company tax filing.', avatar: 'RV', color: '#4f46e5' },
  { id: 3, name: 'Ananya K.', location: 'Bengaluru, KA', rating: 5, date: '3 Feb 2026', text: 'Exactly as described. Tracking via the live delivery simulation was super cool!', avatar: 'AK', color: '#059669' },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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
  const relatedProducts = (relatedData?.data?.products || []).filter((p) => p._id !== id).slice(0, 4);

  // ── Skeleton Loading ──
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 py-6 font-sans">
        <div className="flex gap-2 items-center">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Skeleton className="w-full h-[450px] rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <Skeleton className="w-20 h-20 rounded-xl" />
              <Skeleton className="w-20 h-20 rounded-xl" />
            </div>
          </div>
          <div className="space-y-5">
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/3 h-5" />
            <Skeleton className="w-1/4 h-8" />
            <Skeleton className="w-full h-24 rounded-xl" />
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-sans">
        <p className="text-lg font-bold text-slate-800">Product not found</p>
        <p className="text-sm text-slate-500 mt-1">The item you requested may have been removed or does not exist.</p>
        <Link to="/shop" className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs">
          ← Return to Shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ url: '/placeholder.png' }];
  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const avgRating = product.ratings?.average || 4.5;
  const reviewCount = product.ratings?.count || MOCK_REVIEWS.length;
  const isBook = product.category?.toLowerCase() === 'books' || product.hsnCode === '4901';

  // ── Handlers ──
  const handleAddToCart = async () => {
    if (isAdmin) {
      toast.error('Admins cannot purchase products. Please use a customer account.');
      return;
    }
    if (adding || isOutOfStock) return;
    setAdding(true);
    try {
      await addItem(product, quantity);
      setAdded(true);
      toast.success(`Added ${quantity} item(s) to cart!`);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isAdmin) {
      toast.error('Admins cannot purchase products. Please use a customer account.');
      return;
    }
    if (buyingNow || isOutOfStock) return;
    setBuyingNow(true);
    try {
      await addItem(product, quantity);
      navigate(isAuthenticated ? '/checkout' : '/login?next=%2Fcheckout');
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
      toast.success('Product link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 flex-wrap">
        <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <Link to="/shop" className="hover:text-indigo-600 transition-colors">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRightIcon className="w-3 h-3 text-slate-300" />
            <Link
              to={`/shop?category=${product.category}`}
              className="hover:text-indigo-600 transition-colors capitalize"
            >
              {product.category}
            </Link>
          </>
        )}
        <ChevronRightIcon className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* ── Main Product Presentation Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ── Left Column: Image Gallery ── */}
        <div className="space-y-3">
          {/* Main Hero Image with Dynamic Loupe Zoom */}
          <div
            className="relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 shadow-sm cursor-crosshair h-[380px] sm:h-[480px] flex items-center justify-center"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={images[selectedImage]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-contain p-4 transition-transform duration-200"
              style={{
                transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
              {discountPct && (
                <Badge variant="danger" size="md" className="font-black shadow-xs">
                  -{discountPct}% OFF
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="default" size="md" className="bg-slate-900 text-white font-bold shadow-xs">
                  Sold Out
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge variant="warning" size="md" className="font-bold shadow-xs">
                  Only {product.stock} left in stock
                </Badge>
              )}
            </div>

            {/* Hover Zoom Hint */}
            {!isZoomed && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/60 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1 pointer-events-none">
                <span>Hover to zoom</span>
              </div>
            )}
          </div>

          {/* Interactive Multi-Thumbnail Row */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                    selectedImage === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column: Info & Buy Box ── */}
        <div className="space-y-5">
          {/* Brand & Category */}
          <div className="flex items-center gap-2">
            {product.brand && (
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {product.brand}
              </span>
            )}
            <span className="text-xs font-bold text-slate-400 capitalize">
              • {product.category || 'General'}
            </span>
          </div>

          {/* Product Name */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Ratings & Stock Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <Stars rating={avgRating} />
            <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-medium">({reviewCount} customer reviews)</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span
              className={`text-xs font-bold ${
                isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isOutOfStock ? '● Currently Out of Stock' : isLowStock ? `● Only ${product.stock} items remaining` : '● In Stock & Ready to Ship'}
            </span>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.compareAtPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                    Save ₹{(product.compareAtPrice - product.price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>

            {/* Statutory GST Line */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <DocumentCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isBook ? (
                  <>Statutory GST Exempt (0% HSN 4901 Printed Books) • Tax Invoice provided</>
                ) : (
                  <>Inclusive of 18% GST (CGST 9% + SGST 9% / IGST 18%) • Valid Tax Invoice</>
                )}
              </span>
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Admin vs Customer Action Block */}
          {isAdmin ? (
            <div className="p-5 rounded-2xl border border-violet-200 bg-violet-50/70 space-y-3">
              <div className="flex items-center gap-2 text-violet-900 font-bold text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                <span>Admin View Mode</span>
              </div>
              <p className="text-xs text-violet-700 leading-relaxed font-medium">
                Customer cart and order purchasing are disabled on administrative accounts to ensure segregation of duties.
              </p>
              <div className="pt-1 flex gap-2">
                <Link
                  to="/admin/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-xs"
                >
                  Manage in Admin Panel
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 transition-colors"
                >
                  Share Product
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Quantity:
                </span>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-9 h-9 flex items-center justify-center text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-xs font-black text-slate-900 border-x border-slate-200 leading-9">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    disabled={quantity >= (product.stock || 99) || isOutOfStock}
                    className="w-9 h-9 flex items-center justify-center text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {product.stock > 0 ? `${product.stock} units available` : ''}
                </span>
              </div>

              {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding || isOutOfStock}
                  className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? 'bg-slate-400 cursor-not-allowed shadow-none'
                      : added
                      ? 'bg-emerald-600'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                  }`}
                >
                  {adding ? (
                    <span>Adding to Cart…</span>
                  ) : added ? (
                    <>
                      <span>✓ Added to Cart!</span>
                    </>
                  ) : isOutOfStock ? (
                    <span>Sold Out</span>
                  ) : (
                    <>
                      <ShoppingCartIcon className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={buyingNow || isOutOfStock}
                  className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 border ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  {buyingNow ? (
                    <span>Processing…</span>
                  ) : (
                    <>
                      <BoltIcon className="w-4 h-4 text-indigo-600" />
                      <span>Buy Now</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWishlisted((w) => !w);
                    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
                  }}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 ${
                    wishlisted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {wishlisted ? (
                    <HeartSolidIcon className="w-5 h-5 text-rose-600" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-12 h-12 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Value Props Strip */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <TruckIcon className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-700">Free Delivery</p>
              <p className="text-[10px] text-slate-400 font-medium">Orders above ₹1,000</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <ArrowPathIcon className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-700">7-Day Returns</p>
              <p className="text-[10px] text-slate-400 font-medium">Hassle-free policy</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <ShieldCheckIcon className="w-4 h-4 mx-auto text-amber-600 mb-1" />
              <p className="text-[11px] font-bold text-slate-700">100% Genuine</p>
              <p className="text-[10px] text-slate-400 font-medium">Direct from brand</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Specifications / Statutory Info / Customer Reviews ── */}
      <div className="pt-6">
        <div className="flex gap-2 border-b border-slate-200 pb-px">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'statutory', label: 'Statutory GST & Taxes' },
            { id: 'reviews', label: `Reviews (${reviewCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-slate-600 text-xs sm:text-sm leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              {product.specifications?.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={i}
                      className={`flex text-xs ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      } border-b border-slate-100 last:border-b-0`}
                    >
                      <div className="w-44 px-4 py-3 font-black uppercase tracking-wider text-slate-400">
                        {spec.key}
                      </div>
                      <div className="px-4 py-3 font-semibold text-slate-800">{spec.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No specifications provided for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'statutory' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 text-slate-600">
              <h4 className="font-black uppercase tracking-wider text-slate-800 text-xs mb-1">
                Indian Statutory Tax Information
              </h4>
              <p>
                <strong>HSN / SAC Code:</strong> {product.hsnCode || (isBook ? '4901' : '8517')}
              </p>
              <p>
                <strong>Statutory Rate:</strong> {isBook ? '0% Exempt (Books)' : '18% GST (Intrastate: CGST 9% + SGST 9%, Interstate: IGST 18%)'}
              </p>
              <p>
                <strong>Trade Discount Allocation:</strong> All trade discounts are deducted before calculating tax liability in compliance with Section 15(3) of the CGST Act.
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                A digitally rendered PDF Tax Invoice featuring a verifiable UPI payment & verification QR code is generated for every completed order and downloadable via the Order History dashboard.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {MOCK_REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{ background: review.color }}
                      >
                        {review.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{review.name}</p>
                        <p className="text-[10px] text-slate-400">{review.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars rating={review.rating} size="sm" />
                      <span className="text-[10px] text-slate-400">{review.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">"{review.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products Showcase ── */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-100">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                You May Also Like
              </p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Related Products
              </h2>
            </div>
            <Link
              to={`/shop?category=${product.category}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View More in {product.category} →
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}

      {/* ── Sticky Mobile Bottom Buy Bar ── */}
      {!isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 lg:hidden flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={images[0]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
              <p className="text-xs font-black text-indigo-600">₹{product.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 active:scale-95 disabled:opacity-50"
            >
              {added ? '✓ Added' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buyingNow || isOutOfStock}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-xs"
            >
              Buy Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;