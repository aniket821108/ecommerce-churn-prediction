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
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

// Admin Imports
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductsManagement';
import AdminOrders from './pages/admin/OrdersManagement';
import AdminUsers from './pages/admin/UsersManagement';
import AdminChurn from './pages/admin/ChurnAnalytics';
import AdminSidebar from './components/admin/AdminSidebar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// ── Dark Admin Layout ─────────────────────────────────
const AdminLayout = () => (
  <div style={{ display:'flex', minHeight:'100vh', background:'#0a0a0a', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
    <AdminSidebar />
    <div style={{ flex:1, marginLeft:'240px', minHeight:'100vh', background:'#0a0a0a' }}>
      <div style={{ height:'56px', borderBottom:'1px solid #1f1f1f', background:'#0a0a0a', display:'flex', alignItems:'center', padding:'0 32px', position:'sticky', top:0, zIndex:30 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'13px', color:'#404040' }}>Admin</span>
          <span style={{ fontSize:'13px', color:'#2a2a2a' }}>/</span>
          <span style={{ fontSize:'13px', color:'#737373', fontWeight:500 }}>Panel</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#16a34a', display:'inline-block' }} />
            <span style={{ fontSize:'12px', color:'#404040' }}>Live</span>
          </div>
          <Link to="/"
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:500, color:'#737373', textDecoration:'none', padding:'5px 12px', borderRadius:'8px', border:'1px solid #2a2a2a', background:'#111111', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#e5e5e5'; e.currentTarget.style.borderColor='#404040'; e.currentTarget.style.background='#1a1a1a'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#737373'; e.currentTarget.style.borderColor='#2a2a2a'; e.currentTarget.style.background='#111111'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Store
          </Link>
        </div>
      </div>
      <div style={{ padding:'32px', maxWidth:'1280px' }}>
        <Outlet />
      </div>
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
      { path: 'verify-otp', element: <OtpVerify /> }, // ✅ Route added
      { path: 'profile', element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
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