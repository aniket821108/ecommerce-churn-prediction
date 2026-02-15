import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import Loader from '../components/common/Loader';
import { formatDate, formatCurrency } from '../utils/formatters';

const OrderDetail = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
  });

  const order = data?.data?.order;

  if (isLoading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">Order not found</div>;
  if (!order) return null;

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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Order #{order.orderNumber}</h1>
      <p className="text-gray-600 mb-6">Placed on {formatDate(order.createdAt)}</p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Order Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {order.trackingNumber && (
          <div className="text-sm text-gray-600">
            <p>Tracking Number: {order.trackingNumber}</p>
            <p>Courier: {order.courier}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          <div className="text-gray-700">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
          <div className="text-gray-700">
            <p>Method: {order.payment.method}</p>
            <p>Status: 
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                order.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment.status}
              </span>
            </p>
            {order.payment.transactionId && (
              <p className="text-xs mt-1">Transaction ID: {order.payment.transactionId}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="divide-y">
          {order.items.map((item, index) => (
            <div key={index} className="py-4 flex items-center">
              <img
                src={item.image || '/placeholder.png'}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 ml-4">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">SKU: {item.sku || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(item.price)} x {item.quantity}</p>
                <p className="text-sm text-gray-600">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 mt-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Shipping</span>
            <span>{order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm mt-1 text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;