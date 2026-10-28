import { createBrowserRouter, Outlet, Link } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import OtpVerify from './pages/OtpVerify'; // ✅ Import added
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

// Admin Imports
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductsManagement';
import AdminOrders from './pages/admin/OrdersManagement';
import AdminUsers from './pages/admin/UsersManagement';
import AdminChurn from './pages/admin/ChurnAnalytics';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import CustomerRoute from './components/common/CustomerRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
      { path: 'product/:id', element: <ProductDetail /> },
      { path: 'cart', element: <CustomerRoute requireAuth><Cart /></CustomerRoute> },
      { path: 'checkout', element: <CustomerRoute requireAuth><Checkout /></CustomerRoute> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-otp', element: <OtpVerify /> }, // ✅ Route added
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'reset-password/:token', element: <ResetPassword /> },
      { path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: 'orders', element: <CustomerRoute requireAuth><Orders /></CustomerRoute> },
      { path: 'orders/:id', element: <ProtectedRoute><OrderDetail /></ProtectedRoute> },
    ]
  },
  {
    path: 'admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'churn', element: <AdminChurn /> },
    ]
  }
]);