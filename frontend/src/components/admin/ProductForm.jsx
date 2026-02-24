import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductForm = ({ isOpen, onClose, productToEdit }) => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
  
  // ✅ ADDED: isFeatured to state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    brand: '',
    isFeatured: false 
  });

  // Populate form if editing
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        stock: productToEdit.stock || '',
        category: (productToEdit.category || '').toLowerCase(),
        brand: productToEdit.brand || '',
        // ✅ ADDED: Load existing featured status
        isFeatured: productToEdit.isFeatured || false 
      });
    } else {
      // Reset if adding new
      setFormData({
        name: '', description: '', price: '', stock: '', category: '', brand: '', isFeatured: false
      });
      setImages([]);
    }
  }, [productToEdit, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) => {
      return productToEdit 
        ? productService.updateProduct(productToEdit._id, data) 
        : productService.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      // ✅ Refresh featured products too so Home page updates immediately
      queryClient.invalidateQueries(['featuredProducts']); 
      toast.success(productToEdit ? 'Product updated!' : 'Product created!');
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Operation failed');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.description.length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      // ✅ Handle boolean values correctly for FormData
      data.append(key, formData[key]);
    });
    
    for (let i = 0; i < images.length; i++) {
      data.append('images', images[i]);
    }

    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-gray-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* ✅ NEW: Featured Checkbox */}
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <input
              type="checkbox"
              id="isFeatured"
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
            />
            <label htmlFor="isFeatured" className="font-medium text-gray-700">
              Feature this product on Home Page
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                required
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home</option>
                <option value="books">Books</option>
                <option value="beauty">Beauty</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-xs text-gray-400">(Min 10 chars)</span>
            </label>
            <textarea
              required
              rows="4"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setImages(e.target.files)}
            />
            <p className="text-xs text-gray-500 mt-1">Upload up to 5 images.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (productToEdit ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;