const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { validationSchemas, validate } = require('../middlewares/validation');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  refreshToken
} = require('../controllers/authController');

//Public routes
router.post(
  '/register',
  validationSchemas.register,
  validate,
  register
);


router.post(
  '/login',
  validationSchemas.login,
  validate,
  login
);

router.post('/refresh', refreshToken);

// Protected routes
router.get('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/update', authenticate, updateDetails);
router.put('/update-password', authenticate, updatePassword);

module.exports = router;
