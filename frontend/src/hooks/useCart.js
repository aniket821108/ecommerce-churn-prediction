import useCartStore from '../store/cartStore';

export const useCart = () => {
  const { items, subtotal, loading, fetchCart, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  
  return {
    items,
    subtotal,
    loading,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};