import useCartStore from '../../store/cartStore';
import { Link } from 'react-router-dom';
import { useFormContext } from 'react-hook-form';
import {
  DocumentCheckIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const OrderSummary = () => {
  const { items, subtotal } = useCartStore();
  const formMethods = useFormContext();
  const shippingState = formMethods?.watch ? formMethods.watch('shippingAddress.state') : '';

  const safeSubtotal = subtotal || 0;
  const shippingCost = safeSubtotal > 1000 ? 0 : 50;

  // Statutory Indian GST Computation matching backend calculateOrderTax
  let calculatedTax = 0;
  let hasBookItems = false;

  for (const item of items) {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    const name = (item.product?.name || '').toLowerCase();
    const category = (item.product?.category || '').toLowerCase();
    const sku = (item.product?.sku || '').toUpperCase();

    const isBook = category === 'books' || sku.startsWith('HSN-4901') || name.includes('book') || name.includes('novel');
    if (isBook) {
      hasBookItems = true;
    } else {
      calculatedTax += itemTotal * 0.18;
    }
  }

  const taxAmount = +(calculatedTax.toFixed(2));
  const finalTotal = safeSubtotal + taxAmount + shippingCost;

  // Determine Intrastate vs Interstate place of supply
  const isIntrastate = (shippingState || '').trim().toLowerCase() === 'maharashtra';

  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm sticky top-24 font-sans">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
          Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h2>
        <Link
          to="/cart"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Edit Cart
        </Link>
      </div>

      {/* Cart Items List */}
      <div className="px-6 py-4 space-y-3 max-h-56 overflow-y-auto divide-y divide-slate-50">
        {items.map((item) => (
          <div key={item.product._id} className="flex items-center gap-3 pt-2.5 first:pt-0">
            <div className="relative shrink-0">
              <img
                src={item.product.images?.[0]?.url || '/placeholder.png'}
                alt={item.product.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-100"
              />
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[10px] font-black bg-indigo-600 shadow-2xs">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {item.product.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Qty {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
              </p>
            </div>
            <p className="text-xs font-black text-slate-900 shrink-0">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Financial & GST Breakdown */}
      <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-slate-50/30">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Subtotal</span>
          <span className="font-bold text-slate-800">
            ₹{safeSubtotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Delivery Charges</span>
          <span className={`font-bold ${shippingCost === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {shippingCost === 0 ? 'Free Shipping 🎉' : `₹${shippingCost}`}
          </span>
        </div>

        {/* Free shipping nudge */}
        {safeSubtotal < 1000 && safeSubtotal > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
            <TruckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Add ₹{(1000 - safeSubtotal).toLocaleString('en-IN')} more for free delivery</span>
          </div>
        )}

        {/* GST Tax Breakdown */}
        <div className="pt-2 border-t border-slate-100/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <DocumentCheckIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Statutory Indian GST</span>
            </span>
            <span className="font-bold text-slate-800">
              ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Place of supply dynamic indicator */}
          {shippingState && (
            <p className="text-[10px] text-slate-400 font-medium pl-4.5">
              {isIntrastate
                ? `Intrastate (CGST 9% + SGST 9%) to ${shippingState}`
                : `Interstate (IGST 18%) to ${shippingState}`}
            </p>
          )}

          {hasBookItems && (
            <p className="text-[10px] text-emerald-600 font-semibold pl-4.5">
              Includes statutory 0% NIL-rated books (HSN 4901)
            </p>
          )}
        </div>

        {/* Total */}
        <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-700">
              Total Amount
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Inclusive of all taxes & statutory duties
            </p>
          </div>
          <p className="text-lg font-black text-indigo-600 tracking-tight">
            ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Trust Badges Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>SSL 256-bit</span>
        </span>
        <span>•</span>
        <span>Razorpay Verified</span>
        <span>•</span>
        <span>GST Invoice PDF</span>
      </div>
    </div>
  );
};

export default OrderSummary;