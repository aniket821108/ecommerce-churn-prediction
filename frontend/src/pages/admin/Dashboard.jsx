import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import Loader from '../../components/common/Loader';
import useAuthStore from '../../store/authStore';
import {
  UsersIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  ArrowRightIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const statusBadgeStyles = {
  delivered: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  processing: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  shipped: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dot: 'bg-indigo-500',
  },
  pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  cancelled: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
};

const StatusBadge = ({ status }) => {
  const norm = (status || 'pending').toLowerCase();
  const s = statusBadgeStyles[norm] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${s.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {norm}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  const stats = data?.data || data || {};

  if (isLoading) return <Loader />;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-200">
      {/* ── Welcome Greeting Card ── */}
      <div className="relative bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle decorative gradient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold mb-1">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Store Overview & Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Administrator'} 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl">
            Here is your live retail summary. Real-time customer activity, product catalog numbers, and order fulfillments.
          </p>
        </div>

        <div className="relative flex items-center gap-3 flex-wrap">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs hover:shadow-md transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Manage Inventory</span>
          </Link>
          <Link
            to="/admin/churn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
          >
            <ArrowTrendingUpIcon className="w-4 h-4 text-violet-600" />
            <span>AI Risk Analytics</span>
          </Link>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Customers"
          value={(stats.totalUsers || 0).toLocaleString('en-IN')}
          icon={UsersIcon}
          color="blue"
          subtitle="Registered accounts"
        />
        <StatsCard
          title="Product Catalog"
          value={(stats.totalProducts || 0).toLocaleString('en-IN')}
          icon={ShoppingBagIcon}
          color="violet"
          subtitle="Active retail SKUs"
        />
        <StatsCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString('en-IN')}
          icon={ShoppingCartIcon}
          color="cyan"
          subtitle="Lifetime checkouts"
        />
        <StatsCard
          title="Gross Revenue"
          value={`₹${(stats.totalSales || 0).toLocaleString('en-IN')}`}
          icon={CurrencyRupeeIcon}
          color="green"
          subtitle="Accumulated sales"
        />
      </div>

      {/* ── Recent Orders Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              The latest orders placed across your storefront
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
          >
            <span>View all orders</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Fulfillment Status</th>
                <th className="px-6 py-3.5">Order Placed</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(stats.recentOrders || []).map((order) => {
                const customerName = order.user?.name || 'Guest Customer';
                const customerEmail = order.user?.email || '—';
                const initial = customerName.charAt(0).toUpperCase();

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{customerName}</p>
                          <p className="text-xs text-slate-400 font-medium truncate">{customerEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900 font-mono">
                        ₹{(order.totalPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/admin/orders"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!stats.recentOrders || stats.recentOrders.length === 0) && (
            <div className="py-16 text-center">
              <ShoppingCartIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No orders recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                New customer orders will automatically appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
