import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cartService from '../services/cartService';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      loading: false,

      fetchCart: async () => {
        set({ loading: true });
        try {
          const response = await cartService.getCart();
          set({ 
            items: response.data.cart.items || [], 
            subtotal: response.data.subtotal,
            loading: false 
          });
        } catch (error) {
          if (error.response?.data?.code === 'ADMIN_SHOPPING_RESTRICTED') {
            set({ items: [], subtotal: 0, loading: false });
            return;
          }
          set({ loading: false });
          throw error;
        }
      },

      addItem: async (productId, quantity = 1) => {
        try {
          const response = await cartService.addToCart({ productId, quantity });
          const cart = response.data.cart;
          set({ items: cart.items, subtotal: response.data.subtotal });
          toast.success('Added to cart');
          return response;
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to add to cart');
          throw error;
        }
      },

      removeItem: async (productId) => {
        try {
          const response = await cartService.removeItem(productId);
          const cart = response.data.cart;
          set({ items: cart.items, subtotal: response.data.subtotal });
          toast.success('Item removed');
          return response;
        } catch (error) {
          toast.error('Failed to remove item');
          throw error;
        }
      },

      updateQuantity: async (productId, quantity) => {
        try {
          const response = await cartService.updateQuantity(productId, quantity);
          const cart = response.data.cart;
          set({ items: cart.items, subtotal: response.data.subtotal });
          return response;
        } catch (error) {
          toast.error('Failed to update quantity');
          throw error;
        }
      },

      clearCart: async () => {
        try {
          await cartService.clearCart();
          set({ items: [], subtotal: 0 });
          toast.success('Cart cleared');
        } catch (error) {
          toast.error('Failed to clear cart');
          throw error;
        }
      },

      // Client-only cart wipe on logout / unauthenticated session
      resetCartLocal: () => {
        set({ items: [], subtotal: 0, loading: false });
        try {
          localStorage.removeItem('cart-storage');
        } catch (_) {}
      },
    }),
    {
      name: 'cart-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useCartStore;