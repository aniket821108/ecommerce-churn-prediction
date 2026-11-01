import { useState, useEffect } from 'react';
import { CATEGORIES } from '../../utils/constants';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import {
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹1,000', min: '0', max: '1000' },
  { label: '₹1,000 – ₹5,000', min: '1000', max: '5000' },
  { label: '₹5,000 – ₹15,000', min: '5000', max: '15000' },
  { label: 'Above ₹15,000', min: '15000', max: '' },
];

const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Top Rated', value: '-ratings.average' },
];

const ProductFilter = ({ filters = {}, setFilters, setPage }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync with prop changes (e.g. from URL params)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (name, value) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    if (setPage) setPage(1);
    setIsDrawerOpen(false);
  };

  const clearFilters = () => {
    const empty = {};
    setLocalFilters(empty);
    setFilters(empty);
    if (setPage) setPage(1);
    setIsDrawerOpen(false);
  };

  const activeFilterCount = Object.entries(localFilters).filter(
    ([k, v]) => v !== '' && v !== undefined && k !== 'page' && k !== 'limit'
  ).length;

  const FilterBody = () => (
    <div className="space-y-6 font-sans">
      {/* ── Category ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleChange('category', '')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !localFilters.category
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange('category', cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                localFilters.category === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Price Presets & Custom ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
          Price Range
        </label>
        <div className="space-y-1.5 mb-3">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected =
              (localFilters.minPrice || '') === preset.min &&
              (localFilters.maxPrice || '') === preset.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    minPrice: preset.min,
                    maxPrice: preset.max,
                  }));
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <span className="text-indigo-600 font-black">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Custom Price Inputs */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            placeholder="Min ₹"
            value={localFilters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
          <span className="text-slate-400 text-xs font-bold">–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={localFilters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* ── Brand Filter ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Brand
        </label>
        <input
          type="text"
          placeholder="Filter by brand (e.g. Nike, Apple)"
          value={localFilters.brand || ''}
          onChange={(e) => handleChange('brand', e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* ── Sort By ── */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Sort By
        </label>
        <select
          value={localFilters.sort || '-createdAt'}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Action Buttons ── */}
      <div className="pt-2 space-y-2">
        <Button
          onClick={applyFilters}
          variant="primary"
          size="md"
          className="w-full justify-center shadow-xs"
        >
          Apply Filters
        </Button>
        {activeFilterCount > 0 && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="w-full justify-center text-slate-500 hover:text-rose-600"
          >
            Reset All Filters
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Trigger Button ── */}
      <div className="lg:hidden flex items-center justify-between pb-3">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:border-indigo-400 transition-all"
        >
          <FunnelIcon className="w-4 h-4 text-indigo-600" />
          <span>Filters & Sort</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ── Mobile Drawer ── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Filter & Sort Products"
        position="right"
      >
        <div className="p-5">
          <FilterBody />
        </div>
      </Drawer>

      {/* ── Desktop Sticky Sidebar ── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 p-5 sticky top-24 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Filters
            </h3>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <FilterBody />
      </div>
    </>
  );
};

export default ProductFilter;