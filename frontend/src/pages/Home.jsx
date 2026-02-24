import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import Loader from '../components/common/Loader';
import useAuthStore from '../store/authStore'; 
import { Link } from 'react-router-dom';

// ✅ FIXED IMPORT: Pointing to 'common' folder instead of 'home'
import HeroSlider from '../components/common/HeroSlider';

const Home = () => {
  const { user } = useAuthStore(); 
  const isAdmin = user?.role === 'admin'; 

  const { data, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeatured(8),
    enabled: !isAdmin, 
  });

  const featuredProducts = data?.data?.products || [];

  return (
    <div>
      {/* CONDITIONAL RENDERING:
          - If Admin: Show "Welcome Admin" Banner
          - If User: Show the new "Hero Slider"
      */}
      {isAdmin ? (
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20 rounded-lg mb-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome Back, Admin!</h1>
            <p className="text-xl mb-8">Manage your store, track orders, and monitor users.</p>
            <Link
              to="/admin"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      ) : (
        // ✅ The Slider will appear here for normal users
        <HeroSlider />
      )}

      {/* Featured Products (Hidden for Admin) */}
      {!isAdmin && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link to="/shop" className="text-blue-600 hover:underline">View All →</Link>
          </div>
          {isLoading ? <Loader /> : <ProductGrid products={featuredProducts} />}
        </section>
      )}
    </div>
  );
};

export default Home;