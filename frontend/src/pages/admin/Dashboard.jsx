import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import Loader from '../../components/common/Loader';
import {
  UsersIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

// ── Shared dark table styles ──────────────────────────────
const statusStyles = {
  delivered:  { bg: '#0d2015', color: '#4ade80', dot: '#16a34a' },
  processing: { bg: '#0d1529', color: '#60a5fa', dot: '#2563eb' },
  shipped:    { bg: '#0f1529', color: '#818cf8', dot: '#4f46e5' },
  pending:    { bg: '#1f1608', color: '#fbbf24', dot: '#d97706' },
  cancelled:  { bg: '#200d0d', color: '#f87171', dot: '#dc2626' },
};

const StatusBadge = ({ status }) => {
  const s = statusStyles[status] || { bg: '#1a1a1a', color: '#a3a3a3', dot: '#525252' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {status || 'pending'}
    </span>
  );
};

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  const stats = data?.data || data || {};

  if (isLoading) return <Loader />;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: '#525252' }}>
          Welcome back — here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Users"    value={stats.totalUsers    || 0} icon={UsersIcon}         color="blue"   />
        <StatsCard title="Total Products" value={stats.totalProducts || 0} icon={ShoppingBagIcon}   color="violet" />
        <StatsCard title="Total Orders"   value={stats.totalOrders   || 0} icon={ShoppingCartIcon}  color="cyan"   />
        <StatsCard
          title="Revenue"
          value={`₹${((stats.totalSales || 0)).toLocaleString('en-IN')}`}
          icon={CurrencyRupeeIcon}
          color="green"
        />
      </div>

      {/* Recent Orders */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#111111', border: '1px solid #1f1f1f' }}
      >
        {/* Table Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #1f1f1f' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Recent Orders</h2>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#1a1a1a', color: '#737373' }}>
            Last 10
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-widest"
                    style={{ color: '#404040' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats.recentOrders || []).map((order, i) => (
                <tr
                  key={order._id}
                  style={{
                    borderBottom: '1px solid #161616',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium" style={{ color: '#e5e5e5' }}>
                      {order.user?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-mono" style={{ color: '#a3a3a3' }}>
                      ₹{(order.totalPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm" style={{ color: '#525252' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!stats.recentOrders || stats.recentOrders.length === 0) && (
            <div className="py-14 text-center">
              <p className="text-sm" style={{ color: '#404040' }}>No recent orders found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
