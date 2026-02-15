import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
// ❌ REMOVED: AdminSidebar (Router handles it)
import StatsCard from '../../components/admin/StatsCard';
import Loader from '../../components/common/Loader';
import {
  UsersIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  // Handle data safely (Using flat structure from backend)
  const stats = data?.data || data || {};

  if (isLoading) return <Loader />;

  return (
    // ✅ REMOVED: "flex gap-6" wrapper (Router handles layout)
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={UsersIcon}
          color="blue"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts || 0}
          icon={ShoppingBagIcon}
          color="green"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={ShoppingCartIcon}
          color="purple"
        />
        <StatsCard
          title="Revenue"
          value={`₹${(stats.totalSales || 0).toFixed(2)}`}
          icon={CurrencyRupeeIcon}
          color="yellow"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentOrders?.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.user?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.totalPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!stats.recentOrders || stats.recentOrders.length === 0) && (
             <div className="p-6 text-center text-gray-500">No recent orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;