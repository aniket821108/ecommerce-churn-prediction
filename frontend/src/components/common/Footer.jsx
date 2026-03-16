import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1f1f1f', marginTop: '80px' }}>
      <div className="container mx-auto px-4 py-12">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10"
          style={{ borderBottom: '1px solid #1f1f1f' }}>

          {/* Brand */}
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                E
              </div>
              <span className="text-lg font-black text-white" style={{ letterSpacing: '-0.03em' }}>
                E‑Shop
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#525252', maxWidth: '260px' }}>
              Your trusted online store for quality products. Shop with confidence — genuine items, fast delivery, easy returns.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Instagram', path: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a2 2 0 002-2v-11a2 2 0 00-2-2h-11a2 2 0 00-2 2v11a2 2 0 002 2z' },
                { label: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#525252' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#818cf8'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#525252'; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#404040' }}>Shop</p>
            <ul className="space-y-2.5">
              {[
                { to: '/shop', label: 'All Products' },
                { to: '/shop?category=electronics', label: 'Electronics' },
                { to: '/shop?category=clothing', label: 'Clothing' },
                { to: '/shop?category=home', label: 'Home & Living' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to}
                    className="text-sm transition-colors"
                    style={{ color: '#525252' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e5e5e5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#525252'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#404040' }}>Account</p>
            <ul className="space-y-2.5">
              {[
                { to: '/login', label: 'Login' },
                { to: '/register', label: 'Register' },
                { to: '/profile', label: 'My Profile' },
                { to: '/orders', label: 'My Orders' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to}
                    className="text-sm transition-colors"
                    style={{ color: '#525252' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e5e5e5'}
                    onMouseLeave={e => e.currentTarget.style.color = '#525252'}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#404040' }}>Stay Updated</p>
            <p className="text-sm mb-4" style={{ color: '#525252' }}>
              Get the latest deals and offers straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e5e5' }}
                onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              />
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: '#404040' }}>
            © {new Date().getFullYear()} E‑Shop. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <Link key={item} to="#"
                className="text-xs transition-colors"
                style={{ color: '#404040' }}
                onMouseEnter={e => e.currentTarget.style.color = '#737373'}
                onMouseLeave={e => e.currentTarget.style.color = '#404040'}>
                {item}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;