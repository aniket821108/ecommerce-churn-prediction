import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';
import {
  EyeIcon,
  TruckIcon,
  XCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const statusStyles = {
  pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  processing: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  shipped: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dot: 'bg-indigo-500',
  },
  delivered: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
};

const paymentStatusStyles = {
  completed: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    label: 'Paid',
    icon: CheckCircleIcon,
  },
  failed: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    label: 'Failed',
    icon: ExclamationCircleIcon,
  },
  pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    label: 'Unpaid',
    icon: ExclamationCircleIcon,
  },
};

const StatusBadge = ({ status }) => {
  const norm = (status || 'pending').toLowerCase();
  const s = statusStyles[norm] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize whitespace-nowrap ${s.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {norm}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const norm = (status || 'pending').toLowerCase();
  const s = paymentStatusStyles[norm] || paymentStatusStyles.pending;
  const Icon = s.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${s.bg}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{s.label}</span>
    </span>
  );
};

const isCODOrder = (order) => {
  const method = order.payment?.method?.toLowerCase() || '';
  return method.includes('cash') || method.includes('cod') || method === 'cash_on_delivery';
};

const OrdersManagement = () => {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  // Escape key listener & body scroll lock for order modal
  useEffect(() => {
    if (!selectedOrder) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', page, statusFilter],
    queryFn: () => orderService.getAllOrders({ page, limit: 10, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber, courier }) =>
      orderService.updateStatus(id, { status, trackingNumber, courier }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      queryClient.invalidateQueries(['adminStats']);
      toast.success('Order status updated successfully');
      setSelectedOrder(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update order status'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => orderService.updatePayment(id, { paymentStatus: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      queryClient.invalidateQueries(['adminStats']);
      toast.success('Payment marked as received ✓');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update payment status'),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {};

  const handleStatusUpdate = (order) => {
    const flow = { pending: 'processing', processing: 'shipped', shipped: 'delivered' };
    const newStatus = flow[order.status];
    if (!newStatus) return;

    let trackingNumber = '';
    let courier = '';

    if (newStatus === 'shipped') {
      trackingNumber = prompt('Enter parcel tracking number:');
      if (!trackingNumber) return;
      courier = prompt('Enter courier / carrier name (e.g. BlueDart, Delhivery):');
      if (!courier) return;
    }

    updateStatusMutation.mutate({ id: order._id, status: newStatus, trackingNumber, courier });
  };

  const handleCancel = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      updateStatusMutation.mutate({ id: orderId, status: 'cancelled' });
    }
  };

  const filterTabs = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  if (isLoading && !data) return <Loader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Order Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Monitor incoming customer purchases, advance shipment pipelines, and verify receipts.
          </p>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-xs">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 min-h-[38px] ${
                isActive
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Order ID</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Customer</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Date Placed</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Total Amount</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Order Status</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Payment</th>
                <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders.map((order) => {
                const customerName = order.user?.name || 'Guest User';
                const customerEmail = order.user?.email || '—';
                const isCOD = isCODOrder(order);
                const isPaid = order.payment?.status === 'completed';

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* Order Number */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-violet-700 font-mono text-xs">
                        #{order.orderNumber}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="max-w-[160px] sm:max-w-xs">
                        <p className="font-bold text-slate-900 leading-tight truncate">{customerName}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">{customerEmail}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Total */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 font-mono">
                        {formatCurrency(order.total)}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Payment Status & COD Tag */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentBadge status={order.payment?.status} />
                        {isCOD && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            💵 Cash on Delivery
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                          title="View order details"
                          aria-label={`View details for order #${order.orderNumber}`}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>

                        {/* Mark COD Paid */}
                        {isCOD && !isPaid && order.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Mark payment as received for order #${order.orderNumber}?`)) {
                                markPaidMutation.mutate(order._id);
                              }
                            }}
                            disabled={markPaidMutation.isPending}
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            title="Mark COD payment as received"
                            aria-label={`Mark order #${order.orderNumber} as paid`}
                          >
                            <BanknotesIcon className="w-4 h-4" />
                          </button>
                        )}

                        {/* Advance Pipeline */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <>
                            {isPaid ? (
                              <button
                                onClick={() => handleStatusUpdate(order)}
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                title="Advance fulfillment status"
                                aria-label={`Advance status for order #${order.orderNumber}`}
                              >
                                <TruckIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-300 cursor-not-allowed"
                                title="Payment must be marked as received before dispatching"
                                aria-label="Cannot advance status until paid"
                              >
                                <TruckIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* Cancel Order */}
                            <button
                              onClick={() => handleCancel(order._id)}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                              title="Cancel order"
                              aria-label={`Cancel order #${order.orderNumber}`}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="py-16 text-center">
              <ShoppingBagIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No orders found for this category</p>
              <p className="text-xs text-slate-400 mt-0.5">Orders will appear here once placed by shoppers</p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 id="order-detail-title" className="text-base font-extrabold text-slate-900">
                  Order Details #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                aria-label="Close order details"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details (Scrollable on smaller tablet viewports) */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</span>
                <span className="text-sm font-bold text-slate-900">{selectedOrder.user?.name || 'Guest'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Email</span>
                <span className="text-sm font-medium text-slate-600 truncate max-w-[200px]">{selectedOrder.user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fulfillment Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                  {isCODOrder(selectedOrder)
                    ? '💵 Cash on Delivery'
                    : selectedOrder.payment?.method?.replace(/_/g, ' ') || 'Online'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Settlement</span>
                <PaymentBadge status={selectedOrder.payment?.status} />
              </div>

              {selectedOrder.shipping?.trackingNumber && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-xs">
                  <p className="font-bold text-violet-900">Shipment Tracking Info:</p>
                  <p className="text-violet-700 mt-0.5">
                    Courier: <strong>{selectedOrder.shipping.courier || 'Standard Delivery'}</strong> | Waybill: <strong>{selectedOrder.shipping.trackingNumber}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors min-h-[40px] focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
