import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import Loader from '../components/common/Loader';

const Home = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeatured(8),
  });

  const featuredProducts = data?.data?.products || [];

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20 rounded-lg mb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to E‑Shop</h1>
          <p className="text-xl mb-8">Discover amazing products at great prices</p>
          <a
            href="/shop"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <a href="/shop" className="text-blue-600 hover:underline">View All →</a>
        </div>
        {isLoading ? <Loader /> : <ProductGrid products={featuredProducts} />}
      </section>
    </div>
  );
};

export default Home;