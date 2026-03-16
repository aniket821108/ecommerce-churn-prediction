import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const inputClass = {
  base: {
    display: 'block', width: '100%', borderRadius: '8px',
    padding: '8px 12px', fontSize: '13.5px',
    background: '#0d0d0d', border: '1px solid #2a2a2a',
    color: '#e5e5e5', outline: 'none',
    transition: 'border-color 0.15s',
  },
};

const DarkInput = ({ as: Tag = 'input', ...props }) => (
  <Tag
    {...props}
    style={inputClass.base}
    onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; }}
    onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
  />
);

const Label = ({ children }) => (
  <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: '#525252' }}>
    {children}
  </label>
);

const ProductForm = ({ isOpen, onClose, productToEdit }) => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '',
    category: '', brand: '', isFeatured: false,
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        stock: productToEdit.stock || '',
        category: (productToEdit.category || '').toLowerCase(),
        brand: productToEdit.brand || '',
        isFeatured: productToEdit.isFeatured || false,
      });
    } else {
      setFormData({ name: '', description: '', price: '', stock: '', category: '', brand: '', isFeatured: false });
      setImages([]);
    }
  }, [productToEdit, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      productToEdit ? productService.updateProduct(productToEdit._id, data) : productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      queryClient.invalidateQueries(['featuredProducts']);
      toast.success(productToEdit ? 'Product updated!' : 'Product created!');
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      toast.error(errorData?.errors?.[0]?.message || errorData?.message || 'Operation failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.description.length < 10) { toast.error('Description must be at least 10 characters'); return; }
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    for (let i = 0; i < images.length; i++) data.append('images', images[i]);
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#111111', border: '1px solid #2a2a2a', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1f1f1f' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>
              {productToEdit ? 'Edit Product' : 'New Product'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#525252' }}>
              {productToEdit ? `Editing: ${productToEdit.name}` : 'Fill in the details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: '#525252' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#e5e5e5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Featured toggle */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#0d0d0d', border: '1px solid #1e1333' }}
          >
            <div className="relative">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="sr-only"
              />
              <div
                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                className="w-9 h-5 rounded-full cursor-pointer transition-all duration-200 flex items-center px-0.5"
                style={{ background: formData.isFeatured ? '#7c3aed' : '#2a2a2a' }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: formData.isFeatured ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </div>
            </div>
            <label htmlFor="isFeatured" className="text-sm cursor-pointer" style={{ color: '#a3a3a3' }}>
              Feature on Home Page
            </label>
            {formData.isFeatured && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e1333', color: '#a78bfa' }}>
                Featured
              </span>
            )}
          </div>

          {/* Name + Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <DarkInput type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Brand</Label>
              <DarkInput type="text" value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            </div>
          </div>

          {/* Price + Stock + Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Price (₹) *</Label>
              <DarkInput type="number" required min="0" step="0.01" value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div>
              <Label>Stock *</Label>
              <DarkInput type="number" required min="0" value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
            </div>
            <div>
              <Label>Category *</Label>
              <DarkInput as="select" required value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="" style={{ background: '#0d0d0d' }}>Select…</option>
                {['electronics','clothing','home','books','beauty','sports','other'].map(c => (
                  <option key={c} value={c} style={{ background: '#0d0d0d', textTransform: 'capitalize' }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </DarkInput>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description <span style={{ color: '#404040', textTransform: 'none', letterSpacing: 0 }}>(min 10 chars)</span></Label>
            <DarkInput as="textarea" required rows={4} value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputClass.base, resize: 'vertical', minHeight: '96px' }}
            />
          </div>

          {/* Images */}
          <div>
            <Label>Product Images</Label>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: '#0d0d0d', border: '1px dashed #2a2a2a' }}
            >
              <input
                type="file" multiple accept="image/*"
                onChange={(e) => setImages(e.target.files)}
                className="hidden" id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-sm" style={{ color: '#525252' }}>
                  <span style={{ color: '#a78bfa' }}>Click to upload</span> · Up to 5 images
                </p>
                {images.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#4ade80' }}>
                    {images.length} file{images.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #1f1f1f' }}
        >
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: '#7c3aed', color: '#fff' }}
            onMouseEnter={e => { if (!mutation.isPending) e.currentTarget.style.background = '#6d28d9'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
          >
            {mutation.isPending ? 'Saving…' : productToEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
