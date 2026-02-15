import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { productService } from '../services/productService';
import useCartStore from '../store/cartStore';
import Loader from '../components/common/Loader';

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
  });

  const product = data?.data?.product;

  if (isLoading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">Product not found</div>;
  if (!product) return null;

  const handleAddToCart = async () => {
    await addItem(product._id, quantity);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="mb-4">
            <img
              src={product.images?.[selectedImage]?.url || '/placeholder.png'}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex space-x-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`border-2 rounded-lg overflow-hidden ${
                    selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt={product.name} className="w-20 h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center mb-4">
            <span className="text-2xl font-bold text-blue-600">₹{product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="ml-2 text-lg text-gray-500 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>

          <div className="mb-6">
            <p className="text-gray-700">{product.description}</p>
          </div>

          {product.specifications?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2">
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex">
                    <dt className="text-gray-600 w-24">{spec.key}:</dt>
                    <dd className="font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2 border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Add to Cart
            </button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Category: <span className="font-medium">{product.category}</span>
            </p>
            {product.brand && (
              <p className="text-sm text-gray-600">
                Brand: <span className="font-medium">{product.brand}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Availability:{' '}
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;