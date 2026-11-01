import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminCopilot from './AdminCopilot';
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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const currentTitle = breadcrumbTitles[location.pathname] || 'Control Center';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* ── Desktop & Mobile/Tablet Sidebar ── */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col min-w-0">
        
        {/* ── Sticky Top Navigation Bar ── */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 md:px-8 flex items-center justify-between transition-shadow duration-200 shadow-xs">
          {/* Left: Mobile/Tablet Toggle + Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm truncate">
              <span className="font-semibold text-slate-400 hidden sm:inline">Admin</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
                {currentTitle}
              </span>
            </div>
          </div>

          {/* Right: Store Status + View Storefront + AI Copilot + Profile Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Store Live
            </div>

            {/* Back to Storefront Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-xs transition-all duration-150 active:scale-95"
              title="Open customer storefront"
            >
              <span className="hidden sm:inline">Storefront</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* AI Operations Copilot Trigger */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200/80 hover:bg-violet-100 hover:border-violet-300 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {(() => {
                  const src = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url;
                  return src && !avatarError ? (
                    <img
                      src={src}
                      alt="avatar"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'A'
                  );
                })()}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
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
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Admin Operations Copilot Drawer ── */}
      <AdminCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
