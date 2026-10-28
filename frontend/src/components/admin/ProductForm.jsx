import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { XMarkIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const categories = [
  'electronics',
  'clothing',
  'home',
  'books',
  'beauty',
  'sports',
  'other',
];

const ProductFormModal = ({ onClose, productToEdit }) => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
  const [existingImages] = useState(productToEdit?.images || []);
  const [formData, setFormData] = useState({
    name: productToEdit?.name || '',
    description: productToEdit?.description || '',
    price: productToEdit?.price || '',
    compareAtPrice: productToEdit?.compareAtPrice || '',
    stock: productToEdit?.stock !== undefined ? productToEdit.stock : '',
    category: (productToEdit?.category || '').toLowerCase(),
    brand: productToEdit?.brand || '',
    isFeatured: Boolean(productToEdit?.isFeatured),
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      productToEdit
        ? productService.updateProduct(productToEdit._id, data)
        : productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      queryClient.invalidateQueries(['featuredProducts']);
      toast.success(productToEdit ? 'Product updated successfully' : 'Product created successfully');
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      toast.error(errorData?.errors?.[0]?.message || errorData?.message || 'Operation failed');
    },
  });

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== '' && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    for (let i = 0; i < images.length; i++) {
      data.append('images', images[i]);
    }

    mutation.mutate(data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-xs"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              {productToEdit ? '✏️' : '✨'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {productToEdit ? 'Edit Product' : 'Create New Product'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {productToEdit
                  ? `Updating catalog SKU: ${productToEdit.name}`
                  : 'Add a new product to your inventory catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Featured Toggle Banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-50/70 border border-violet-100/80">
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="w-5 h-5 text-violet-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">Featured Placement</p>
                <p className="text-[11px] text-slate-500">Showcase this item on the homepage spotlight banner</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isFeatured ? 'bg-violet-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.isFeatured ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sony, Apple, Nike"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Price, Compare Price, Stock, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="999.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Original Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="1499.00 (Optional)"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Units in Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none capitalize"
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Product Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Min 10 characters</span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe specifications, features, warranty, and dimensions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none resize-y min-h-[96px]"
            />
          </div>

          {/* Images Upload & Previews */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Product Images
            </label>

            {/* Existing images when editing */}
            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">Current Saved Images:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                      <img src={img.url} alt={`Saved ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-violet-50/30 transition-all">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="product-image-upload"
              />
              <label htmlFor="product-image-upload" className="cursor-pointer flex flex-col items-center">
                <PhotoIcon className="w-8 h-8 text-violet-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  <span className="text-violet-600 hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to 5MB each (Max 5 images)</p>
                {images.length > 0 && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span>✓ {images.length} new image{images.length > 1 ? 's' : ''} selected</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </form>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-xs hover:shadow-md transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            {mutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : productToEdit ? (
              'Save Changes'
            ) : (
              'Publish Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm = ({ isOpen, onClose, productToEdit }) => {
  if (!isOpen) return null;

  return (
    <ProductFormModal
      key={productToEdit?._id || 'new'}
      onClose={onClose}
      productToEdit={productToEdit}
    />
  );
};

export default ProductForm;
