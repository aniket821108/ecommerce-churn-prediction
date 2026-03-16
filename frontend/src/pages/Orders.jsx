import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import Loader from '../components/common/Loader';
import { formatDate, formatCurrency } from '../utils/formatters';

const statusMap = {
  pending:    { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Processing' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const s = statusMap[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

const FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => orderService.getMyOrders(),
  });

  const allOrders = data?.data?.orders || [];
  const orders = activeFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === activeFilter);

  if (isLoading) return <Loader />;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-red-500 font-semibold">Failed to load orders.</p>
      <Link to="/shop" className="mt-3 text-sm text-indigo-600 hover:underline">Go to Shop</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8">

      {/* Header */}
      <div className="pt-2 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Account</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            My Orders
            {allOrders.length > 0 && (
              <span className="ml-3 text-lg font-bold text-gray-400">({allOrders.length})</span>
            )}
          </h1>
        </div>
        <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          Shop more →
        </Link>
      </div>

      {/* Filter tabs */}
      {allOrders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all duration-150"
              style={{
                background: activeFilter === f ? '#4f46e5' : '#f8fafc',
                color: activeFilter === f ? '#fff' : '#6b7280',
                border: `1px solid ${activeFilter === f ? '#4f46e5' : '#f1f5f9'}`,
              }}>
              {f === 'all' ? `All (${allOrders.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${allOrders.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: '#f5f3ff' }}>
            <svg className="w-8 h-8" style={{ color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-black text-gray-800 mb-2">
            {activeFilter === 'all' ? 'No orders yet' : `No ${activeFilter} orders`}
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {activeFilter === 'all'
              ? "You haven't placed any orders yet. Start shopping!"
              : `You don't have any ${activeFilter} orders.`}
          </p>
          <Link to="/shop"
            className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
            Start Shopping
          </Link>
        </div>
      )}

      {/* Order cards */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order._id} to={`/orders/${order._id}`}
            className="block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Order</p>
                  <p className="text-sm font-black text-gray-900">#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div className="w-px h-8" style={{ background: '#e5e7eb' }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Date</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Card body */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              {/* Product thumbnails */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <div key={i}
                      className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ border: '2px solid #fff', zIndex: 3 - i }}>
                      <img
                        src={item.image || item.product?.images?.[0]?.url || '/placeholder.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ border: '2px solid #fff', background: '#f5f3ff', color: '#7c3aed', zIndex: 0 }}>
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500 ml-2">
                  {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Total */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Total</p>
                <p className="text-lg font-black text-gray-900">{formatCurrency(order.total)}</p>
              </div>
            </div>

            {/* Tracking bar (if shipped) */}
            {order.status === 'shipped' && order.trackingNumber && (
              <div className="px-6 py-3 flex items-center gap-2"
                style={{ borderTop: '1px solid #f8fafc', background: '#f0f9ff' }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: '#4338ca' }}>
                  Tracking: <span className="font-mono">{order.trackingNumber}</span>
                  {order.courier && ` via ${order.courier}`}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Orders;