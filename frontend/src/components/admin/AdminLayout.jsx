import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import useAuthStore from '../../store/authStore';
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const breadcrumbTitles = {
  '/admin': 'Executive Dashboard',
  '/admin/products': 'Inventory & Products',
  '/admin/orders': 'Order Fulfillment',
  '/admin/users': 'Customer Accounts',
  '/admin/churn': 'AI Churn Analytics',
};

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentTitle = breadcrumbTitles[location.pathname] || 'Control Center';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* ── Desktop & Mobile Sidebar ── */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0">
        
        {/* ── Sticky Top Navigation Bar ── */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-shadow duration-200 shadow-xs">
          {/* Left: Mobile Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="font-semibold text-slate-400 hidden sm:inline">Admin</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Right: Store Status + View Storefront + Profile Pill */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Store Live
            </div>

            {/* Back to Storefront Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-xs transition-all duration-150 active:scale-95"
            >
              <span>Storefront</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {(() => {
                  const src = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url;
                  return src ? (
                    <img src={src} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'A'
                  );
                })()}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name?.split(' ')[0] || 'Admin'}
                </span>
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-0.5">
                  <SparklesIcon className="w-2.5 h-2.5 inline" />
                  Superadmin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Routed View Container ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
