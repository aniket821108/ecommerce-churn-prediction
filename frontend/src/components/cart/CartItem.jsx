import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import useCartStore from '../../store/cartStore';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    setLoading(true);
    try {
      await updateQuantity(item.product._id, newQuantity);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeItem(item.product._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center py-4 border-b">
      <img 
        src={item.product.images?.[0]?.url || '/placeholder.png'} 
        alt={item.product.name}
        className="w-20 h-20 object-cover rounded"
      />
      <div className="flex-1 ml-4">
        <h3 className="font-semibold">{item.product.name}</h3>
        <p className="text-gray-600 text-sm">₹{item.price}</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1 || loading}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          -
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={loading}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          +
        </button>
      </div>
      <div className="ml-4 w-24 text-right font-semibold">
        ₹{item.price * item.quantity}
      </div>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="ml-4 text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CartItem;