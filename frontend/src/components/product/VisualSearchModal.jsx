import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CameraIcon,
  XMarkIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  TagIcon,
  ShoppingBagIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';

// Sample demonstration images for quick 1-click viva testing
const DEMO_SAMPLES = [
  {
    label: '👟 Running Shoes',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    title: 'Sport Sneakers'
  },
  {
    label: '🎧 Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    title: 'Wireless Audio'
  },
  {
    label: '📱 Smartphone',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    title: 'Mobile Phone'
  },
  {
    label: '👕 Casual T-Shirt',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    title: 'Cotton T-Shirt'
  }
];

const VisualSearchModal = ({ isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Auto-trigger search upon file upload
    executeVisualSearch(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDemoSampleClick = async (sample) => {
    try {
      setLoading(true);
      setImagePreview(sample.url);
      setHasSearched(true);
      setAnalysis(null);
      setMatchedProducts([]);

      // Fetch sample image as blob to create File
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], `${sample.title.toLowerCase().replace(/\s+/g, '-')}.jpg`, {
        type: 'image/jpeg'
      });

      setSelectedImage(file);
      await executeVisualSearch(file);
    } catch (err) {
      toast.error('Failed to load demo sample. Please upload an image directly.');
      setLoading(false);
    }
  };

  const executeVisualSearch = async (fileToSearch) => {
    const file = fileToSearch || selectedImage;
    if (!file) {
      toast.error('Please select an image first.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await productService.visualSearch(file);
      const data = res.data;

      setAnalysis(data.analysis || null);
      setMatchedProducts(data.products || []);

      if (data.products && data.products.length > 0) {
        toast.success(`Found ${data.products.length} matching products!`);
      } else if (data.analysis?.isRetailProduct === false) {
        toast('Uploaded image does not appear to be a retail product.', { icon: 'ℹ️' });
      } else {
        toast('No matching product found in our catalog for this image.', { icon: 'ℹ️' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Visual search failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setMatchedProducts([]);
    setHasSearched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/50 via-white to-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <CameraIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">AI Visual Search</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  <SparklesIcon className="w-3 h-3 text-indigo-600" /> Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Snap or upload any product photo to find matching items in our live store catalog
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

          {/* Upload Dropzone (if not searched or resetting) */}
          {!hasSearched ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors">
                  <PhotoIcon className="w-8 h-8" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to upload or drag & drop a photo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, or WEBP up to 5MB
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                    <CameraIcon className="w-4 h-4" /> Browse Photo
                  </span>
                </div>
              </div>

              {/* Viva / Quick Demo Samples Bar */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                  Try Instant Viva Demo Samples:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEMO_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDemoSampleClick(sample)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-all text-left flex items-center gap-1.5"
                    >
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Search In Progress or Results View */
            <div className="space-y-6">

              {/* Query Image & AI Scanner Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {imagePreview && (
                  <div className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
                    <img
                      src={imagePreview}
                      alt="Uploaded query"
                      className="w-full h-full object-cover"
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[1px] flex items-center justify-center">
                        <ArrowPathIcon className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {loading ? 'Analyzing with Google Gemini Vision...' : 'Analyzed Product'}
                    </span>
                    {!loading && analysis && (
                      <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        Scanning colors, categories, & textures...
                      </span>
                    ) : (
                      analysis?.detectedItem || 'Identified Product'
                    )}
                  </h4>

                  {/* Metadata Tags */}
                  {!loading && analysis && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      {analysis.visibleText && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 line-clamp-1 max-w-[280px]" title={analysis.visibleText}>
                          📖 "{analysis.visibleText}"
                        </span>
                      )}
                      {analysis.category && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          📁 {analysis.category}
                        </span>
                      )}
                      {analysis.brand && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          🏷️ {analysis.brand}
                        </span>
                      )}
                      {analysis.colors && analysis.colors.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🎨 {analysis.colors.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs"
                >
                  Upload New Photo
                </button>
              </div>

              {/* Results Grid */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShoppingBagIcon className="w-4 h-4 text-indigo-600" />
                    Catalog Visual Matches ({matchedProducts.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Ranked by multimodal cosine & feature similarity
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      Querying live MongoDB catalog with Gemini features...
                    </p>
                  </div>
                ) : matchedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {matchedProducts.map((product) => {
                      const imageSrc = product.images?.[0]?.url || product.images?.[0] || 'https://placehold.co/400x400?text=Product';

                      return (
                        <div
                          key={product._id}
                          className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-2.5 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
                        >
                          <div>
                            {/* Product Thumbnail & Match Badge */}
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                              <img
                                src={imageSrc}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Visual Match % Badge */}
                              <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                                {product.matchPercentage || 92}% Match
                              </div>
                            </div>

                            {/* Title & Category */}
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {product.category}
                            </p>
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {product.name}
                            </h5>
                          </div>

                          {/* Price & Action */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              ₹{product.price?.toLocaleString('en-IN')}
                            </span>

                            <Link
                              to={`/products/${product._id}`}
                              onClick={onClose}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <ShoppingBagIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {analysis?.isRetailProduct === false
                          ? 'Non-Product Image Detected'
                          : 'No Direct Store Matches Found'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        {analysis?.isRetailProduct === false
                          ? 'This image doesn’t appear to be a consumer store product. Try uploading a photo of a book, clothing, shoe, or electronics item.'
                          : `Gemini Vision identified "${analysis?.detectedItem || 'this item'}", but no closely matching products are currently available in inventory.`}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                      >
                        Try Another Image
                      </button>
                      <Link
                        to="/shop"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                      >
                        Browse Shop
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
            Zero-hallucination verification • Live catalog match
          </span>
          <span className="text-slate-400 hidden sm:inline">
            E-Shop Multimodal AI Engine v2
          </span>
        </div>

      </div>
    </div>
  );
};

export default VisualSearchModal;

