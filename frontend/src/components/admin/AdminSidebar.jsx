import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon, // For Churn Analytics
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon, end: true }, // "end" makes it active only on exact match
    { path: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCartIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/churn', label: 'Churn Analytics', icon: ChartBarIcon },
  ];

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen fixed left-0 top-0 pt-16 z-40">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 tracking-wide uppercase text-sm">Admin Panel</h2>
      </div>
      <nav className="mt-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;