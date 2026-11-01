import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cartService from '../services/cartService';
import useAuthStore from './authStore';
import toast from 'react-hot-toast';

const computeSubtotal = (items = []) =>
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      loading: false,

      // Fetch cart: MongoDB if authenticated, local memory/storage if guest
      fetchCart: async () => {
        const { isAuthenticated, user } = useAuthStore.getState();
        if (user?.role === 'admin') {
          set({ items: [], subtotal: 0, loading: false });
          return;
        }

        if (!isAuthenticated) {
          set((state) => ({ subtotal: computeSubtotal(state.items), loading: false }));
          return;
        }

        set({ loading: true });
        try {
          const response = await cartService.getCart();
          const items = response.data.cart?.items || [];
          set({
            items,
            subtotal: response.data.subtotal || computeSubtotal(items),
            loading: false,
          });
        } catch (error) {
          if (error.response?.data?.code === 'ADMIN_SHOPPING_RESTRICTED') {
            set({ items: [], subtotal: 0, loading: false });
            return;
          }
          set({ loading: false });
        }
      },

      // Add item — supports both guest (localStorage) and customer (MongoDB)
      addItem: async (productOrId, quantity = 1) => {
        const { isAuthenticated, user } = useAuthStore.getState();
        if (user?.role === 'admin') {
          toast.error('Admins cannot purchase products. Please use a customer account.');
          return;
        }

        const isObject = typeof productOrId === 'object' && productOrId !== null;
        const productId = isObject ? productOrId._id : productOrId;

        if (isAuthenticated) {
          try {
            const response = await cartService.addToCart({ productId, quantity });
            const cart = response.data.cart;
            set({ items: cart.items || [], subtotal: response.data.subtotal || computeSubtotal(cart.items) });
            toast.success('Added to cart');
            return response;
          } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
            throw error;
          }
        }

        // Guest Flow (Local Storage persistence)
        const currentItems = [...get().items];
        const existingIndex = currentItems.findIndex(
          (item) => (item.product?._id || item.product) === productId
        );

        if (existingIndex > -1) {
          const existing = currentItems[existingIndex];
          const newQty = existing.quantity + quantity;
          const maxStock = isObject ? (productOrId.stock ?? 99) : (existing.product?.stock ?? 99);
          if (newQty > maxStock) {
            toast.error(`Only ${maxStock} items available in stock`);
            return;
          }
          currentItems[existingIndex] = {
            ...existing,
            quantity: newQty,
          };
        } else {
          const productPayload = isObject
            ? {
                _id: productOrId._id,
                name: productOrId.name,
                price: productOrId.price,
                images: productOrId.images || [],
                brand: productOrId.brand || '',
                stock: productOrId.stock ?? 99,
              }
            : { _id: productId, name: 'Product', price: 0, images: [] };

          currentItems.push({
            product: productPayload,
            price: isObject ? productOrId.price : 0,
            quantity,
          });
        }

        const newSubtotal = computeSubtotal(currentItems);
        set({ items: currentItems, subtotal: newSubtotal });
        toast.success('Added to cart');
      },

      // Remove item
      removeItem: async (productId) => {
        const { isAuthenticated } = useAuthStore.getState();

        if (isAuthenticated) {
          try {
            const response = await cartService.removeItem(productId);
            const cart = response.data.cart;
            set({ items: cart.items || [], subtotal: response.data.subtotal || computeSubtotal(cart.items) });
            toast.success('Item removed');
            return response;
          } catch (error) {
            toast.error('Failed to remove item');
            throw error;
          }
        }

        // Guest Flow
        const currentItems = get().items.filter(
          (item) => (item.product?._id || item.product) !== productId
        );
        set({ items: currentItems, subtotal: computeSubtotal(currentItems) });
        toast.success('Item removed');
      },

      // Update quantity
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          return get().removeItem(productId);
        }

        const { isAuthenticated } = useAuthStore.getState();

        if (isAuthenticated) {
          try {
            const response = await cartService.updateQuantity(productId, quantity);
            const cart = response.data.cart;
            set({ items: cart.items || [], subtotal: response.data.subtotal || computeSubtotal(cart.items) });
            return response;
          } catch (error) {
            toast.error('Failed to update quantity');
            throw error;
          }
        }

        // Guest Flow
        const currentItems = get().items.map((item) => {
          if ((item.product?._id || item.product) === productId) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ items: currentItems, subtotal: computeSubtotal(currentItems) });
      },

      // Clear cart
      clearCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            await cartService.clearCart();
            set({ items: [], subtotal: 0 });
            toast.success('Cart cleared');
          } catch (error) {
            toast.error('Failed to clear cart');
            throw error;
          }
        } else {
          set({ items: [], subtotal: 0 });
          toast.success('Cart cleared');
        }
      },

      // Merge local guest cart to server on login
      syncGuestCartToServer: async () => {
        const guestItems = get().items;
        if (!guestItems || guestItems.length === 0) {
          return get().fetchCart();
        }

        try {
          for (const item of guestItems) {
            const pid = item.product?._id || item.product;
            if (pid) {
              await cartService.addToCart({ productId: pid, quantity: item.quantity }).catch(() => {});
            }
          }
          await get().fetchCart();
        } catch (_) {
          await get().fetchCart();
        }
      },

      // Client-only cart wipe on explicit logout
      resetCartLocal: () => {
        set({ items: [], subtotal: 0, loading: false });
        try {
          localStorage.removeItem('cart-storage');
        } catch (_) {}
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;
