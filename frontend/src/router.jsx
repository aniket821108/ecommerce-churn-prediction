import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductsManagement';
import AdminOrders from './pages/admin/OrdersManagement';
import AdminUsers from './pages/admin/UsersManagement';
import AdminChurn from './pages/admin/ChurnAnalytics';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
      { path: 'product/:id', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: 'orders',
        element: <ProtectedRoute><Orders /></ProtectedRoute>
      },
      {
        path: 'orders/:id',
        element: <ProtectedRoute><OrderDetail /></ProtectedRoute>
      },
      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute><AdminDashboard /></AdminRoute>,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'products', element: <AdminProducts /> },
          { path: 'orders', element: <AdminOrders /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'churn', element: <AdminChurn /> },
        ]
      }
    ]
  }
]);