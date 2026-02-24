import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import Loader from '../../components/common/Loader';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// ✅ IMPORT THE NEW FORM COMPONENT
import ProductForm from '../../components/admin/ProductForm';

const ProductsManagement = () => {
  const [page, setPage] = useState(1);
  // ✅ ADD STATE FOR MODAL AND EDITING
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
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const products = data?.data?.products || [];

  // ✅ HANDLER TO OPEN MODAL FOR NEW PRODUCT
  const handleAddProduct = () => {
    setEditingProduct(null); // Clear any previous edit data
    setIsModalOpen(true);
  };

  // ✅ HANDLER TO OPEN MODAL FOR EDITING
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      {/* ✅ RENDER THE MODAL */}
      <ProductForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        productToEdit={editingProduct}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Products Management</h2>
        
        {/* ✅ BUTTON NOW WORKS */}
        <button 
          onClick={handleAddProduct}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        src={product.images?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">₹{product.price}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.stock > 10 ? 'bg-green-100 text-green-800' :
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* ✅ EDIT BUTTON NOW WORKS */}
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this product?')) {
                        deleteMutation.mutate(product._id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsManagement;