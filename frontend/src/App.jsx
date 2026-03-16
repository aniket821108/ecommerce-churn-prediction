import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import useAuthStore from './store/authStore';

// Pages that should NOT have the container wrapper (full-screen layouts)
const FULL_SCREEN_ROUTES = ['/login', '/register'];

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const isFullScreen = FULL_SCREEN_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {isFullScreen ? (
        // ── Full screen: no container, no padding, no footer ──
        <div className="flex-grow relative">
          <Outlet key={location.key} />
        </div>
      ) : (
        // ── Normal pages: container + footer ──
        <>
          <main className="flex-grow container mx-auto px-4 py-6">
            <Outlet key={location.key} />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;