import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProductForm from '../../components/admin/ProductForm';

const categories = [
  'electronics',
  'clothing',
  'home',
  'books',
  'beauty',
  'sports',
  'other',
];

const ProductsManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [brokenImageIds, setBrokenImageIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', page, search, categoryFilter],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Product removed from catalog');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete product'),
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};

  const handleImageError = (productId) => {
    setBrokenImageIds((prev) => new Set(prev).add(productId));
  };

  if (isLoading && !data) return <Loader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <ProductForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />

      {/* ── Page Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage your store's products, pricing, stock levels, and promotional spotlights.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-xs hover:shadow-md transition-all active:scale-95 min-h-[42px]"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          <PlusIcon className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or brand..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TagIcon className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none capitalize min-h-[40px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Modern Table Card ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Product Info</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Price</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Inventory</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Category</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Visibility</th>
                <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products.map((product) => {
                const stock = product.stock ?? 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 10;
                const imgUrl = product.images?.[0]?.url;
                const hasImg = imgUrl && !brokenImageIds.has(product._id);

                return (
                  <tr
                    key={product._id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* Product */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-xs bg-slate-50 overflow-hidden">
                          {hasImg ? (
                            <img
                              src={imgUrl}
                              alt={product.name}
                              onError={() => handleImageError(product._id)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <PhotoIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[180px] sm:max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 truncate">{product.name}</p>
                            {product.isFeatured && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-violet-50 text-violet-700 border border-violet-200/80 text-[10px] font-bold">
                                <SparklesIcon className="w-2.5 h-2.5" />
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                            {product.brand ? `Brand: ${product.brand}` : 'No brand specified'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-900 font-mono">
                          ₹{(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Low: {stock} units
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {stock} in stock
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                        {product.category || 'General'}
                      </span>
                    </td>

                    {/* Visibility */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {product.isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live on Store
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                              deleteMutation.mutate(product._id);
                            }
                          }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="py-16 text-center">
              <TagIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No products match your criteria</p>
              <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search query</p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs min-h-[36px]"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs min-h-[36px]"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsManagement;
