import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import Loader from '../components/common/Loader';
import { formatDate, formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// ── Status system ─────────────────────────────────────────
const statusMap = {
  pending:    { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'Processing' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

const paymentStatusMap = {
  completed: { bg: '#dcfce7', color: '#166534' },
  failed:    { bg: '#fee2e2', color: '#991b1b' },
  pending:   { bg: '#fef9c3', color: '#854d0e' },
};

const StatusBadge = ({ status, map = statusMap }) => {
  const s = map[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize"
      style={{ background: s.bg, color: s.color }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />}
      {s.label || status}
    </span>
  );
};

// ── Progress tracker ──────────────────────────────────────
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const STEP_LABELS = { pending: 'Order Placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
const STEP_ICONS = {
  pending:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  processing: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  shipped:    'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  delivered:  'M5 13l4 4L19 7',
};

const OrderTracker = ({ status }) => {
  const currentIdx = STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) return (
    <div className="flex items-center gap-3 p-4 rounded-xl"
      style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <p className="text-sm font-bold" style={{ color: '#991b1b' }}>This order has been cancelled.</p>
    </div>
  );

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: done ? (active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#4f46e5') : '#f1f5f9',
                  boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.2)' : 'none',
                }}>
                <svg className="w-4 h-4" fill="none" stroke={done ? '#fff' : '#d1d5db'} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STEP_ICONS[step]} />
                </svg>
              </div>
              <span className="text-xs font-semibold text-center whitespace-nowrap"
                style={{ color: done ? '#4f46e5' : '#9ca3af' }}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mb-5 mx-1 transition-all duration-500"
                style={{ background: i < currentIdx ? '#4f46e5' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Card wrapper ──────────────────────────────────────────
const Card = ({ title, children, action }) => (
  <div className="rounded-2xl overflow-hidden"
    style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
    <div className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
      <h3 className="text-sm font-black text-gray-800">{title}</h3>
      {action}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['myOrders']);
      toast.success('Order cancelled successfully');
      setShowCancelConfirm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to cancel order'),
  });

  const order = data?.data?.order;

  if (isLoading) return <Loader />;
  if (error || !order) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-red-500 font-semibold mb-3">Order not found.</p>
      <Link to="/orders" className="text-sm text-indigo-600 hover:underline">← Back to Orders</Link>
    </div>
  );

  const canCancel = ['pending', 'processing'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">

      {/* ── Header ── */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mb-2 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Orders
          </Link>
          <h1 className="text-2xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Order #{order.orderNumber || id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* ── Order Tracker ── */}
      <Card title="Order Status">
        <OrderTracker status={order.status} />
        {order.trackingNumber && (
          <div className="mt-5 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <svg className="w-5 h-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <div>
              <p className="text-xs font-bold text-blue-700">Tracking Number</p>
              <p className="text-sm font-mono font-bold text-blue-900">{order.trackingNumber}</p>
              {order.courier && <p className="text-xs text-blue-600 mt-0.5">via {order.courier}</p>}
            </div>
          </div>
        )}
      </Card>

      {/* ── Order Items ── */}
      <Card title={`Items (${order.items?.length})`}>
        <div className="space-y-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-4"
              style={{ paddingBottom: i < order.items.length - 1 ? '16px' : 0, borderBottom: i < order.items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 line-clamp-2">{item.name}</p>
                {item.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          {[
            { label: 'Subtotal', value: formatCurrency(order.subtotal) },
            { label: 'Shipping', value: order.shippingCost === 0 ? 'Free 🎉' : formatCurrency(order.shippingCost), green: order.shippingCost === 0 },
            { label: 'Tax (18% GST)', value: formatCurrency(order.tax), muted: true },
            order.discount > 0 && { label: 'Discount', value: `-${formatCurrency(order.discount)}`, green: true },
          ].filter(Boolean).map(({ label, value, green, muted }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-sm font-semibold ${green ? 'text-emerald-600' : muted ? 'text-gray-400' : 'text-gray-800'}`}>
                {value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <span className="text-base font-black text-gray-900">Total</span>
            <span className="text-base font-black" style={{ color: '#4f46e5' }}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* ── Shipping + Payment ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Shipping Address">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-sm space-y-0.5">
              <p className="font-bold text-gray-900">{order.shippingAddress?.street}</p>
              <p className="text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
              <p className="text-gray-600">{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="text-gray-400 mt-1">📞 {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Payment">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Method</span>
              <span className="text-sm font-bold text-gray-800 capitalize">
                {order.payment?.method?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <StatusBadge status={order.payment?.status} map={paymentStatusMap} />
            </div>
            {order.payment?.transactionId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Transaction ID</span>
                <span className="text-xs font-mono text-gray-600">{order.payment.transactionId}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Notes ── */}
      {order.notes && (
        <Card title="Order Notes">
          <p className="text-sm text-gray-600 leading-relaxed">{order.notes}</p>
        </Card>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid #f8fafc' }}>
              <h3 className="text-base font-black text-gray-900">Cancel Order</h3>
              <p className="text-sm text-gray-400 mt-0.5">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Why are you cancelling this order?"
                  className="w-full rounded-xl text-sm outline-none resize-none"
                  style={{ padding: '10px 14px', background: '#f9fafb', border: '1.5px solid #e5e7eb' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  Keep Order
                </button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: '#ef4444' }}>
                  {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;