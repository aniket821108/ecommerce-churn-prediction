import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ChatWidget from './components/chat/ChatWidget';
import useAuthStore from './store/authStore';

// ✅ Auth pages without container wrapping or Footer
const FULL_SCREEN_ROUTES = ['/login', '/register', '/verify-otp', '/forgot-password'];

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const location = useLocation();

  useEffect(() => { loadUser(); }, []);

  const isFullScreen = FULL_SCREEN_ROUTES.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {isFullScreen ? (
        <div className="flex-grow relative">
          <Outlet key={location.key} />
        </div>
      ) : (
        <>
          <main className="flex-grow container mx-auto px-4 py-6">
            <Outlet key={location.key} />
          </main>
          <Footer />
          <ChatWidget />
        </>
      )}
    </div>
  );
}

export default App;