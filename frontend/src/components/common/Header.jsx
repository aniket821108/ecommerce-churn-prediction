import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useEffect, useState } from 'react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = user?.role === 'admin';
  const itemCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
          borderBottom: '1px solid #f1f5f9',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                E
              </div>
              <span className="text-lg font-black text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                E‑Shop
              </span>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: isActive('/') ? '#4f46e5' : '#6b7280', background: isActive('/') ? '#eef2ff' : 'transparent' }}>
                Home
              </Link>
              {!isAdmin && (
                <Link to="/shop"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: isActive('/shop') ? '#4f46e5' : '#6b7280', background: isActive('/shop') ? '#eef2ff' : 'transparent' }}>
                  Shop
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin"
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5"
                  style={{ color: '#7c3aed', background: '#f5f3ff' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Admin Dashboard
                </Link>
              )}
            </nav>

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-2">

              {/* Cart */}
              {!isAdmin && (
                <Link to="/cart"
                  className="relative p-2 rounded-xl transition-colors hover:bg-gray-100"
                  style={{ color: '#374151' }}>
                  <ShoppingCartIcon className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-white text-xs font-black w-4.5 h-4.5 rounded-full flex items-center justify-center"
                      style={{ background: '#ef4444', fontSize: '10px', minWidth: '18px', height: '18px', padding: '0 4px' }}>
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Auth */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors hover:bg-gray-100"
                    style={{ color: '#374151' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: isAdmin ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                    >
                      {(() => {
                      const src = typeof user?.avatar === 'string' 
                        ? user.avatar 
                        : user?.avatar?.url;
                        return src 
                        ? <img src={src} alt="avatar" className="w-full h-full object-cover rounded-lg" />
                          : user?.name?.charAt(0).toUpperCase();
                      })()}
                    </div>
                    <span className="hidden md:inline text-sm font-semibold">
                      {user?.name?.split(' ')[0]}
                      {isAdmin && <span className="ml-1 text-xs text-violet-600 font-bold">(Admin)</span>}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div
                        className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
                        style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
                          <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>

                        <div className="p-1.5">
                          <Link to="/profile"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            My Profile
                          </Link>
                          {!isAdmin && (
                            <Link to="/orders"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              My Orders
                            </Link>
                          )}
                          {isAdmin && (
                            <Link to="/admin"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                              style={{ color: '#7c3aed', background: '#f5f3ff' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 10h11M9 21V3m0 0L3 9m6-6l6 6" />
                              </svg>
                              Admin Panel
                            </Link>
                          )}
                        </div>

                        <div className="p-1.5" style={{ borderTop: '1px solid #f8fafc' }}>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors hover:bg-red-50"
                            style={{ color: '#ef4444' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                    Login
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                style={{ color: '#374151' }}
              >
                {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid #f1f5f9', background: '#fff' }}>
            <div className="container mx-auto px-4 py-3 space-y-1">
              <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Home
              </Link>
              {!isAdmin && (
                <Link to="/shop" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Shop
                </Link>
              )}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Login
                  </Link>
                  <Link to="/register"
                    className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Register
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;