import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';
import { EyeIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', page, statusFilter],
    queryFn: () => orderService.getAllOrders({ page, limit: 10, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber, courier }) =>
      orderService.updateStatus(id, { status, trackingNumber, courier }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      toast.success('Order status updated');
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    },
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {};

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusUpdate = (order) => {
    let newStatus = '';
    let trackingNumber = '';
    let courier = '';

    if (order.status === 'pending') newStatus = 'processing';
    else if (order.status === 'processing') newStatus = 'shipped';
    else if (order.status === 'shipped') newStatus = 'delivered';

    if (newStatus === 'shipped') {
      trackingNumber = prompt('Enter tracking number:');
      if (!trackingNumber) return;
      courier = prompt('Enter courier name:');
      if (!courier) return;
    }

    updateStatusMutation.mutate({
      id: order._id,
      status: newStatus,
      trackingNumber,
      courier,
    });
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      updateStatusMutation.mutate({ id: orderId, status: 'cancelled' });
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Orders Management</h2>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.user?.name}</div>
                  <div className="text-sm text-gray-500">{order.user?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(order)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        <TruckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - similar to ProductsManagement */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          {/* Pagination component – reuse your Pagination.jsx */}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Order #{selectedOrder.orderNumber}</h3>
            {/* Full order details – similar to OrderDetail page */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-4 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;