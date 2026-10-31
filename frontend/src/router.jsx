import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import PageFallback from './components/common/PageFallback';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import CustomerRoute from './components/common/CustomerRoute';

// Helper to wrap lazy components in Suspense with fallback
const withSuspense = (Component) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

// ── Lazy Loaded Public Pages ─────────────────────────────────
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OtpVerify = lazy(() => import('./pages/OtpVerify'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── Lazy Loaded Admin Pages ──────────────────────────────────
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/ProductsManagement'));
const AdminOrders = lazy(() => import('./pages/admin/OrdersManagement'));
const AdminUsers = lazy(() => import('./pages/admin/UsersManagement'));
const AdminChurn = lazy(() => import('./pages/admin/ChurnAnalytics'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: 'shop', element: withSuspense(Shop) },
      { path: 'product/:id', element: withSuspense(ProductDetail) },
      {
        path: 'cart',
        element: (
          <CustomerRoute requireAuth>
            {withSuspense(Cart)}
          </CustomerRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <CustomerRoute requireAuth>
            {withSuspense(Checkout)}
          </CustomerRoute>
        ),
      },
      { path: 'login', element: withSuspense(Login) },
      { path: 'register', element: withSuspense(Register) },
      { path: 'verify-otp', element: withSuspense(OtpVerify) },
      { path: 'forgot-password', element: withSuspense(ForgotPassword) },
      { path: 'reset-password', element: withSuspense(ResetPassword) },
      { path: 'reset-password/:token', element: withSuspense(ResetPassword) },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            {withSuspense(Profile)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <CustomerRoute requireAuth>
            {withSuspense(Orders)}
          </CustomerRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            {withSuspense(OrderDetail)}
          </ProtectedRoute>
        ),
      },
      // 404 Catch-All Wildcard Route
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
  {
    path: 'admin',
    element: (
      <AdminRoute>
        {withSuspense(AdminLayout)}
      </AdminRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(AdminDashboard) },
      { path: 'products', element: withSuspense(AdminProducts) },
      { path: 'orders', element: withSuspense(AdminOrders) },
      { path: 'users', element: withSuspense(AdminUsers) },
      { path: 'churn', element: withSuspense(AdminChurn) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
]);

export default router;
