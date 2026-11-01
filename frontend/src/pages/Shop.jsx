import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CameraIcon,
  SparklesIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { productService } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import VisualSearchModal from '../components/product/VisualSearchModal';
import Pagination from '../components/common/Pagination';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visualModalOpen, setVisualModalOpen] = useState(false);

  // Extract initial filters from URL query parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const search = searchParams.get('search') || '';

  const filters = useMemo(() => {
    const f = {};
    if (category) f.category = category;
    if (brand) f.brand = brand;
    if (minPrice) f.minPrice = minPrice;
    if (maxPrice) f.maxPrice = maxPrice;
    if (sort) f.sort = sort;
    if (search) f.search = search;
    return f;
  }, [category, brand, minPrice, maxPrice, sort, search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => productService.getProducts({ page, limit: 12, ...filters }),
    keepPreviousData: true,
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};

  // Helper to update search params
  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    // Default page 1 when filters change
    params.set('page', '1');

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== '' && val !== undefined && val !== null) {
        params.set(key, val);
      }
    });

    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeSingleFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Active filter items for tag pills
  const activeTags = [];
  if (category) activeTags.push({ key: 'category', label: `Category: ${category}` });
  if (brand) activeTags.push({ key: 'brand', label: `Brand: ${brand}` });
  if (search) activeTags.push({ key: 'search', label: `Search: "${search}"` });
  if (minPrice || maxPrice) {
    activeTags.push({
      key: 'price',
      label: `Price: ₹${minPrice || '0'} – ₹${maxPrice || '∞'}`,
      isPrice: true,
    });
  }

  return (
    <div className="font-sans max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pt-2">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
            Browse Catalog
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {category ? (
              <span className="capitalize">{category} Collection</span>
            ) : search ? (
              <span>Results for "{search}"</span>
            ) : (
              'All Products'
            )}
            {pagination.total !== undefined && (
              <span className="ml-2.5 text-sm sm:text-base font-bold text-slate-400">
                ({pagination.total} {pagination.total === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Left Sidebar Filters ── */}
        <aside className="lg:col-span-1">
          <ProductFilter
            filters={filters}
            setFilters={updateFilters}
            setPage={handlePageChange}
          />
        </aside>

        {/* ── Main Catalog Grid ── */}
        <main className="lg:col-span-3 space-y-5">
          {/* AI Visual Search Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <CameraIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  Have an image of what you want?
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                    <SparklesIcon className="w-2.5 h-2.5 text-indigo-600" /> Gemini Vision
                  </span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Upload any photo to find exact or visually similar items instantly.
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

          {/* Active Filter Pills Bar */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Active:
              </span>
              {activeTags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-2xs"
                >
                  <span className="capitalize">{tag.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (tag.isPrice) {
                        removeSingleFilter('minPrice');
                        removeSingleFilter('maxPrice');
                      } else {
                        removeSingleFilter(tag.key);
                      }
                    }}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 ml-1 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Error Message */}
          {isError ? (
            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-sm font-bold text-rose-600 mb-2">
                Unable to load products. Please check your connection.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Product Grid with Skeleton Loading Support */}
              <ProductGrid
                products={products}
                loading={isLoading}
                onClearFilters={activeTags.length > 0 ? clearAllFilters : undefined}
              />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── AI Visual Search Modal ── */}
      <VisualSearchModal
        isOpen={visualModalOpen}
        onClose={() => setVisualModalOpen(false)}
      />
    </div>
  );
};

export default Shop;