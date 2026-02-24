import { createBrowserRouter, Outlet } from 'react-router-dom';
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

// Admin Imports
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductsManagement';
import AdminOrders from './pages/admin/OrdersManagement';
import AdminUsers from './pages/admin/UsersManagement';
import AdminChurn from './pages/admin/ChurnAnalytics';
import AdminSidebar from './components/admin/AdminSidebar'; // ✅ Import the Sidebar
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// ✅ DEFINE THE LAYOUT HERE
const AdminLayout = () => (
  <div className="flex min-h-screen bg-gray-50">
    <AdminSidebar /> {/* Sidebar stays fixed */}
    <div className="flex-1 p-8 ml-64 transition-all duration-300 mt-16"> {/* ml-64 pushes content right */}
      <Outlet /> {/* This is where Dashboard, Products, etc. will appear */}
    </div>
  </div>
);

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
      // ✅ CORRECT ADMIN ROUTE STRUCTURE
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminLayout /> {/* Use the Layout, NOT the Dashboard */}
          </AdminRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> }, // Default view
          { path: 'products', element: <AdminProducts /> },
          { path: 'orders', element: <AdminOrders /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'churn', element: <AdminChurn /> },
        ]
      }
    ]
  }
]);