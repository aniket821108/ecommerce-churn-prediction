import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const CustomerRoute = ({ children, requireAuth = false }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      toast.error('Admin accounts cannot access shopping cart or checkout.', { id: 'admin-no-shop' });
    }
  }, [isAuthenticated, user?.role]);

  if (isLoading) return null;

  // Admins are redirected to their admin dashboard
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // If route strictly requires auth (e.g. /checkout), redirect to login with return path
  if (requireAuth && !isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${returnUrl}`} replace />;
  }

  return children;
};

export default CustomerRoute;
