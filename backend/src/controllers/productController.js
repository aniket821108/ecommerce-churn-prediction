const Product = require('../models/Product');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

// Helper function for pagination
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build query
  let query = Product.find({ isActive: true });
  
  if (req.query.category) query = query.where('category').equals(req.query.category);
  
  if (req.query.minPrice || req.query.maxPrice) {
    const priceFilter = {};
    if (req.query.minPrice) priceFilter.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = parseFloat(req.query.maxPrice);
    query = query.where('price').gte(priceFilter);
  }
  
  if (req.query.brand) query = query.where('brand').equals(req.query.brand);
  
  if (req.query.search) query = query.find({ $text: { $search: req.query.search } });
  
  if (req.query.featured === 'true') query = query.where('isFeatured').equals(true);
  
  const sort = req.query.sort || '-createdAt';
  query = query.sort(sort);
  
  const [products, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    Product.countDocuments(query.getFilter())
  ]);
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    products
  });
});

// @desc    Get single product
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  res.status(200).json({ success: true, product });
});

// @desc    Get products by category
exports.getProductsByCategory = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const products = await Product.find({ category: req.params.category, isActive: true }).limit(limit);
  res.status(200).json({ success: true, count: products.length, products });
});

// @desc    Get featured products
exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await Product.find({ isActive: true, isFeatured: true }).limit(limit);
  res.status(200).json({ success: true, count: products.length, products });
});

// ==========================================
// ✅ FIXED: CREATE PRODUCT (Parses Numbers)
// ==========================================
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    category,
    stock,
    brand,
    specifications,
    tags
  } = req.body;
  
  // Handle images
  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await uploadToCloudinary(file.path, 'products');
      images.push({
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        alt: name,
        isPrimary: images.length === 0
      });
    }
  }
  
  const sku = `PROD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  const product = await Product.create({
    name,
    description,
    shortDescription: req.body.shortDescription || description.substring(0, 150) + '...',
    // ✅ FIX: Explicitly convert String to Number
    price: Number(price), 
    stock: Number(stock), 
    category,
    brand,
    sku,
    images,
    specifications: specifications || [],
    tags: tags || [],
    isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
    compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : undefined,
    weight: req.body.weight ? Number(req.body.weight) : undefined,
    dimensions: req.body.dimensions
  });
  
  logger.info(`Product created: ${product.name}`, { productId: product._id, adminId: req.userId });
  
  res.status(201).json({ success: true, message: 'Product created successfully', product });
});

// ==========================================
// ✅ FIXED: UPDATE PRODUCT (Parses Numbers)
// ==========================================
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  
  // Handle images
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await uploadToCloudinary(file.path, 'products');
      product.images.push({
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        alt: req.body.name || product.name,
        isPrimary: product.images.length === 0
      });
    }
  }
  
  // Update fields with Type Safety
  if (req.body.name) product.name = req.body.name;
  if (req.body.description) product.description = req.body.description;
  if (req.body.price) product.price = Number(req.body.price); // ✅ FIX
  if (req.body.stock) product.stock = Number(req.body.stock); // ✅ FIX
  if (req.body.category) product.category = req.body.category;
  if (req.body.brand) product.brand = req.body.brand;
  
  // Handle Booleans
  if (req.body.isFeatured !== undefined) {
      product.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
  }

  await product.save();
  
  logger.info(`Product updated: ${product.name}`, { productId: product._id, adminId: req.userId });
  
  res.status(200).json({ success: true, message: 'Product updated successfully', product });
});

// @desc    Delete product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      if (image.publicId) await deleteFromCloudinary(image.publicId);
    }
  }
  
  product.isActive = false; // Soft delete
  await product.save();
  
  logger.info(`Product deleted: ${product.name}`, { productId: product._id, adminId: req.userId });
  
  res.status(200).json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Upload product images
exports.uploadProductImages = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  
  if (!req.files || req.files.length === 0) return next(new AppError('Please upload at least one image', 400));
  
  const uploadedImages = [];
  for (const file of req.files) {
    const uploadResult = await uploadToCloudinary(file.path, 'products');
    uploadedImages.push({
      url: uploadResult.url,
      publicId: uploadResult.public_id,
      alt: req.body.alt || product.name,
      isPrimary: product.images.length === 0
    });
  }
  
  product.images.push(...uploadedImages);
  await product.save();
  
  res.status(200).json({ success: true, message: 'Images uploaded successfully', images: uploadedImages });
});

// @desc    Delete product image
exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  
  const imageIndex = product.images.findIndex(img => img._id.toString() === req.params.imageId);
  if (imageIndex === -1) return next(new AppError('Image not found', 404));
  
  const image = product.images[imageIndex];
  if (image.publicId) await deleteFromCloudinary(image.publicId);
  
  product.images.splice(imageIndex, 1);
  if (image.isPrimary && product.images.length > 0) product.images[0].isPrimary = true;
  
  await product.save();
  
  res.status(200).json({ success: true, message: 'Image deleted successfully' });
});

// @desc    Search products
exports.searchProducts = catchAsync(async (req, res) => {
  const { q } = req.query;
  const products = await Product.find({ $text: { $search: q }, isActive: true });
  res.status(200).json({ success: true, count: products.length, products });
});