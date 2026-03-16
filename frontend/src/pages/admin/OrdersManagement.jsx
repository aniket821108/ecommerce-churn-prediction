import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';
import { EyeIcon, TruckIcon, XCircleIcon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const statusMap = {
  pending:    { bg: '#1f1608', color: '#fbbf24', dot: '#d97706' },
  processing: { bg: '#0d1529', color: '#60a5fa', dot: '#2563eb' },
  shipped:    { bg: '#0f1529', color: '#818cf8', dot: '#4f46e5' },
  delivered:  { bg: '#0d2015', color: '#4ade80', dot: '#16a34a' },
  cancelled:  { bg: '#200d0d', color: '#f87171', dot: '#dc2626' },
};

const paymentMap = {
  completed: { bg: '#0d2015', color: '#4ade80' },
  failed:    { bg: '#200d0d', color: '#f87171' },
  pending:   { bg: '#1f1608', color: '#fbbf24' },
};

const StatusBadge = ({ status, map }) => {
  const s = (map || statusMap)[status] || { bg: '#1a1a1a', color: '#737373', dot: '#404040' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: s.bg, color: s.color }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />}
      {status || 'pending'}
    </span>
  );
};

// Helper — matches any COD variant stored in DB
const isCODOrder = (order) => {
  const method = order.payment?.method?.toLowerCase() || '';
  return method.includes('cash') || method.includes('cod') || method === 'cash_on_delivery';
};

// Shows COD badge in payment column
const PaymentCell = ({ order }) => {
  const isCOD = isCODOrder(order);
  return (
    <div className="flex flex-col gap-1">
      <StatusBadge status={order.payment?.status} map={paymentMap} />
      {isCOD && (
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#525252' }}>
          💵 COD
        </span>
      )}
    </div>
  );
};

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
    onSuccess: () => { queryClient.invalidateQueries(['adminOrders']); toast.success('Order updated'); setSelectedOrder(null); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update'),
  });

  // ── Mark payment as completed (for COD) ──
  const markPaidMutation = useMutation({
    mutationFn: (id) => orderService.updatePayment(id, { paymentStatus: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      toast.success('Payment marked as received ✓');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update payment'),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {};

  const handleStatusUpdate = (order) => {
    const flow = { pending: 'processing', processing: 'shipped', shipped: 'delivered' };
    const newStatus = flow[order.status];
    if (!newStatus) return;
    let trackingNumber = '', courier = '';
    if (newStatus === 'shipped') {
      trackingNumber = prompt('Tracking number:');
      if (!trackingNumber) return;
      courier = prompt('Courier name:');
      if (!courier) return;
    }
    updateStatusMutation.mutate({ id: order._id, status: newStatus, trackingNumber, courier });
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Cancel this order?'))
      updateStatusMutation.mutate({ id: orderId, status: 'cancelled' });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>Orders</h2>
          <p className="text-sm mt-0.5" style={{ color: '#525252' }}>Track and manage customer orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none self-start"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a3a3a3' }}
        >
          <option value="">All Statuses</option>
          {['pending','processing','shipped','delivered','cancelled'].map(s => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Order #', 'Customer', 'Date', 'Total', 'Status', 'Payment', ''].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3 text-xs font-medium uppercase tracking-widest ${i === 6 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#404040' }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  style={{ borderBottom: '1px solid #161616', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-mono font-medium" style={{ color: '#a78bfa' }}>
                      #{order.orderNumber}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm" style={{ color: '#e5e5e5' }}>{order.user?.name}</p>
                    <p className="text-xs" style={{ color: '#404040' }}>{order.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm" style={{ color: '#525252' }}>{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-mono" style={{ color: '#a3a3a3' }}>{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <PaymentCell order={order} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">

                      {/* View button */}
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg"
                        style={{ color: '#525252' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#60a5fa'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}>
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      {/* Mark as Paid — only for COD with pending payment */}
                      {isCODOrder(order) &&
                       order.payment?.status !== 'completed' &&
                       order.status !== 'cancelled' && (
                        <div className="relative group">
                          <button
                            onClick={() => {
                              if (window.confirm(`Mark payment as received for order #${order.orderNumber}?`))
                                markPaidMutation.mutate(order._id);
                            }}
                            disabled={markPaidMutation.isPending}
                            title="Mark COD payment as received"
                            className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                            style={{ color: '#525252' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#0d2015'; e.currentTarget.style.color = '#4ade80'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}>
                            <BanknotesIcon className="h-4 w-4" />
                          </button>
                          {/* Tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col items-end z-50">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                              style={{ background: '#0d2015', color: '#4ade80', border: '1px solid #16a34a44' }}>
                              💵 Mark COD as received
                            </div>
                          </div>
                        </div>
                      )}

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <>
                          {/* Truck button — active only if payment completed */}
                          {order.payment?.status === 'completed' ? (
                            <button
                              onClick={() => handleStatusUpdate(order)}
                              title="Advance order status"
                              className="p-1.5 rounded-lg"
                              style={{ color: '#525252' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#4ade80'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}>
                              <TruckIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="relative group">
                              <button
                                disabled
                                className="p-1.5 rounded-lg cursor-not-allowed opacity-40"
                                style={{ color: '#525252' }}>
                                <TruckIcon className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col items-end z-50">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                                  style={{ background: '#1f1608', color: '#fbbf24', border: '1px solid #92400e' }}>
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                  </svg>
                                  Mark paid first
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cancel button */}
                          <button onClick={() => handleCancel(order._id)} className="p-1.5 rounded-lg"
                            style={{ color: '#525252' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}>
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#404040' }}>No orders found.</p>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid #1a1a1a' }}>
            <span className="text-xs" style={{ color: '#525252' }}>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}>Prev</button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1f1f1f' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs mt-0.5" style={{ color: '#525252' }}>{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg"
                style={{ color: '#525252' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#e5e5e5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#404040' }}>Customer</span>
                <span className="text-sm" style={{ color: '#e5e5e5' }}>{selectedOrder.user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#404040' }}>Total</span>
                <span className="text-sm font-mono" style={{ color: '#a3a3a3' }}>{formatCurrency(selectedOrder.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#404040' }}>Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#404040' }}>Payment Method</span>
                <span className="text-sm font-semibold capitalize" style={{ color: '#a3a3a3' }}>
                  {isCODOrder(selectedOrder) ? '💵 Cash on Delivery' : selectedOrder.payment?.method?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest" style={{ color: '#404040' }}>Payment Status</span>
                <StatusBadge status={selectedOrder.payment?.status} map={paymentMap} />
              </div>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #1f1f1f' }}>
              <button onClick={() => setSelectedOrder(null)}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;