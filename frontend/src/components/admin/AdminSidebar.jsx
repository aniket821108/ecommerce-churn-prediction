import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ShoppingBagIcon as BagOutline,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon, end: true },
    { path: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCartIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/churn', label: 'Churn Analytics', icon: ChartBarIcon },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* ── Mobile Overlay Backdrop ── */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Container ── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* ── Brand Header ── */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              E
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                  E-Shop
                </span>
                <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md border border-violet-200/60 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
                Control Hub
              </span>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation Menu ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Management & Analytics
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-violet-50 text-violet-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={`w-5 h-5 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-violet-600'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {isActive && (
                        <span className="w-1.5 h-4 rounded-full bg-violet-600 shadow-xs" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Sidebar Footer ── */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50 space-y-2">
          {/* Quick System Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/70 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-700">Platform v1.0</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Online</span>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out of Admin?')) {
                logout();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-150"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
