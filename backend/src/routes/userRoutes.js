const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ Import Multer
const { authenticate, authorize } = require('../middlewares/auth');
// Import validateFile to check image type/size (if you have it from previous steps)
const { validateFile } = require('../middlewares/validation'); 

const {
  getUserProfile,
  updateUserProfile,
  getUserOrders,
  getUserOrder,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// ==========================================
// ✅ 1. CONFIGURE MULTER (File Upload)
// ==========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save temp file to 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, `user-${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});

// Filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// ==========================================
// 2. USER PROFILE ROUTES
// ==========================================

router.get('/profile', authenticate, getUserProfile);

// ✅ FIXED: Add 'upload.single' middleware to handle the image
// 'avatar' matches the formData.append('avatar', file) in your Frontend
router.put(
  '/profile', 
  authenticate, 
  upload.single('avatar'), 
  validateFile, // Optional: if you want extra validation
  updateUserProfile
);

// ==========================================
// 3. USER ORDER ROUTES
// ==========================================
router.get('/orders', authenticate, getUserOrders);
router.get('/orders/:id', authenticate, getUserOrder);

// ==========================================
// 4. ADMIN USER MANAGEMENT ROUTES
// ==========================================
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/stats/overview', authenticate, authorize('admin'), getUserStats);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;