import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/common/HeroSlider';
import VisualSearchModal from '../components/product/VisualSearchModal';
import {
  CameraIcon,
  SparklesIcon,
  MapPinIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  CreditCardIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// ── Categories ────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Electronics', slug: 'electronics', emoji: '⚡', color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Clothing',    slug: 'clothing',    emoji: '👗', color: '#db2777', bg: '#fdf2f8' },
  { label: 'Home',        slug: 'home',        emoji: '🏠', color: '#ea580c', bg: '#fff7ed' },
  { label: 'Books',       slug: 'books',       emoji: '📚', color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Beauty',      slug: 'beauty',      emoji: '✨', color: '#e11d48', bg: '#fff1f2' },
  { label: 'Sports',      slug: 'sports',      emoji: '🏃', color: '#059669', bg: '#ecfdf5' },
];

// ── Trust badges ──────────────────────────────────────────
const BADGES = [
  {
    icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />,
    title: '100% Genuine Products',
    desc: 'Quality-verified products with valid statutory invoices',
    bg: 'bg-emerald-50/70 border-emerald-100',
  },
  {
    icon: <CreditCardIcon className="w-6 h-6 text-indigo-600" />,
    title: 'Secure Payments',
    desc: 'Razorpay cryptographically verified HMAC signatures & COD',
    bg: 'bg-indigo-50/70 border-indigo-100',
  },
  {
    icon: <TruckIcon className="w-6 h-6 text-amber-600" />,
    title: 'Fast Dispatch & Live Map',
    desc: 'Ships within 24 hours with real-time waypoint tracking',
    bg: 'bg-amber-50/70 border-amber-100',
  },
  {
    icon: <ArrowPathIcon className="w-6 h-6 text-purple-600" />,
    title: 'Hassle-Free Returns',
    desc: '7-day simple replacement or instant account refund',
    bg: 'bg-purple-50/70 border-purple-100',
  },
];

// ── Testimonials ──────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai, MH',
    rating: 5,
    text: 'The visual search is magical! I uploaded a screenshot of headphones I saw on Instagram and found them here instantly. Plus, delivery took only 2 days.',
    avatar: 'PS',
    color: '#db2777',
  },
  {
    name: 'Rahul Verma',
    location: 'New Delhi, DL',
    rating: 5,
    text: 'Best prices and genuine statutory GST invoices for company expense claims. The live delivery map was surprisingly accurate down to the turn!',
    avatar: 'RV',
    color: '#4f46e5',
  },
  {
    name: 'Ananya Singh',
    location: 'Bengaluru, KA',
    rating: 5,
    text: 'Guest checkout was so smooth. Added items to my cart, logged in at checkout, and my items synced immediately. Superb engineering.',
    avatar: 'AS',
    color: '#059669',
  },
];

// ── Admin Welcome Banner ───────────────────────────────────
const AdminBanner = () => (
  <div
    className="relative overflow-hidden rounded-3xl mb-8 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
    style={{
      background: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 60%, #172554 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
          Administrator Console
        </span>
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
        Welcome Back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Administrator</span>
      </h1>
      <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
        Live store telemetry is active. Manage inventory, view XGBoost customer churn analytics, and audit orders from the administration hub.
      </p>
    </div>

    <div className="relative z-10 flex gap-3 shrink-0">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
      >
        <span>Open Admin Hub</span>
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-300 bg-white/10 hover:bg-white/20 transition-all border border-white/10"
      >
        <span>Browse Catalog</span>
      </Link>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const Home = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [visualModalOpen, setVisualModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeatured(8),
    enabled: !isAdmin,
  });

  const featuredProducts = data?.data?.products || [];

  return (
    <div className="space-y-14 pb-16 font-sans">
      {/* ── Hero ── */}
      {isAdmin ? <AdminBanner /> : <HeroSlider />}

      {/* ── Trust Badges ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {BADGES.map((b, i) => (
            <div
              key={i}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${b.bg}`}
            >
              <div className="p-2 rounded-xl shrink-0 bg-white shadow-2xs">
                {b.icon}
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">{b.title}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              Curated Collections
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md border border-slate-100"
              style={{
                background: cat.bg,
              }}
            >
              <span className="text-3xl sm:text-4xl transition-transform duration-200 group-hover:scale-110">
                {cat.emoji}
              </span>
              <span className="text-xs font-black text-slate-800 tracking-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI Features Spotlight Banner ── */}
      {!isAdmin && (
        <section>
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white shadow-xl">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>AI-Powered E-Commerce Superpowers</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  Experience Visual Search & Real-Time Logistics
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl font-normal">
                  Powered by Google Gemini 1.5 Vision and custom delivery route simulation. Upload any photo to find exact product matches in seconds, and track packages in real-time.
                </p>

                {/* 3 feature pills */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                    <CameraIcon className="w-4 h-4 text-indigo-400" />
                    Gemini Vision Search
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                    <MapPinIcon className="w-4 h-4 text-emerald-400" />
                    Live Driver Map Simulator
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 border border-white/10">
                    <DocumentCheckIcon className="w-4 h-4 text-amber-400" />
                    Statutory GST Tax Invoicing
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setVisualModalOpen(true)}
                  className="px-6 py-3.5 rounded-xl font-black text-xs text-indigo-950 bg-white hover:bg-indigo-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-4 h-4 text-indigo-600" />
                  <span>Try AI Visual Search</span>
                </button>
                <Link
                  to="/shop"
                  className="px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-white/10 hover:bg-white/20 transition-all border border-white/15 flex items-center justify-center gap-2"
                >
                  <span>Explore Catalog</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products Grid ── */}
      {!isAdmin && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                Trending Right Now
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Featured Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ProductGrid products={featuredProducts} loading={isLoading} />
        </section>
      )}

      {/* ── Promo Banner ── */}
      {!isAdmin && (
        <section>
          <div className="relative overflow-hidden rounded-3xl px-6 sm:px-12 py-10 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                New Customer Special
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Enjoy ₹200 off your first purchase!
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium">
                Apply coupon code <code className="font-mono font-black text-white bg-white/20 px-2 py-0.5 rounded-lg">WELCOME200</code> at checkout.
              </p>
            </div>
            <Link
              to="/shop"
              className="shrink-0 px-8 py-3.5 rounded-xl font-black text-xs text-indigo-900 bg-white hover:bg-slate-50 transition-all shadow-md active:scale-95"
            >
              Claim Promo
            </Link>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      <section>
        <div className="text-center mb-8">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
            Customer Confidence
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Loved by Thousands of Shoppers
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed flex-1 font-medium">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Visual Search Modal ── */}
      <VisualSearchModal
        isOpen={visualModalOpen}
        onClose={() => setVisualModalOpen(false)}
      />
    </div>
  );
};

export default Home;