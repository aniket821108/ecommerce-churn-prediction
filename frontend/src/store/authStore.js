import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // starts true until loadUser completes

      // Set auth state (called after successful login/register)
      setAuth: (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
        if (user?.role !== 'admin') {
          import('./cartStore').then(({ default: useCartStore }) => {
            useCartStore.getState().syncGuestCartToServer().catch(() => {});
          }).catch(() => {});
        }
      },

      // Clear auth state (called on logout / token failure)
      clearAuth: () => {
        try { localStorage.removeItem('cart-storage'); } catch (_) {}
        import('./cartStore').then(({ default: useCartStore }) => {
          useCartStore.getState().resetCartLocal();
        }).catch(() => {});
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      // Login via API — tokens are set as HttpOnly cookies by the backend
      loginWithCredentials: async (email, password, rememberMe = false) => {
        const response = await api.post('/auth/login', { email, password, rememberMe });
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        if (response.data.user?.role !== 'admin') {
          import('./cartStore').then(({ default: useCartStore }) => {
            useCartStore.getState().syncGuestCartToServer().catch(() => {});
          }).catch(() => {});
        }
        return response;
      },

      // Logout — clears server session + cookies + local state
      logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) {}
        try { localStorage.removeItem('cart-storage'); } catch (_) {}
        const { default: useCartStore } = await import('./cartStore');
        useCartStore.getState().resetCartLocal();
        set({ user: null, isAuthenticated: false, isLoading: false });
        window.location.href = '/';
      },

      // Load user from server using HttpOnly cookie
      loadUser: async () => {
        try {
          const response = await api.get('/auth/me', {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            params: { _t: Date.now() },
          });
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (_) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        const response = await api.put('/users/profile', data);
        set({ user: response.data.user });
        return response;
      },

      updatePassword: async (data) => api.put('/auth/update-password', data),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;