import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const CustomerRoute = ({ children, requireAuth = false }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

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

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default CustomerRoute;
