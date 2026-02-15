import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Loader from '../components/common/Loader';

const Cart = () => {
  const { items, subtotal, loading, fetchCart } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) return <Loader />;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/shop"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Mock values for demo - replace with actual data from cart
  const discount = 0;
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal - discount + shipping;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {items.map((item) => (
              <CartItem key={item.product._id} item={item} />
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;