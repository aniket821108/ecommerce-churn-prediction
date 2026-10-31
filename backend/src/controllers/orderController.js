const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const invoiceService = require('../services/invoiceService');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes
  } = req.body;
  
  if (!items || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }
  
  let subtotal = 0;
  const orderItems = [];
  const decrementedProducts = [];

  try {
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        throw new AppError('Item quantity must be a positive number', 400);
      }

      // Atomic conditional decrement: prevents race condition overselling
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        const existing = await Product.findById(item.product);
        if (!existing) throw new AppError(`Product not found: ${item.product}`, 404);
        if (!existing.isActive) throw new AppError(`Product is no longer available: ${existing.name}`, 400);
        throw new AppError(`Insufficient stock for: ${existing.name}. Available: ${existing.stock}`, 400);
      }

      decrementedProducts.push({ productId: product._id, quantity });

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.length > 0 ? product.images[0].url : null,
        sku: product.sku
      });
    }

    const tax = subtotal * 0.18; // 18% GST (India)
    const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    const discount = 0;
    const total = subtotal + tax + shippingCost - discount;

    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
        amount: total,
        status: 'pending'
      },
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { items: [] }
    );

    logger.info(`Order created: ${order.orderNumber}`, { 
      orderId: order._id,
      userId: req.userId,
      total: order.total 
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    // Compensating rollback for all decremented products
    for (const dec of decrementedProducts) {
      await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.quantity } });
    }
    return next(error);
  }
});

// @desc    Create order from cart
// @route   POST /api/orders/from-cart
// @access  Private
exports.createOrderFromCart = catchAsync(async (req, res, next) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  
  const cart = await Cart.findOne({ user: req.userId })
    .populate('items.product', 'name price images stock isActive sku');
  
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }
  
  const orderItems = [];
  let subtotal = 0;
  const decrementedProducts = [];

  try {
    for (const cartItem of cart.items) {
      const productDoc = cartItem.product;
      const quantity = Number(cartItem.quantity);
      if (!productDoc || !quantity || quantity <= 0) continue;

      // Atomic conditional decrement: prevents race condition overselling
      const product = await Product.findOneAndUpdate(
        { _id: productDoc._id, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        throw new AppError(`Insufficient stock or item no longer available: ${productDoc.name}`, 400);
      }

      decrementedProducts.push({ productId: product._id, quantity });

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.length > 0 ? product.images[0].url : null,
        sku: product.sku
      });
    }

    if (orderItems.length === 0) {
      throw new AppError('No valid items found in cart to checkout', 400);
    }

    const tax = subtotal * 0.18;
    const shippingCost = subtotal > 1000 ? 0 : 50;
    const discount = cart.discountAmount || 0;
    const total = subtotal + tax + shippingCost - discount;

    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
        amount: total,
        status: 'pending'
      },
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    cart.items = [];
    cart.coupon = null;
    cart.discountAmount = 0;
    await cart.save();

    logger.info(`Order created from cart: ${order.orderNumber}`, { 
      orderId: order._id,
      userId: req.userId 
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    // Compensating rollback for all decremented products
    for (const dec of decrementedProducts) {
      await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.quantity } });
    }
    return next(error);
  }
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const {
    status,
    paymentStatus,
    startDate,
    endDate,
    search,
    sort = '-createdAt'
  } = req.query;
  
  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (paymentStatus) query['payment.status'] = paymentStatus;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.city': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
    ];
  }
  
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    orders
  });
});

/* =========================================
   ✅ THIS IS THE MISSING FUNCTION
========================================= */
// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = catchAsync(async (req, res, next) => {
  // Find orders where 'user' field matches the logged-in user's ID
  const orders = await Order.find({ user: req.userId })
    .sort('-createdAt'); // Newest first

  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check if user is authorized to view this order (owner or admin)
  const orderOwnerId = (order.user?._id || order.user)?.toString();
  const currentUserId = (req.userId?._id || req.userId)?.toString();

  if (req.user?.role !== 'admin' && req.userRole !== 'admin' && orderOwnerId !== currentUserId) {
    return next(new AppError('Not authorized to view this order', 403));
  }
  
  res.status(200).json({
    success: true,
    order
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, trackingNumber, courier, notes } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Validate status transition
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };
  
  if (!validTransitions[order.status]?.includes(status)) {
    return next(new AppError(`Invalid status transition from ${order.status} to ${status}`, 400));
  }
  
  // Update order
  order.status = status;
  
  if (status === 'shipped') {
    order.trackingNumber = trackingNumber;
    order.courier = courier;
    order.shippedAt = new Date();
  } else if (status === 'delivered') {
    order.deliveredAt = new Date();
  } else if (status === 'cancelled') {
    order.cancelledAt = new Date();
    order.cancellationReason = notes;
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
  }
  
  if (notes) order.notes = notes;
  
  await order.save();
  
  logger.info(`Order status updated: ${order.orderNumber}`, { 
    orderId: order._id,
    adminId: req.userId,
    oldStatus: order.status,
    newStatus: status 
  });
  
  await AdminLog.logAction(
    req.userId,
    'update',
    'order',
    order._id,
    { orderNumber: order.orderNumber, status, trackingNumber, courier },
    req.ip,
    req.headers['user-agent']
  );
  
  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    order
  });
});

// @desc    Update payment status (Admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentStatus, transactionId } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  order.payment.status = paymentStatus;
  if (transactionId) order.payment.transactionId = transactionId;
  
  if (paymentStatus === 'completed') {
    order.payment.paidAt = new Date();
  }
  
  await order.save();
  
  logger.info(`Payment status updated for order: ${order.orderNumber}`, { 
    orderId: order._id,
    adminId: req.userId,
    paymentStatus 
  });
  
  res.status(200).json({
    success: true,
    message: 'Payment status updated successfully',
    order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.userId
  });
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  // Check if order can be cancelled
  if (!['pending', 'processing'].includes(order.status)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }
  
  // Update order
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;
  
  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }
  
  await order.save();
  
  logger.info(`Order cancelled by user: ${order.orderNumber}`, { 
    orderId: order._id,
    userId: req.userId,
    reason 
  });
  
  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    order
  });
});

// @desc    Get sales analytics
// @route   GET /api/orders/analytics/sales
// @access  Private/Admin
exports.getSalesAnalytics = catchAsync(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  let groupFormat;
  let dateFilter = {};
  
  if (startDate || endDate) {
    dateFilter = { createdAt: {} };
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
  }
  
  switch (period) {
    case 'day':
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      break;
    case 'week':
      groupFormat = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
      break;
    case 'month':
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      break;
    case 'year':
      groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
      break;
  }
  
  const salesData = await Order.aggregate([
    { $match: { ...dateFilter, status: 'delivered' } },
    {
      $group: {
        _id: groupFormat,
        totalSales: { $sum: '$total' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Get top selling products
  const topProducts = await Order.aggregate([
    { $match: { ...dateFilter, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);
  
  // Get sales by category
  const salesByCategory = await Order.aggregate([
    { $match: { ...dateFilter, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalQuantity: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalSales: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    period,
    salesData,
    topProducts,
    salesByCategory
  });
});


// @desc    Download Official GST Tax Invoice (PDF)
// @route   GET /api/orders/:id/invoice
// @access  Private (Order Owner or Admin)
exports.downloadInvoice = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new AppError('Order not found', 404));

  // Access control: Order owner or Administrator
  const isOwner = order.user && (
    (order.user._id && order.user._id.toString() === req.userId?.toString()) ||
    order.user.toString() === req.userId?.toString()
  );
  const isAdmin = req.userRole === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to download this invoice.', 403));
  }

  // Set HTTP attachment headers for PDF download
  const filename = `Invoice-${order.orderNumber || order._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await invoiceService.generateInvoice(order, res);
});
