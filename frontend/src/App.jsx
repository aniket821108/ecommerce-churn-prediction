import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import useAuthStore from './store/authStore';

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet key={location.key} />
      </main>
      <Footer />
    </div>
  );
}

export default App;