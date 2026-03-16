import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon, end: true },
    { path: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCartIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/churn', label: 'Churn Analytics', icon: ChartBarIcon },
  ];

  return (
    <aside
      className="w-60 min-h-screen fixed left-0 top-0 pt-16 z-40 flex flex-col"
      style={{ background: '#0a0a0a', borderRight: '1px solid #1f1f1f' }}
    >
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff' }}
          >
            A
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#a3a3a3' }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#1f1f1f', margin: '0 20px' }} />

      {/* Nav */}
      <nav className="mt-3 flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="group"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: isActive ? '500' : '400',
              color: isActive ? '#f5f5f5' : '#737373',
              background: isActive ? '#1a1a1a' : 'transparent',
              transition: 'all 0.15s ease',
              textDecoration: 'none',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.color = '#d4d4d4';
                e.currentTarget.style.background = '#141414';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.color = '#737373';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: isActive ? '#8b5cf6' : '#525252' }}
                />
                {item.label}
                {isActive && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: '#7c3aed' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #1f1f1f' }}>
        <p className="text-xs" style={{ color: '#404040' }}>v1.0.0 · Admin</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
