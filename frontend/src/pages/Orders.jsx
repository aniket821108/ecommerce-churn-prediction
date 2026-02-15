import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import Loader from '../components/common/Loader';
import { formatDate, formatCurrency } from '../utils/formatters';

const Orders = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => orderService.getMyOrders(),
  });

  const orders = data?.data?.orders || [];

  if (isLoading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">Failed to load orders</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link
            to="/shop"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
            >
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <span>{order.items.length} item(s)</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;