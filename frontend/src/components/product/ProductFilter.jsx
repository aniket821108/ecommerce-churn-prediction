import { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';

const ProductFilter = ({ filters, setFilters, setPage }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setPage(1);
  };

  const clearFilters = () => {
    const empty = {};
    setLocalFilters(empty);
    setFilters(empty);
    setPage(1);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Filters</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={localFilters.category || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={localFilters.minPrice || ''}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={localFilters.maxPrice || ''}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input
            type="text"
            name="brand"
            placeholder="Enter brand"
            value={localFilters.brand || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            name="sort"
            value={localFilters.sort || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Default</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-createdAt">Newest</option>
            <option value="-ratings.average">Top Rated</option>
          </select>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={applyFilters}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;