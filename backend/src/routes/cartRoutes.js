const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { 
  getCart, 
  addToCart, 
  clearCart, 
  removeCartItem,
  updateCartItemQuantity // ✅ Import the new function
} = require('../controllers/cartController');

router.use(authenticate);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/item/:itemId')
  .delete(removeCartItem)
  .put(updateCartItemQuantity); // ✅ NEW: Add this line!

module.exports = router;