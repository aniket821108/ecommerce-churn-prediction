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
  
  // Filter by category
  if (req.query.category) {
    query = query.where('category').equals(req.query.category);
  }
  
  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    const priceFilter = {};
    if (req.query.minPrice) priceFilter.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.$lte = parseFloat(req.query.maxPrice);
    query = query.where('price').gte(priceFilter);
  }
  
  // Filter by brand
  if (req.query.brand) {
    query = query.where('brand').equals(req.query.brand);
  }
  
  // Search
  if (req.query.search) {
    query = query.find({ $text: { $search: req.query.search } });
  }
  
  // Filter by featured
  if (req.query.featured === 'true') {
    query = query.where('isFeatured').equals(true);
  }
  
  // Sort
  const sort = req.query.sort || '-createdAt';
  query = query.sort(sort);
  
  // Execute query with pagination
  const [products, total] = await Promise.all([
    query.skip(skip).limit(limit).lean(),
    Product.countDocuments(query.getFilter())
  ]);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: {
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    },
    products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Increment view count (you can add this field to schema)
  // product.views = (product.views || 0) + 1;
  // await product.save();
  
  res.status(200).json({
    success: true,
    product
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  
  const products = await Product.find({ 
    category, 
    isActive: true 
  }).limit(limit);
  
  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.getFeaturedProducts(limit);
  
  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
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
  
  // Handle images if uploaded
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
  
  // Generate SKU
  const sku = `PROD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  const product = await Product.create({
    name,
    description,
    shortDescription: req.body.shortDescription || description.substring(0, 150) + '...',
    price,
    category,
    stock,
    brand,
    sku,
    images,
    specifications: specifications || [],
    tags: tags || [],
    isFeatured: req.body.isFeatured || false,
    compareAtPrice: req.body.compareAtPrice,
    weight: req.body.weight,
    dimensions: req.body.dimensions
  });
  
  logger.info(`Product created: ${product.name}`, { 
    productId: product._id,
    adminId: req.userId 
  });
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Handle image updates if any
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
  
  // Update fields
  const updatableFields = [
    'name', 'description', 'shortDescription', 'price', 'category',
    'stock', 'brand', 'specifications', 'tags', 'isFeatured',
    'compareAtPrice', 'weight', 'dimensions'
  ];
  
  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });
  
  await product.save();
  
  logger.info(`Product updated: ${product.name}`, { 
    productId: product._id,
    adminId: req.userId 
  });
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }
    }
  }
  
  // Soft delete (set isActive to false)
  product.isActive = false;
  await product.save();
  
  // Or hard delete
  // await product.deleteOne();
  
  logger.info(`Product deleted: ${product.name}`, { 
    productId: product._id,
    adminId: req.userId 
  });
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
exports.uploadProductImages = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image', 400));
  }
  
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
  
  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    images: uploadedImages
  });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  const imageIndex = product.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );
  
  if (imageIndex === -1) {
    return next(new AppError('Image not found', 404));
  }
  
  const image = product.images[imageIndex];
  
  // Delete from Cloudinary
  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }
  
  // Remove from array
  product.images.splice(imageIndex, 1);
  
  // If we removed the primary image and there are other images, set first as primary
  if (image.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = catchAsync(async (req, res) => {
  const { q, category, minPrice, maxPrice, sort = '-createdAt' } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { isActive: true };
  
  // Text search
  if (q) {
    query.$text = { $search: q };
  }
  
  // Category filter
  if (category) {
    query.category = category;
  }
  
  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    products
  });
});