const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middlewares/auth');

// 1. IMPORT validationSchemas HERE (This is critical!)
const { validate, validateFile, validationSchemas } = require('../middlewares/validation');

const {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  searchProducts
} = require('../controllers/productController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.'));
    }
  }
});

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProduct);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  validateFile,
  // 2. FIXED: Split into schema AND validate function
  validationSchemas.createProduct, 
  validate,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  validateFile,
  // 3. FIXED: Split into schema AND validate function
  validationSchemas.updateProduct,
  validate,
  updateProduct
);

router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

// Image routes
router.post(
  '/:id/images',
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  validateFile,
  uploadProductImages
);

router.delete(
  '/:id/images/:imageId',
  authenticate,
  authorize('admin'),
  deleteProductImage
);

module.exports = router;