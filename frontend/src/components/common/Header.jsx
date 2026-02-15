import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useEffect, useState } from 'react';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const itemCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // ✅ Check if the user is an admin
  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">E‑Shop</Link>
        
        {/* ✅ MIDDLE NAVIGATION: Admin vs User Logic */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          
          {isAdmin ? (
            <Link to="/admin" className="font-bold text-blue-700 hover:text-blue-900">
              Admin Dashboard
            </Link>
          ) : (
            <Link to="/shop" className="hover:text-blue-600">Shop</Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          
          {/* ✅ CART ICON: Only show if NOT admin */}
          {!isAdmin && (
            <Link to="/cart" className="relative">
              <ShoppingCartIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <div 
              className="relative"
              // ✅ HOVER FIX: Keep using state
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button className="flex items-center space-x-1 py-2">
                <UserIcon className="h-6 w-6" />
                <span className="hidden md:inline font-medium">
                  {user?.name?.split(' ')[0]} {isAdmin ? '(Admin)' : ''}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  
                  {/* ✅ HOVER FIX: Keep Invisible Bridge */}
                  <div className="absolute -top-4 left-0 w-full h-4 bg-transparent"></div>

                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
                  
                  
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 font-semibold">
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login" className="px-3 py-1 border rounded hover:bg-gray-50">Login</Link>
              <Link to="/register" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;