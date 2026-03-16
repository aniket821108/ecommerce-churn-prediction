import { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    eyebrow: "Limited Time Deal",
    title: "Super Sale",
    highlight: "is Live!",
    subtitle: "Up to 50% off on Electronics — grab it before it's gone.",
    link: "/shop?category=electronics",
    cta: "Shop Electronics",
    accent: "#f97316",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    eyebrow: "New Arrivals",
    title: "Fresh Fashion",
    highlight: "Collection",
    subtitle: "Discover the latest trends handpicked for this season.",
    link: "/shop?category=clothing",
    cta: "Explore Now",
    accent: "#ec4899",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    eyebrow: "Knowledge Corner",
    title: "Books for",
    highlight: "Everyone",
    subtitle: "Thousands of titles. One destination. Start reading today.",
    link: "/shop?category=books",
    cta: "Browse Books",
    accent: "#22d3ee",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((index) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 700);
  }, [animating]);

  useEffect(() => {
    const interval = setInterval(() => {
      goTo((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [goTo]);

  const next = () => goTo(current === banners.length - 1 ? 0 : current + 1);
  const prev = () => goTo(current === 0 ? banners.length - 1 : current - 1);

  const banner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl mb-10 group"
      style={{ height: 'clamp(280px, 52vw, 520px)', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>

      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1) 100%)' }} />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-0.5 rounded-full" style={{ background: banner.accent }} />
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: banner.accent }}>
            {banner.eyebrow}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-black leading-none mb-3 text-white"
          style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)', letterSpacing: '-0.02em' }}>
          {banner.title}{' '}
          <span style={{
            background: `linear-gradient(90deg, ${banner.accent}, #fff)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {banner.highlight}
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-white/70 mb-7 max-w-md"
          style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.1rem)' }}>
          {banner.subtitle}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link to={banner.link}
            className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: banner.accent, color: '#fff', boxShadow: `0 8px 24px ${banner.accent}55` }}>
            {banner.cta}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link to="/shop"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-4">
            View all deals
          </Link>
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute top-5 right-5 z-10 text-xs font-mono font-bold"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        {String(current + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
      </div>

      {/* Arrow buttons */}
      <button onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <ChevronLeftIcon className="h-5 w-5 text-white" />
      </button>
      <button onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <ChevronRightIcon className="h-5 w-5 text-white" />
      </button>

      {/* Dot navigation */}
      <div className="absolute bottom-5 left-8 md:left-16 lg:left-24 z-10 flex items-center gap-2">
        {banners.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="rounded-full transition-all duration-400"
            style={{
              width: i === current ? '28px' : '8px',
              height: '8px',
              background: i === current ? banner.accent : 'rgba(255,255,255,0.35)',
            }} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 z-10" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          key={current}
          className="h-full rounded-full"
          style={{
            background: banner.accent,
            animation: 'progress 4.5s linear forwards',
          }} />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;