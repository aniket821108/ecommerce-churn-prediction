const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { catchAsync, AppError } = require('../middlewares/errorHandler');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.userId })
    .populate('items.product', 'name price images stock isActive');

  if (!cart) {
    // If no cart exists, create an empty one locally to return
    cart = { items: [] };
  }

  // Calculate totals dynamically
  let subtotal = 0;
  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(item => {
      if (item.product) {
        subtotal += item.product.price * item.quantity;
      }
    });
  }

  res.status(200).json({
    success: true,
    count: cart.items ? cart.items.length : 0,
    subtotal,
    cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  // 1. Check if product exists and has stock
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (product.stock < quantity) {
    return next(new AppError(`Insufficient stock. Only ${product.stock} left.`, 400));
  }

  // 2. Find user's cart or create new one
  let cart = await Cart.findOne({ user: req.userId });

  if (!cart) {
    cart = await Cart.create({
      user: req.userId,
      items: []
    });
  }

  // 3. Check if item already in cart
  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (itemIndex > -1) {
    // Product exists in cart, update quantity
    cart.items[itemIndex].quantity += quantity;
    // Optional: Update price to current product price
    cart.items[itemIndex].price = product.price; 
  } else {
    // Product not in cart, push new item WITH PRICE
    cart.items.push({
      product: productId,
      quantity: quantity,
      price: product.price // ✅ FIXED: Added price here
    });
  }

  await cart.save();
  
  // Return the updated cart
  // We populate specifically to show nice details in the response
  const populatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images');

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    cart: populatedCart
  });
});
// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:itemId
// @access  Private
exports.updateCartItemQuantity = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;
  if (quantity < 1) return next(new AppError('Quantity must be at least 1', 400));

  const cart = await Cart.findOne({ user: req.userId });
  if (!cart) return next(new AppError('Cart not found', 404));

  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === req.params.itemId || item._id.toString() === req.params.itemId
  );

  if (itemIndex === -1) return next(new AppError('Item not found', 404));

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images');

  // ✅ NEW: Recalculate Subtotal
  let subtotal = 0;
  populatedCart.items.forEach(item => {
    if (item.product) {
      subtotal += item.quantity * item.product.price;
    }
  });

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    cart: populatedCart,
    subtotal // ✅ Send this back to frontend
  });
});
// @desc    Remove single item from cart
// @route   DELETE /api/cart/item/:itemId
// @access  Private
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.userId });

  if (!cart) return next(new AppError('Cart not found', 404));

  cart.items = cart.items.filter(item => 
    item.product.toString() !== req.params.itemId && 
    item._id.toString() !== req.params.itemId
  );

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images');

  // ✅ NEW: Recalculate Subtotal
  let subtotal = 0;
  populatedCart.items.forEach(item => {
    if (item.product) {
      subtotal += item.quantity * item.product.price;
    }
  });

  res.status(200).json({
    success: true,
    message: 'Item removed',
    cart: populatedCart,
    subtotal // ✅ Send this back to frontend
  });
});
// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.userId });

  if (cart) {
    cart.items = [];
    cart.subtotal = 0;
    cart.total = 0; // If you have a total field
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    cart: { items: [], subtotal: 0 }
  });
});