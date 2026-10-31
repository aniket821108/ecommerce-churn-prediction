import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Always send HttpOnly cookies
});

// ── Token refresh queue ───────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

// Auth-related paths that shouldn't trigger redirect
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-otp'];
const isAuthPage = () => AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));

// ── Request interceptor ────────────────────────────────
api.interceptors.request.use((config) => {
  // Let the browser set the multipart/form-data boundary automatically when sending FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ── Response interceptor ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const orig = error.config;

    // Token expired → attempt refresh (once)
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !orig._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(orig));
      }

      orig._retry  = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh-token');
        processQueue(null);
        return api(orig);
      } catch (refreshErr) {
        processQueue(refreshErr);
        // Refresh failed — session is dead
        const { default: useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().clearAuth();

        if (!isAuthPage()) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?next=${next}`;
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Other 401 (invalid/revoked) → clear auth + redirect
    if (error.response?.status === 401 && !isAuthPage()) {
      const { default: useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().clearAuth();

      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
      return Promise.reject(error);
    }

    // Don't auto-toast on auth pages (they handle their own errors)
    if (!isAuthPage() && error.response?.status !== 401) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;