import React from "react";
import { Link } from "react-router-dom";

// ✅ Destructure props with default values (safety net)
const CartSummary = ({ subtotal = 0, total = 0, shipping = 0, tax = 0 }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Subtotal</p>
          {/* ✅ SAFE: (subtotal || 0) prevents the crash */}
          <p className="text-sm font-medium text-gray-900">₹{(subtotal || 0).toFixed(2)}</p>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">Shipping estimate</p>
          <p className="text-sm font-medium text-gray-900">₹{(shipping || 0).toFixed(2)}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">Tax estimate</p>
          <p className="text-sm font-medium text-gray-900">₹{(tax || 0).toFixed(2)}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-base font-medium text-gray-900">Order total</p>
          <p className="text-base font-medium text-gray-900">₹{(total || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/checkout"
          className="w-full block text-center bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
};

export default CartSummary;