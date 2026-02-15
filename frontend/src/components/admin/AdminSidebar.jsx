import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

// ✅ ADMIN IMPORTS
import AdminRoute from "./components/common/AdminRoute";
import Dashboard from "./pages/admin/Dashboard";
import ProductsManagement from "./pages/admin/ProductsManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import ChurnAnalytics from "./pages/admin/ChurnAnalytics";
import AdminSidebar from "./components/admin/AdminSidebar"; 
import { Outlet } from "react-router-dom";

// ✅ ADMIN LAYOUT: This adds the Sidebar to every admin page automatically!
const AdminLayout = () => (
  <div className="flex min-h-screen bg-gray-50">
    {/* The Sidebar */}
    <AdminSidebar />
    
    {/* The Page Content (pushed right by ml-64 to make room for sidebar) */}
    <div className="flex-1 p-8 ml-64 transition-all duration-300">
      <Outlet />
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // User Routes
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "shop", element: <Shop /> },
      { path: "product/:id", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "profile", element: <Profile /> },
      { path: "orders", element: <Orders /> },
      { path: "order/:id", element: <OrderDetail /> },
      
      // ✅ ADMIN ROUTES (Wrapped in AdminLayout)
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "products", element: <ProductsManagement /> },
          { path: "orders", element: <OrdersManagement /> },
          { path: "users", element: <UsersManagement /> },
          { path: "churn-analytics", element: <ChurnAnalytics /> },
        ],
      },
    ],
  },
]);