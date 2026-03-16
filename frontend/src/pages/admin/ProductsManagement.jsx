import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ProductForm from '../../components/admin/ProductForm';

// ── Shared helpers ────────────────────────────────────────
const stockStyle = (stock) => {
  if (stock === 0)   return { bg: '#200d0d', color: '#f87171', label: 'Out of stock' };
  if (stock <= 10)   return { bg: '#1f1608', color: '#fbbf24', label: `${stock} units` };
  return               { bg: '#0d2015', color: '#4ade80', label: `${stock} units` };
};

const activeStyle = (isActive) =>
  isActive
    ? { bg: '#0d2015', color: '#4ade80', label: 'Active' }
    : { bg: '#200d0d', color: '#f87171', label: 'Inactive' };

const Chip = ({ bg, color, label }) => (
  <span
    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
    style={{ background: bg, color }}
  >
    {label}
  </span>
);

const ProductsManagement = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', page],
    queryFn: () => productService.getProducts({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Product deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <ProductForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>Products</h2>
          <p className="text-sm mt-0.5" style={{ color: '#525252' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} on this page
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ background: '#7c3aed', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Product', 'Price', 'Stock', 'Category', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 text-xs font-medium uppercase tracking-widest ${i === 5 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#404040' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const s = stockStyle(product.stock);
                const a = activeStyle(product.isActive);
                return (
                  <tr
                    key={product._id}
                    style={{ borderBottom: '1px solid #161616', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          style={{ border: '1px solid #2a2a2a' }}
                        />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#e5e5e5' }}>{product.name}</p>
                          {product.sku && <p className="text-xs" style={{ color: '#404040' }}>{product.sku}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono" style={{ color: '#a3a3a3' }}>
                        ₹{(product.price || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-3.5">
                      <Chip bg={s.bg} color={s.color} label={s.label} />
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm capitalize" style={{ color: '#737373' }}>
                        {product.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Chip bg={a.bg} color={a.color} label={a.label} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#525252' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#a78bfa'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Delete this product?')) deleteMutation.mutate(product._id); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#525252' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#f87171'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
                        >
                          <TrashIcon className="h-4 w-4" />
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
              <p className="text-sm" style={{ color: '#404040' }}>No products found.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid #1a1a1a' }}>
            <span className="text-xs" style={{ color: '#525252' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}
              >
                Prev
              </button>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsManagement;
