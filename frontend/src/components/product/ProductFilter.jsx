import { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';

const ProductFilter = ({ filters, setFilters, setPage }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isOpen, setIsOpen] = useState(false); // mobile toggle

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setPage(1);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const empty = {};
    setLocalFilters(empty);
    setFilters(empty);
    setPage(1);
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '' && v !== undefined);

  const inputClass =
    'w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white focus:border-indigo-400 transition-all duration-200 text-gray-700 placeholder-gray-400';

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Category
        </label>
        <select
          name="category"
          value={localFilters.category || ''}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Price Range (₹)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            placeholder="Min"
            value={localFilters.minPrice || ''}
            onChange={handleChange}
            className={inputClass}
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Max"
            value={localFilters.maxPrice || ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Brand
        </label>
        <input
          type="text"
          name="brand"
          placeholder="e.g. Nike, Samsung…"
          value={localFilters.brand || ''}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Sort By
        </label>
        <select
          name="sort"
          value={localFilters.sort || ''}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Default</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-createdAt">Newest First</option>
          <option value="-ratings.average">Top Rated</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={applyFilters}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-sm shadow-indigo-200"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Toggle Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:border-indigo-400 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {Object.values(localFilters).filter(v => v !== '' && v !== undefined).length}
          </span>
        )}
      </button>

      {/* ── Mobile Drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:block bg-white rounded-2xl p-5 sticky top-24"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <FilterContent />
      </div>
    </>
  );
};

export default ProductFilter;