import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/common/HeroSlider';

// ── Categories ────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Electronics', slug: 'electronics', emoji: '⚡', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Clothing',    slug: 'clothing',    emoji: '👗', color: '#ec4899', bg: '#fdf2f8' },
  { label: 'Home',        slug: 'home',        emoji: '🏠', color: '#f97316', bg: '#fff7ed' },
  { label: 'Books',       slug: 'books',       emoji: '📚', color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Beauty',      slug: 'beauty',      emoji: '✨', color: '#f43f5e', bg: '#fff1f2' },
  { label: 'Sports',      slug: 'sports',      emoji: '🏃', color: '#10b981', bg: '#ecfdf5' },
];

// ── Trust badges ──────────────────────────────────────────
const BADGES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: 'Genuine Products',
    desc: '100% authentic, quality-verified items',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Your transactions are always protected',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: 'Fast Delivery',
    desc: 'Ships within 24 hrs, track in real-time',
    color: '#f97316',
    bg: '#fff7ed',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy Returns',
    desc: 'Hassle-free 7-day return policy',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
];

// ── Testimonials ──────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely love shopping here! The products are genuine and delivery is super fast. Will definitely order again.',
    avatar: 'PS',
    color: '#ec4899',
  },
  {
    name: 'Rahul Verma',
    location: 'Delhi',
    rating: 5,
    text: 'Best prices Ive found online. The checkout process is seamless and the packaging was excellent.',
    avatar: 'RV',
    color: '#3b82f6',
  },
  {
    name: 'Ananya Singh',
    location: 'Bangalore',
    rating: 4,
    text: 'Great selection of products. Customer support was very helpful when I had a query. Highly recommend!',
    avatar: 'AS',
    color: '#10b981',
  },
];

// ── Admin Welcome Banner ───────────────────────────────────
const AdminBanner = () => (
  <div
    className="relative overflow-hidden rounded-2xl mb-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
    style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1133 50%, #0f172a 100%)',
      border: '1px solid #2a2a2a',
      boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    }}
  >
    {/* Glow orbs */}
    <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
      style={{ background: 'rgba(124,58,237,0.12)' }} />
    <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
      style={{ background: 'rgba(79,70,229,0.1)' }} />

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-0.5 rounded-full" style={{ background: '#7c3aed' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>
          Admin Access
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
        Welcome Back, <span style={{
          background: 'linear-gradient(90deg, #a78bfa, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Admin!</span>
      </h1>
      <p className="text-sm" style={{ color: '#737373' }}>
        Your store is live. Manage products, track orders, and monitor users from the dashboard.
      </p>
    </div>

    <div className="relative z-10 flex gap-3 flex-shrink-0">
      <Link to="/admin"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-105"
        style={{ background: '#7c3aed', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
        Go to Dashboard
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
      <Link to="/shop"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
        style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}>
        View Store
      </Link>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const Home = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeatured(8),
    enabled: !isAdmin,
  });

  const featuredProducts = data?.data?.products || [];

  return (
    <div className="space-y-16">

      {/* ── Hero ── */}
      {isAdmin ? <AdminBanner /> : <HeroSlider />}

      {/* ── Trust Badges ── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGES.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1"
              style={{
                background: b.bg,
                border: `1px solid ${b.color}22`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${b.color}18`, color: b.color }}>
                {b.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Browse by</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
              Shop Categories
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            All products →
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg"
              style={{
                background: cat.bg,
                color: cat.color,
                border: `1px solid ${cat.color}20`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-bold text-gray-700">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      {!isAdmin && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Handpicked for you</p>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                Featured Products
              </h2>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              View all →
            </Link>
          </div>
          {isLoading ? <Loader /> : <ProductGrid products={featuredProducts} />}
        </section>
      )}

      {/* ── Promo Banner ── */}
      {!isAdmin && (
        <section>
          <div
            className="relative overflow-hidden rounded-2xl px-8 md:px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1d4ed8 100%)',
              boxShadow: '0 20px 50px rgba(79,70,229,0.25)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(99,102,241,0.25)' }} />
            <div className="relative z-10 text-center md:text-left">
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">New User Offer</p>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                Get ₹200 off your first order!
              </h3>
              <p className="text-indigo-200 text-sm">Use code <span className="font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded-lg">WELCOME200</span> at checkout.</p>
            </div>
            <Link to="/shop"
              className="relative z-10 flex-shrink-0 px-8 py-3.5 rounded-xl font-bold text-indigo-900 bg-white text-sm hover:scale-105 transition-transform duration-200"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              Claim Offer
            </Link>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      <section>
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">What customers say</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Loved by Thousands
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4" fill={s < t.rating ? '#f59e0b' : '#e5e7eb'} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;