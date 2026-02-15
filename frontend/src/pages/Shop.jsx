import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';

const Shop = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => productService.getProducts({ page, limit: 12, ...filters }),
    keepPreviousData: true,
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};

  if (isError) {
    return <div className="text-center py-10 text-red-500">Failed to load products.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <ProductFilter filters={filters} setFilters={setFilters} setPage={setPage} />
      </aside>
      <main className="lg:col-span-3">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <ProductGrid products={products} />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Shop;