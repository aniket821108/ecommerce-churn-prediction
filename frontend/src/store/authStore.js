import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // ✅ Called from OtpVerify + Login pages directly with user+token
      login: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      // ✅ Called from Login.jsx — fetches via authService
      loginWithCredentials: async (email, password) => {
        const response = await authService.login({ email, password });
        // Backend returns: { success: true, token, user }
        const { token, user } = response.data;
        localStorage.setItem('accessToken', token);
        set({ user, accessToken: token, isAuthenticated: true });
        return response;
      },

      logout: async () => {
        try { await authService.logout(); } catch (_) {}
        finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, accessToken: null, isAuthenticated: false });
          window.location.href = '/';
        }
      },

      loadUser: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) return;
          const response = await authService.getMe();
          set({ user: response.data.user, isAuthenticated: true });
        } catch (_) {
          localStorage.removeItem('accessToken');
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const response = await authService.updateDetails(data);
        set({ user: response.data.user });
        return response;
      },

      updatePassword: async (data) => authService.updatePassword(data),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;