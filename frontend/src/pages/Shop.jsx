import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CameraIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import VisualSearchModal from '../components/product/VisualSearchModal';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';

const Shop = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [visualModalOpen, setVisualModalOpen] = useState(false);

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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <ProductFilter filters={filters} setFilters={setFilters} setPage={setPage} />
        </aside>
        <main className="lg:col-span-3">
          {/* AI Visual Search Banner */}
          <div className="mb-5 bg-linear-to-r from-indigo-50 via-violet-50/50 to-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <CameraIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Have a product photo?
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                    <SparklesIcon className="w-2.5 h-2.5" /> AI Gemini Vision
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Snap or upload an image to match shoes, electronics, or clothing from our catalog.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVisualModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <CameraIcon className="w-4 h-4" />
              <span>Search by Image</span>
            </button>
          </div>

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

      {/* AI Visual Search Modal */}
      <VisualSearchModal
        isOpen={visualModalOpen}
        onClose={() => setVisualModalOpen(false)}
      />
    </>
  );
};

export default Shop;
