import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await authService.login({ email, password });
        const { user, tokens } = response.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ 
          user, 
          accessToken: tokens.accessToken, 
          refreshToken: tokens.refreshToken, 
          isAuthenticated: true 
        });
        return response;
      },

      register: async (userData) => {
        const response = await authService.register(userData);
        const { user, tokens } = response.data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ 
          user, 
          accessToken: tokens.accessToken, 
          refreshToken: tokens.refreshToken, 
          isAuthenticated: true 
        });
        return response;
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          window.location.href = '/';
        }
      },

      loadUser: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) return;
          
          const response = await authService.getMe();
          set({ user: response.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const response = await authService.updateDetails(data);
        set({ user: response.data.user });
        return response;
      },

      updatePassword: async (data) => {
        return await authService.updatePassword(data);
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;