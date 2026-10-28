const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { 
  getCart, 
  addToCart, 
  clearCart, 
  removeCartItem,
  updateCartItemQuantity // ✅ Import the new function
} = require('../controllers/cartController');

// Only standard customers (role: 'user') can maintain shopping carts
router.use(authenticate, authorize('user'));

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/item/:itemId')
  .delete(removeCartItem)
  .put(updateCartItemQuantity); // ✅ NEW: Add this line!

module.exports = router;