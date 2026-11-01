const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
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
  searchProducts,
  handleVisualSearch
} = require('../controllers/productController');

// Configure multer for file upload
const path = require('path');
const fsExtra = require('fs');
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fsExtra.existsSync(uploadDir)) { fsExtra.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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

// Configure in-memory multer for AI visual search (zero disk write)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP images are allowed.'));
    }
  }
});

// Dedicated rate limiter for AI visual search to prevent Gemini Vision quota starvation and DoS
const visualSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 visual search requests per 15 minutes per IP
  message: {
    success: false,
    message: 'Visual search limit exceeded. Please wait 15 minutes before submitting more images.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.post('/visual-search', visualSearchLimiter, memoryUpload.single('image'), handleVisualSearch);
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