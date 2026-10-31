import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ChatWidget from './components/chat/ChatWidget';
import useAuthStore from './store/authStore';

const FULL_SCREEN_ROUTES = ['/login', '/register', '/verify-otp', '/forgot-password'];

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const isFullScreen =
    FULL_SCREEN_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/reset-password');

  const isFullBleed = location.pathname === '/' || location.pathname === '/shop';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      <Header />
      {isFullScreen ? (
        <div className="flex-grow relative flex flex-col justify-center">
          <Outlet key={location.key} />
        </div>
      ) : (
        <>
          <main className={`flex-grow ${isFullBleed ? 'w-full' : 'container mx-auto px-4 py-6'}`}>
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
