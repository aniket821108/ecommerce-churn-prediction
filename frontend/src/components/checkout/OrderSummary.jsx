import React from 'react';
import useCartStore from '../../store/cartStore';

const OrderSummary = () => {
  // 1. Get ONLY the subtotal from the store (since it is the only reliable number right now)
  const { subtotal } = useCartStore();

  // 2. Perform the calculations right here to ensure they are always fresh
  // Use (subtotal || 0) to prevent "undefined" crashes
  const safeSubtotal = subtotal || 0;
  
  // Logic: Shipping is 50 if subtotal < 1000, otherwise free
  const shippingCost = safeSubtotal > 1000 ? 0 : 50;
  
  // Logic: Tax is 18% of subtotal
  const taxAmount = safeSubtotal * 0.18;
  
  // Logic: Total = Subtotal + Tax + Shipping
  const finalTotal = safeSubtotal + taxAmount + shippingCost;

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>
          <p className="font-medium">₹{safeSubtotal.toFixed(2)}</p>
        </div>
        
        <div className="flex justify-between">
          <p className="text-gray-600">Shipping</p>
          <p className="font-medium text-green-600">
            {shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`}
          </p>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-600">Tax (18%)</p>
          <p className="font-medium">₹{taxAmount.toFixed(2)}</p>
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-between">
          <p className="text-lg font-bold">Total</p>
          <p className="text-lg font-bold text-indigo-600">₹{finalTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;