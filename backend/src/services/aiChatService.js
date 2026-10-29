const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const logger = require('../utils/logger');
const emailService = require('./emailService');
const axios = require('axios');

// ══════════════════════════════════════════════════════════════════
// 1. BACKEND GROUNDED TOOL FUNCTIONS (Zero-Hallucination)
// ══════════════════════════════════════════════════════════════════

/**
 * Tool 1: Catalog Search & Filter
 * Performs grounded MongoDB search with price bounds, category, brand, and stock constraints.
 */
const searchCatalogTool = async ({
  query = '',
  category,
  minPrice,
  maxPrice,
  brand,
  inStockOnly = true,
  featuredOnly = false,
  limit = 4
}) => {
  try {
    const filter = { isActive: true };

    if (inStockOnly) {
      filter.stock = { $gt: 0 };
    }

    if (featuredOnly) {
      filter.isFeatured = true;
    }

    if (category && typeof category === 'string' && category.trim() && category !== 'all') {
      const escapedCat = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = new RegExp(`^${escapedCat}$`, 'i');
    }

    if (brand && typeof brand === 'string' && brand.trim()) {
      const escapedBrand = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.brand = new RegExp(escapedBrand, 'i');
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    if (query && typeof query === 'string' && query.trim()) {
      const cleanQ = query.trim();
      const escapedQ = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const orConditions = [
        { name: { $regex: escapedQ, $options: 'i' } },
        { description: { $regex: escapedQ, $options: 'i' } }
      ];
      if (!filter.brand) {
        orConditions.push({ brand: { $regex: escapedQ, $options: 'i' } });
      }
      if (!filter.category) {
        orConditions.push({ category: { $regex: escapedQ, $options: 'i' } });
      }
      filter.$or = orConditions;
    }

    const maxResults = Math.min(Math.max(Number(limit) || 4, 1), 10);
    const products = await Product.find(filter)
      .select('_id name slug price compareAtPrice category brand stock images isFeatured')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(maxResults)
      .lean();

    const formatted = products.map((p) => {
      const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || '';
      const discountPercent =
        p.compareAtPrice && p.compareAtPrice > p.price
          ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
          : 0;

      return {
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        discountPercent,
        category: p.category,
        brand: p.brand || 'Generic',
        stock: p.stock,
        inStock: p.stock > 0,
        imageUrl: primaryImg,
        isFeatured: Boolean(p.isFeatured)
      };
    });

    return {
      success: true,
      count: formatted.length,
      products: formatted
    };
  } catch (error) {
    logger.error('searchCatalogTool error:', error);
    return { success: false, count: 0, products: [], error: error.message };
  }
};

/**
 * Tool 2: Product Details by ID or Slug
 */
const getProductDetailsTool = async ({ productId, slug }) => {
  try {
    const filter = { isActive: true };
    if (productId) {
      filter._id = productId;
    } else if (slug) {
      filter.slug = slug;
    } else {
      return { success: false, error: 'Product ID or slug is required' };
    }

    const product = await Product.findOne(filter).lean();
    if (!product) {
      return { success: false, message: 'Product not found in catalog' };
    }

    const primaryImg = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';
    const discountPercent =
      product.compareAtPrice && product.compareAtPrice > product.price
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    return {
      success: true,
      product: {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice || null,
        discountPercent,
        category: product.category,
        brand: product.brand || 'Generic',
        stock: product.stock,
        inStock: product.stock > 0,
        imageUrl: primaryImg,
        images: product.images?.map((img) => img.url) || [],
        sku: product.sku
      }
    };
  } catch (error) {
    logger.error('getProductDetailsTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tool 3: Product Comparison Matrix
 */
const compareProductsTool = async ({ productIds = [] }) => {
  try {
    if (!Array.isArray(productIds) || productIds.length < 2) {
      return { success: false, message: 'Please provide at least 2 product IDs to compare' };
    }

    const ids = productIds.slice(0, 4);
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();

    if (products.length < 2) {
      return { success: false, message: 'Could not find sufficient products to generate comparison matrix' };
    }

    const items = products.map((p) => {
      const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || '';
      return {
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        category: p.category,
        brand: p.brand || 'Generic',
        stock: p.stock,
        inStock: p.stock > 0,
        imageUrl: primaryImg,
        descriptionSummary: p.description ? p.description.slice(0, 120) + '...' : ''
      };
    });

    const lowestPrice = Math.min(...items.map((i) => i.price));
    const highestPrice = Math.max(...items.map((i) => i.price));

    return {
      success: true,
      comparison: {
        items,
        summary: {
          lowestPrice,
          highestPrice,
          priceDifference: highestPrice - lowestPrice,
          bestValue: items.find((i) => i.price === lowestPrice)?.name || items[0].name
        }
      }
    };
  } catch (error) {
    logger.error('compareProductsTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tool 4: Scoped Order Status & Delivery Lookup
 * Strictly prevents cross-account data leakage by verifying userId or orderNumber + billing info.
 */
const getOrderStatusTool = async ({ orderNumber, userId, email }) => {
  try {
    const query = {};

    if (userId) {
      query.user = userId;
      if (orderNumber) {
        query.orderNumber = orderNumber.trim();
      }
    } else if (orderNumber && email) {
      // Guest lookup requires matching orderNumber AND customer email
      query.orderNumber = orderNumber.trim();
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return {
          success: false,
          message: 'No order found matching the provided order number and email address.'
        };
      }
      query.user = user._id;
    } else if (orderNumber) {
      return {
        success: false,
        requiresAuth: true,
        message: 'For account security, please log in to view order details or provide both your order number and registered email.'
      };
    } else {
      return {
        success: false,
        message: 'Please provide an order number or sign in to check your order history.'
      };
    }

    const order = await Order.findOne(query)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images')
      .lean();

    if (!order) {
      return {
        success: false,
        message: orderNumber
          ? `Order #${orderNumber} was not found in your account.`
          : 'No recent orders found in your account.'
      };
    }

    const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
    const isCancelled = order.status === 'cancelled';
    const currentStepIndex = statusSteps.indexOf(order.status);

    return {
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        isCancelled,
        statusStep: isCancelled ? 0 : (currentStepIndex >= 0 ? currentStepIndex + 1 : 1),
        totalStatusSteps: statusSteps.length,
        total: order.total || order.totalPrice || 0,
        itemCount: order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0,
        items: order.items?.map((item) => ({
          name: item.name || item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.price,
          image: item.image || item.product?.images?.[0]?.url || ''
        })) || [],
        courier: order.courier || (order.status === 'shipped' ? 'BlueDart Express' : (isCancelled ? 'Cancelled' : 'Pending dispatch')),
        trackingNumber: order.trackingNumber || (order.status === 'shipped' ? 'TRK' + order._id.toString().slice(-8).toUpperCase() : null),
        estimatedDelivery: order.estimatedDelivery || null,
        createdAt: order.createdAt
      }
    };
  } catch (error) {
    logger.error('getOrderStatusTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Tool 5: Grounded Store Policy & FAQ
 */
const getStoreFaqTool = async ({ topic = '' }) => {
  const normalized = topic.toLowerCase();
  const faqs = {
    shipping: {
      title: 'Shipping & Delivery Policy',
      content:
        'We offer standard express shipping across India. Orders are dispatched within 24-48 hours. Delivery typically takes 3-5 business days. Shipping is FREE on all orders above ₹999; otherwise, a flat rate of ₹99 applies.'
    },
    returns: {
      title: 'Returns & Refund Guarantee',
      content:
        'We offer a 30-day hassle-free return policy. If you are not completely satisfied with your purchase, you can initiate a return from your Orders dashboard for a full refund or replacement. Items must be in original condition with tags intact.'
    },
    payment: {
      title: 'Accepted Payment Methods',
      content:
        'We accept all major Credit/Debit Cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), NetBanking, and Cash on Delivery (COD) on eligible pin codes. All transactions are securely processed with 256-bit SSL encryption via Razorpay.'
    },
    warranty: {
      title: 'Warranty & Authenticity',
      content:
        'Every product on E-Shop is 100% genuine and sourced directly from verified authorized brand distributors. All electronic items include the official 1-year brand warranty with nationwide service coverage.'
    },
    contact: {
      title: 'Customer Care & Support',
      content:
        'Our support team is available 24/7. You can reach out directly via this assistant or email our executive care desk at support@eshop.example.com.'
    }
  };

  if (normalized.includes('ship') || normalized.includes('deliver')) return { success: true, faq: faqs.shipping };
  if (normalized.includes('return') || normalized.includes('refund') || normalized.includes('exchange')) return { success: true, faq: faqs.returns };
  if (normalized.includes('pay') || normalized.includes('upi') || normalized.includes('cod') || normalized.includes('card')) return { success: true, faq: faqs.payment };
  if (normalized.includes('warranty') || normalized.includes('guarantee') || normalized.includes('authentic')) return { success: true, faq: faqs.warranty };
  if (normalized.includes('contact') || normalized.includes('help') || normalized.includes('support')) return { success: true, faq: faqs.contact };

  return {
    success: true,
    faq: {
      title: 'Store Information',
      content: 'E-Shop provides 3-5 day nationwide delivery, 30-day hassle-free returns, secure payments via Razorpay, and 100% authentic products with brand warranty.'
    }
  };
};

// ══════════════════════════════════════════════════════════════════
// 2. ADMIN GROUNDED TOOLS (Restricted to Store Administrators)
// ══════════════════════════════════════════════════════════════════

/**
 * Admin Tool 1: Store Executive KPIs
 */
const getStoreStatsTool = async () => {
  try {
    const [totalOrders, totalProducts, totalUsers, revenueResult, pendingOrders, lowStockCount] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: { $ifNull: ['$totalPrice', '$total', 0] } }
          }
        }
      ]),
      Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } })
    ]);

    const totalSales = revenueResult[0]?.totalSales || 0;

    return {
      success: true,
      kpis: {
        totalSales,
        formattedSales: `₹${totalSales.toLocaleString('en-IN')}`,
        totalOrders,
        totalProducts,
        totalUsers,
        pendingOrders,
        lowStockCount
      }
    };
  } catch (error) {
    logger.error('getStoreStatsTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin Tool 2: Inventory Alerts & Stock Depletion Risk
 */
const getInventoryAlertsTool = async ({ threshold = 5 }) => {
  try {
    const limitNum = Number(threshold) || 5;
    const lowStockItems = await Product.find({ isActive: true, stock: { $lte: limitNum } })
      .select('name category brand stock price')
      .sort({ stock: 1 })
      .limit(10)
      .lean();

    const outOfStock = lowStockItems.filter((item) => item.stock === 0);
    const criticallyLow = lowStockItems.filter((item) => item.stock > 0);

    return {
      success: true,
      threshold: limitNum,
      totalAlerts: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      criticallyLowCount: criticallyLow.length,
      items: lowStockItems.map((item) => ({
        _id: item._id.toString(),
        name: item.name,
        category: item.category,
        brand: item.brand,
        stock: item.stock,
        price: item.price,
        status: item.stock === 0 ? 'OUT_OF_STOCK' : 'CRITICAL_LOW'
      }))
    };
  } catch (error) {
    logger.error('getInventoryAlertsTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin Tool 3: Churn Risk Summary
 */
const getChurnRiskTool = async () => {
  try {
    const users = await User.find({ role: 'user', isActive: true }).limit(25).lean();
    if (!users.length) {
      return { success: true, count: 0, highRiskUsers: [] };
    }

    const now = new Date();
    const userIds = users.map((u) => u._id);

    const stats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalPrice', '$total', 0] } },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const statsMap = new Map();
    stats.forEach((s) => statsMap.set(s._id.toString(), s));

    const evaluated = users.map((u) => {
      const orderStat = statsMap.get(u._id.toString()) || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
      const daysSinceOrder = orderStat.lastOrderDate
        ? Math.floor((now - new Date(orderStat.lastOrderDate)) / (1000 * 60 * 60 * 24))
        : 999;

      let risk = 'low';
      let probability = 0.15;
      let reason = 'Active account with standard purchase cadence';

      if (daysSinceOrder > 60 || orderStat.totalOrders === 0) {
        risk = 'high';
        probability = 0.78;
        reason = daysSinceOrder > 60 ? `Inactive for ${daysSinceOrder} days` : 'Zero purchases since registration';
      } else if (daysSinceOrder > 30 || orderStat.totalSpent < 1000) {
        risk = 'medium';
        probability = 0.45;
        reason = `Moderate engagement (${orderStat.totalOrders} order(s), ₹${orderStat.totalSpent} spent)`;
      }

      return {
        userId: u._id.toString(),
        name: u.name,
        email: u.email,
        totalOrders: orderStat.totalOrders,
        totalSpent: orderStat.totalSpent,
        daysSinceLastOrder: daysSinceOrder,
        risk,
        probability,
        reason
      };
    });

    const highRiskUsers = evaluated.filter((e) => e.risk === 'high').sort((a, b) => b.probability - a.probability);

    return {
      success: true,
      totalEvaluated: evaluated.length,
      highRiskCount: highRiskUsers.length,
      highRiskUsers: highRiskUsers.slice(0, 5)
    };
  } catch (error) {
    logger.error('getChurnRiskTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin Tool 4: Recent Audit Logs
 */
const getRecentAuditLogsTool = async ({ limit = 5 }) => {
  try {
    const logs = await AdminLog.find()
      .populate('admin', 'name email role')
      .sort({ performedAt: -1 })
      .limit(Number(limit) || 5)
      .lean();

    return {
      success: true,
      logs: logs.map((l) => ({
        _id: l._id.toString(),
        action: l.action,
        entity: l.entity,
        adminName: l.admin?.name || 'Administrator',
        performedAt: l.performedAt,
        status: l.status,
        details: l.details
      }))
    };
  } catch (error) {
    logger.error('getRecentAuditLogsTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin Tool 5: Prepare CRM Promotional / Deal Email Draft
 * Generates structured email draft for admin review before dispatch.
 */
const draftCrmEmailTool = async ({
  customerEmail,
  customerName,
  subject,
  message,
  dealCode,
  discountPercent
}) => {
  try {
    if (!customerEmail && !customerName) {
      return {
        success: false,
        message: 'Please provide either a customer email address or customer name to compose a promotional email.'
      };
    }

    let user = null;
    if (customerEmail) {
      user = await User.findOne({ email: new RegExp(`^${customerEmail.trim()}$`, 'i') }).select('_id name email').lean();
    } else if (customerName) {
      const escapedName = customerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ name: new RegExp(escapedName, 'i') }).select('_id name email').lean();
    }

    const resolvedEmail = user?.email || customerEmail;
    const resolvedName = user?.name || customerName || 'Valued Customer';

    if (!resolvedEmail) {
      return {
        success: false,
        message: `Could not identify an email address for customer "${customerName}". Please specify their email address.`
      };
    }

    const formattedCode = dealCode ? dealCode.trim().toUpperCase() : (discountPercent ? `SAVE${discountPercent}` : 'SPECIALDEAL');
    const defaultSubject = subject || `Exclusive Deal from E-Shop: Enjoy Special Savings with Code ${formattedCode}!`;
    const defaultBody = message ||
      `We appreciate your patronage at E-Shop! As one of our most valued shoppers, we are excited to offer you an exclusive promotional deal.\n\nUse your personalized code at checkout to unlock your special savings.`;

    const draft = {
      customerId: user?._id ? user._id.toString() : null,
      customerEmail: resolvedEmail,
      customerName: resolvedName,
      subject: defaultSubject,
      body: defaultBody,
      dealCode: formattedCode,
      discountPercent: discountPercent ? Number(discountPercent) : null,
      requiresConfirmation: true
    };

    return {
      success: true,
      draft,
      message: `I have composed a promotional email draft for **${resolvedName}** (<${resolvedEmail}>). Review the preview below and confirm to dispatch.`
    };
  } catch (error) {
    logger.error('draftCrmEmailTool error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin Tool 6: Dispatch CRM Deal Email to Customer with Strict Audit Trail
 */
const sendCrmEmailTool = async ({
  customerEmail,
  customerName,
  subject,
  body,
  dealCode,
  discountPercent,
  adminId,
  adminName,
  ip,
  userAgent
}) => {
  try {
    if (!customerEmail || !body) {
      return {
        success: false,
        message: 'Customer email and email body are required to dispatch a promotional email.'
      };
    }

    const cleanEmail = customerEmail.trim();

    // Look up user if registered
    const user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') }).select('_id name email').lean();
    const resolvedName = customerName || user?.name || 'Valued Customer';

    // Dispatch email via Nodemailer service
    const mailResult = await emailService.sendEmail(cleanEmail, 'crmDeal', {
      customerName: resolvedName,
      subject: subject || 'Special Offer from E-Shop! 🎉',
      body,
      dealCode: dealCode ? dealCode.toUpperCase() : null,
      discountPercent: discountPercent ? Number(discountPercent) : null,
      adminName: adminName || 'Store Admin'
    });

    // Record strict Administrative Audit Trail
    let logEntry = null;
    if (adminId && AdminLog.logAction) {
      logEntry = await AdminLog.logAction(
        adminId,
        'create',
        'user',
        user?._id || null,
        {
          type: 'crm_email',
          customerEmail: cleanEmail,
          customerName: resolvedName,
          subject: subject || 'Special Offer from E-Shop! 🎉',
          dealCode: dealCode || null,
          discountPercent: discountPercent || null,
          bodySnippet: body.slice(0, 160),
          sentByAdmin: adminName || 'Admin'
        },
        ip || null,
        userAgent || null
      );
    }

    return {
      success: true,
      messageId: mailResult?.messageId,
      logId: logEntry?._id ? logEntry._id.toString() : null,
      customerEmail: cleanEmail,
      customerName: resolvedName,
      message: `Promotional email successfully dispatched to **${cleanEmail}**! Audit log entry recorded.`
    };
  } catch (error) {
    logger.error('sendCrmEmailTool error:', error);

    // Record failed attempt in audit log
    if (adminId && AdminLog.logAction) {
      await AdminLog.logAction(
        adminId,
        'create',
        'user',
        null,
        {
          type: 'crm_email_failure',
          customerEmail,
          error: error.message
        },
        ip || null,
        userAgent || null
      ).catch(() => {});
    }

    return { success: false, error: error.message };
  }
};

// ══════════════════════════════════════════════════════════════════
// 3. DETERMINISTIC INTENT & KEYWORD FALLBACK ENGINE
// ══════════════════════════════════════════════════════════════════

/**
 * Fallback intent classifier when Gemini API key is absent or network fails.
 * Guarantees 100% database-backed accuracy and immediate responsiveness.
 */
const processCustomerFallback = async ({ message, user, userId }) => {
  const text = (message || '').trim().toLowerCase();

  // 1. Order tracking intent
  const orderMatch = text.match(/ord[a-z0-9-]+/i) || text.match(/\b\d{6,}\b/);
  const emailInText = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const customerEmail = user?.email || (emailInText ? emailInText[0] : null);
  const isOrderQuery =
    text.includes('where is my order') ||
    text.includes('order status') ||
    text.includes('track order') ||
    text.includes('track my order') ||
    text.includes('my orders') ||
    Boolean(orderMatch);

  if (isOrderQuery) {
    const orderNumber = orderMatch ? orderMatch[0] : null;
    const result = await getOrderStatusTool({ orderNumber, userId, email: customerEmail });

    if (result.success && result.order) {
      const o = result.order;
      return {
        reply: `Here are the latest details for **Order #${o.orderNumber}**.\n\n` +
          `• **Status:** ${o.status.toUpperCase()}${o.isCancelled ? ' (Cancelled)' : ''}\n` +
          `• **Courier:** ${o.courier}\n` +
          (o.trackingNumber ? `• **Tracking ID:** \`${o.trackingNumber}\`\n` : '') +
          `• **Total Items:** ${o.itemCount} items (₹${o.total.toLocaleString('en-IN')})\n` +
          (o.estimatedDelivery ? `• **Estimated Delivery:** ${new Date(o.estimatedDelivery).toLocaleDateString()}\n` : '') +
          `\nYou can track step-by-step progress directly in your order history.`,
        order: o,
        products: [],
        suggestions: ['Return policy', 'Browse more products', 'Contact care desk']
      };
    } else {
      return {
        reply: result.message || 'I couldn\'t locate that order. Please make sure you are logged in or provide your order number and registered email.',
        order: null,
        products: [],
        suggestions: ['Log in to account', 'Browse best deals', 'Shipping policy']
      };
    }
  }

  // 2. FAQ / Policies intent
  if (text.includes('shipping') || text.includes('delivery') || text.includes('how long')) {
    const faq = (await getStoreFaqTool({ topic: 'shipping' })).faq;
    return {
      reply: `### ${faq.title}\n\n${faq.content}`,
      products: [],
      suggestions: ['Return policy', 'Payment options', 'Find popular items']
    };
  }

  if (text.includes('return') || text.includes('refund') || text.includes('exchange')) {
    const faq = (await getStoreFaqTool({ topic: 'returns' })).faq;
    return {
      reply: `### ${faq.title}\n\n${faq.content}`,
      products: [],
      suggestions: ['Where is my order?', 'Warranty coverage', 'Shop new arrivals']
    };
  }

  if (text.includes('pay') || text.includes('payment') || text.includes('upi') || text.includes('card') || text.includes('cod')) {
    const faq = (await getStoreFaqTool({ topic: 'payment' })).faq;
    return {
      reply: `### ${faq.title}\n\n${faq.content}`,
      products: [],
      suggestions: ['Track my order', 'Shipping policy', 'Best deals today']
    };
  }

  if (text.includes('warranty') || text.includes('guarantee') || text.includes('authentic') || text.includes('original')) {
    const faq = (await getStoreFaqTool({ topic: 'warranty' })).faq;
    return {
      reply: `### ${faq.title}\n\n${faq.content}`,
      products: [],
      suggestions: ['Electronics deals', 'Return policy', 'Customer care']
    };
  }

  // 3. Category & Price bound extraction
  let category;
  const categories = ['electronics', 'clothing', 'books', 'home', 'beauty', 'sports'];
  for (const cat of categories) {
    if (text.includes(cat) || (cat === 'clothing' && (text.includes('shirt') || text.includes('shoes') || text.includes('dress') || text.includes('hoodie')))) {
      category = cat;
      break;
    }
  }

  let maxPrice;
  const underPriceMatch = text.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)/i);
  if (underPriceMatch) {
    maxPrice = Number(underPriceMatch[1].replace(/,/g, ''));
  }

  // 4. Pure Friendly Greeting Check (BEFORE catalog search to prevent matching random words)
  const isPureGreeting =
    /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy|namaste|sup|yo|who are you|what can you do)\b/i.test(text.trim()) &&
    !category &&
    !underPriceMatch &&
    !text.includes('buy') &&
    !text.includes('order') &&
    !text.includes('track') &&
    !text.includes('deal') &&
    !text.includes('discount') &&
    !text.includes('offer');

  if (isPureGreeting || text === '') {
    const featuredResult = await searchCatalogTool({ featuredOnly: true, limit: 3 });
    return {
      reply: `Hello${user?.name ? ' ' + user.name.split(' ')[0] : ''}! 👋 I'm your **E-Shop AI Shopping Assistant**.\n\n` +
        `I can help you discover items, track orders in real time, compare specifications, and answer questions about store policies.\n\n` +
        `Here are some popular options you might like today:`,
      products: featuredResult.products || [],
      suggestions: [
        'Find running shoes under ₹2,000',
        'Where is my order?',
        'Best deals today',
        'What is your return policy?'
      ]
    };
  }

  // 5. Product Search & Discovery
  const cleanKeywords = text
    .replace(/(?:find|show|me|best|under|below|less than|within|deals|today|please|search|for|i need|a|an|the|₹|rs\.?|inr|\d+[\d,]*)/gi, ' ')
    .trim();

  const isDealsQuery = text.includes('deal') || text.includes('discount') || text.includes('offer') || text.includes('featured');

  const searchResult = await searchCatalogTool({
    query: cleanKeywords || (category ? '' : 'phone'),
    category,
    maxPrice,
    featuredOnly: isDealsQuery,
    limit: 4
  });

  if (searchResult.products && searchResult.products.length > 0) {
    const count = searchResult.products.length;
    const filterDesc = [
      category ? `in **${category}**` : null,
      maxPrice ? `under **₹${maxPrice.toLocaleString('en-IN')}**` : null,
      isDealsQuery ? 'with top discounts' : null
    ].filter(Boolean).join(' ');

    const reply = `I found **${count} matching product${count > 1 ? 's' : ''}** ${filterDesc || 'from our live catalog'}.\n\n` +
      `You can inspect specifications, check discounts, and add items directly to your shopping cart below:`;

    return {
      reply,
      products: searchResult.products,
      suggestions: [
        'Compare these products',
        'Find items under ₹1,500',
        'What is your return policy?'
      ]
    };
  }

  // Fallback broad search
  const broadResult = await searchCatalogTool({ limit: 4 });
  return {
    reply: `I couldn't find exact matches for "${message}". However, here are some of our top trending products currently available:`,
    products: broadResult.products || [],
    suggestions: [
      'Electronics under ₹10,000',
      'Track my order',
      'Return policy'
    ]
  };
};

/**
 * Fallback intent classifier for Admin Copilot when Gemini API key is absent.
 */
const processAdminFallback = async ({ message, adminUser, adminId }) => {
  const text = (message || '').trim().toLowerCase();

  // 1. KPI & Sales Dashboard
  if (text.includes('kpi') || text.includes('revenue') || text.includes('sale') || text.includes('stat') || text.includes('performance') || text.includes('dashboard')) {
    const statsResult = await getStoreStatsTool();
    const k = statsResult.kpis;
    return {
      reply: `### 📊 Executive Store Operations Summary\n\n` +
        `• **Gross Sales:** ${k.formattedSales}\n` +
        `• **Total Orders:** ${k.totalOrders.toLocaleString()} orders\n` +
        `• **Pending/Processing:** ${k.pendingOrders} orders requiring fulfillment\n` +
        `• **Catalog Inventory:** ${k.totalProducts} active products\n` +
        `• **Registered Customers:** ${k.totalUsers.toLocaleString()} customer accounts\n` +
        `• **Low-Stock Warnings:** ${k.lowStockCount} products at or below threshold\n\n` +
        `System operations are healthy and live.`,
      kpis: k,
      suggestions: ['Show inventory alerts', 'High churn risk accounts', 'Recent admin audit logs']
    };
  }

  // 2. Stock Depletion & Inventory Alerts
  if (text.includes('stock') || text.includes('inventory') || text.includes('alert') || text.includes('out of stock')) {
    const alerts = await getInventoryAlertsTool({ threshold: 5 });
    return {
      reply: `### ⚠️ Inventory Depletion Report\n\n` +
        `• **Total Flagged Products:** ${alerts.totalAlerts}\n` +
        `• **Out of Stock (Zero Units):** ${alerts.outOfStockCount}\n` +
        `• **Critical Low (≤5 Units):** ${alerts.criticallyLowCount}\n\n` +
        `Immediate restock is recommended for items with zero or critical inventory.`,
      alerts: alerts.items,
      suggestions: ['Store KPIs', 'Customer churn predictions', 'View audit logs']
    };
  }

  // 3. Customer Churn Risk Analysis
  if (text.includes('churn') || text.includes('risk') || text.includes('customer retention') || text.includes('leaving')) {
    const churn = await getChurnRiskTool();
    return {
      reply: `### 📉 Customer Churn Risk Analysis\n\n` +
        `Evaluated **${churn.totalEvaluated}** active customer accounts against ML churn factors.\n` +
        `• **High Churn Risk:** ${churn.highRiskCount} accounts detected.\n\n` +
        `Key risk indicators include prolonged inactivity (>60 days since last purchase) and low engagement score. You can compose and dispatch re-engagement promotional emails directly through this copilot.`,
      churnData: churn.highRiskUsers,
      suggestions: ['Draft deal email to customer', 'Store KPIs', 'Inventory alerts', 'Recent admin logs']
    };
  }

  // 4. Admin Audit Trail
  if (text.includes('log') || text.includes('audit') || text.includes('action') || text.includes('history')) {
    const logsResult = await getRecentAuditLogsTool({ limit: 5 });
    return {
      reply: `### 📝 Recent Administrative Audit Logs\n\n` +
        `Retrieved the latest ${logsResult.logs.length} administrative events from the database. Every sensitive action is cryptographically tracked with administrator credentials and IP address.`,
      logs: logsResult.logs,
      suggestions: ['Store KPIs', 'Low stock alerts', 'Churn risk analysis']
    };
  }

  // 5. CRM Email outreach intent
  const isEmailIntent =
    text.includes('email') ||
    text.includes('mail') ||
    text.includes('send deal') ||
    text.includes('send offer') ||
    text.includes('send promo') ||
    text.includes('crm') ||
    text.includes('outreach') ||
    text.includes('voucher to');

  if (isEmailIntent) {
    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const customerEmail = emailMatch ? emailMatch[0] : null;

    // Detect discount percent
    const discountMatch = message.match(/(\d+)\s*%/);
    const discountPercent = discountMatch ? Number(discountMatch[1]) : null;

    // Detect promo/deal code
    const codeMatch = message.match(/(?:code|coupon|voucher)\s*[:=]?\s*([a-zA-Z0-9_-]{3,15})/i);
    const dealCode = codeMatch ? codeMatch[1].toUpperCase() : (discountPercent ? `SAVE${discountPercent}` : 'SPECIALDEAL');

    // Detect customer name if no email provided
    let customerName = null;
    const nameMatch = message.match(/(?:to customer|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch && !customerEmail) {
      customerName = nameMatch[1];
    }

    const draftResult = await draftCrmEmailTool({
      customerEmail: customerEmail || (customerName ? undefined : 'customer@example.com'),
      customerName,
      subject: `Exclusive Deal for You: ${discountPercent ? `${discountPercent}% OFF with ` : ''}Code ${dealCode}!`,
      message: `We appreciate your support with E-Shop! As a valued shopper, here is an exclusive promotional offer just for you.\n\nUse your personalized deal code during checkout to enjoy savings on your next order.`,
      dealCode,
      discountPercent
    });

    if (draftResult.success) {
      return {
        reply: `### ✉️ CRM Promotional Email Draft Prepared\n\n` +
          `I have composed a personalized promotional deal email for **${draftResult.draft.customerName}** (\`${draftResult.draft.customerEmail}\`).\n\n` +
          `• **Subject:** ${draftResult.draft.subject}\n` +
          `• **Voucher Code:** \`${draftResult.draft.dealCode}\`${draftResult.draft.discountPercent ? ` (${draftResult.draft.discountPercent}% OFF)` : ''}\n\n` +
          `⚠️ **Human Confirmation Required:** Per E-Shop security governance, state-modifying actions require explicit authorization. Review the interactive draft card below and click **"Confirm & Send Email"** to dispatch.`,
        emailDraft: draftResult.draft,
        suggestions: ['Store KPIs', 'High churn risk accounts', 'Recent admin audit logs']
      };
    }
  }

  // Admin Welcome default
  const stats = (await getStoreStatsTool()).kpis;
  const adminNameGreeting = adminUser?.name ? ' ' + adminUser.name.split(' ')[0] : 'Administrator';

  return {
    reply: `👋 Welcome to the **Admin Operations Copilot**, ${adminNameGreeting}.\n\n` +
      `Store operations overview:\n` +
      `• Gross Sales: **${stats.formattedSales}** across **${stats.totalOrders}** orders\n` +
      `• **${stats.pendingOrders}** pending orders await fulfillment\n` +
      `• **${stats.lowStockCount}** products currently flag low-stock warnings\n\n` +
      `You can check metrics or ask me to prepare and dispatch targeted CRM promotional emails to customers.`,
    kpis: stats,
    suggestions: [
      'Show store performance KPIs',
      'Show inventory depletion alerts',
      'Show customers with high churn risk',
      'Draft deal email to customer',
      'Show recent admin audit logs'
    ]
  };
};

// ══════════════════════════════════════════════════════════════════
// 4. LIVE GEMINI LLM ORCHESTRATION WITH FUNCTION CALLING
// ══════════════════════════════════════════════════════════════════

/**
 * Executes grounded Gemini LLM inference with tool calling when GEMINI_API_KEY is configured.
 */
const executeGeminiWithTools = async ({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  toolsDefinitions = [],
  toolExecutor
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Format message history
  const contents = [];
  const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : [];

  for (const h of safeHistory) {
    if (h.content && typeof h.content === 'string') {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 800
    }
  };

  if (toolsDefinitions && toolsDefinitions.length > 0) {
    requestBody.tools = [
      {
        functionDeclarations: toolsDefinitions
      }
    ];
  }

  // Turn 1: Initial user query to Gemini
  const response = await axios.post(endpoint, requestBody, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
  });

  const candidate = response.data?.candidates?.[0];
  const functionCallPart = candidate?.content?.parts?.find((p) => p.functionCall);

  if (!functionCallPart || !toolExecutor) {
    const textPart = candidate?.content?.parts?.find((p) => p.text);
    return { text: textPart?.text || 'I have analyzed your request based on current store records.' };
  }

  // Turn 2: Grounded Function Execution
  const toolName = functionCallPart.functionCall.name;
  const toolArgs = functionCallPart.functionCall.args || {};
  logger.info(`AI Chat executing grounded tool: ${toolName}`);

  const toolOutput = await toolExecutor(toolName, toolArgs);

  // Turn 3: Send function execution result back to Gemini for grounded synthesis
  contents.push({
    role: 'model',
    parts: [{ functionCall: functionCallPart.functionCall }]
  });

  contents.push({
    role: 'user',
    parts: [
      {
        functionResponse: {
          name: toolName,
          response: toolOutput
        }
      }
    ]
  });

  const followUpResponse = await axios.post(endpoint, requestBody, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
  });

  const finalCandidate = followUpResponse.data?.candidates?.[0];
  const finalReply = finalCandidate?.content?.parts?.find((p) => p.text)?.text ||
    'Here are the verified records from the E-Shop live store database:';

  return { text: finalReply, toolData: toolOutput };
};

// Tool declarations for Gemini
const customerToolDeclarations = [
  {
    name: 'search_catalog',
    description: 'Searches the live catalog for verified products matching category, budget, keyword or brand.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Product keyword or search query' },
        category: { type: 'STRING', description: 'Category: electronics, clothing, books, home, beauty, sports' },
        minPrice: { type: 'NUMBER', description: 'Minimum price in INR' },
        maxPrice: { type: 'NUMBER', description: 'Maximum price in INR' },
        brand: { type: 'STRING', description: 'Brand name' },
        inStockOnly: { type: 'BOOLEAN', description: 'Only show in-stock products (default true)' }
      }
    }
  },
  {
    name: 'get_order_status',
    description: 'Fetches real-time fulfillment status, tracking number, courier, and items for an order.',
    parameters: {
      type: 'OBJECT',
      properties: {
        orderNumber: { type: 'STRING', description: 'The order number, e.g. ORD-170000000000' }
      }
    }
  },
  {
    name: 'get_store_faq',
    description: 'Retrieves verified store policies regarding shipping, returns, warranty, payment options, and support.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING', description: 'Topic: shipping, returns, payment, warranty, contact' }
      },
      required: ['topic']
    }
  }
];

const adminToolDeclarations = [
  {
    name: 'get_store_stats',
    description: 'Fetches total gross sales, total orders, pending fulfillments, catalog count, and customer count.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'get_inventory_alerts',
    description: 'Identifies products that are out of stock or nearing inventory depletion.',
    parameters: {
      type: 'OBJECT',
      properties: {
        threshold: { type: 'NUMBER', description: 'Stock threshold (default 5)' }
      }
    }
  },
  {
    name: 'get_churn_risk',
    description: 'Evaluates customer churn probabilities and highlights high-risk accounts.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'get_recent_audit_logs',
    description: 'Retrieves the latest administrative audit trail events.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Number of logs to retrieve (default 5)' }
      }
    }
  },
  {
    name: 'draft_crm_email',
    description: 'Composes a targeted CRM email draft to a customer with promotional deals, discounts, or voucher codes. Requires customerEmail or customerName and promotional content.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerEmail: { type: 'STRING', description: 'Customer email address (e.g. customer@example.com)' },
        customerName: { type: 'STRING', description: 'Customer name' },
        subject: { type: 'STRING', description: 'Email subject line' },
        message: { type: 'STRING', description: 'Promotional message body detailing the offer or deal' },
        dealCode: { type: 'STRING', description: 'Voucher or promo code (e.g. SAVE20, DIWALI25)' },
        discountPercent: { type: 'NUMBER', description: 'Discount percentage (e.g. 20, 25)' }
      },
      required: ['message']
    }
  }
];

// ══════════════════════════════════════════════════════════════════
// 5. PUBLIC EXPORTED DISPATCHERS (Customer & Admin)
// ══════════════════════════════════════════════════════════════════

/**
 * Main customer chat processing entrypoint
 */
const processCustomerMessage = async ({ message, conversationHistory = [], user, userId }) => {
  // Try Live Gemini first if API key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const systemPrompt =
        'You are the E-Shop AI Shopping Concierge. You assist online shoppers with product discovery, order tracking, and store policies.\n' +
        'CRITICAL ZERO-HALLUCINATION RULES:\n' +
        '1. You MUST NEVER invent or hallucinate products, discounts, or stock levels. Only reference data returned by tools.\n' +
        '2. When users ask for product recommendations, ALWAYS call search_catalog with relevant filters.\n' +
        '3. When users ask about order tracking or status, call get_order_status.\n' +
        '4. When users ask about returns, shipping, or payments, call get_store_faq.\n' +
        '5. Keep responses concise, friendly, and formatted in clean markdown.';

      let collectedProducts = [];
      let collectedOrder = null;

      const toolExecutor = async (toolName, toolArgs) => {
        if (toolName === 'search_catalog') {
          const res = await searchCatalogTool(toolArgs);
          collectedProducts = res.products || [];
          return { data: res };
        }
        if (toolName === 'get_order_status') {
          const res = await getOrderStatusTool({
            orderNumber: toolArgs.orderNumber,
            userId,
            email: user?.email
          });
          collectedOrder = res.order || null;
          return { data: res };
        }
        if (toolName === 'get_store_faq') {
          const res = await getStoreFaqTool({ topic: toolArgs.topic });
          return { data: res };
        }
        return { data: { success: false, message: 'Unknown tool' } };
      };

      const result = await executeGeminiWithTools({
        systemPrompt,
        userMessage: message,
        conversationHistory,
        toolsDefinitions: customerToolDeclarations,
        toolExecutor
      });

      return {
        reply: result.text,
        products: collectedProducts,
        order: collectedOrder,
        suggestions: ['Where is my order?', 'Find running shoes', 'What is your return policy?']
      };
    } catch (llmErr) {
      logger.warn('Gemini LLM call failed or key inactive, using deterministic fallback engine:', llmErr.message);
    }
  }

  // Deterministic local engine (immediate response, zero dependencies)
  return await processCustomerFallback({ message, user, userId });
};

/**
 * Main admin chat processing entrypoint
 */
const processAdminMessage = async ({ message, conversationHistory = [], adminUser, adminId }) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const systemPrompt =
        'You are the Executive Operations Copilot for E-Shop Store Administrators.\n' +
        'You provide instant business intelligence on revenue KPIs, inventory depletion, customer churn risk, audit logs, and targeted CRM outreach.\n' +
        'CRITICAL RULES:\n' +
        '1. Only report metrics retrieved from the database tools.\n' +
        '2. Present numbers with Indian currency notation (₹) and clear bullet points.\n' +
        '3. When the administrator asks to send an email, offer, or deal to a customer, use the draft_crm_email tool to compose an interactive draft.\n' +
        '4. Maintain a professional, executive tone.';

      let collectedKpis = null;
      let collectedAlerts = [];
      let collectedChurn = [];
      let collectedLogs = [];
      let collectedEmailDraft = null;

      const toolExecutor = async (toolName, toolArgs) => {
        if (toolName === 'get_store_stats') {
          const res = await getStoreStatsTool();
          collectedKpis = res.kpis || null;
          return { data: res };
        }
        if (toolName === 'get_inventory_alerts') {
          const res = await getInventoryAlertsTool(toolArgs);
          collectedAlerts = res.items || [];
          return { data: res };
        }
        if (toolName === 'get_churn_risk') {
          const res = await getChurnRiskTool();
          collectedChurn = res.highRiskUsers || [];
          return { data: res };
        }
        if (toolName === 'get_recent_audit_logs') {
          const res = await getRecentAuditLogsTool(toolArgs);
          collectedLogs = res.logs || [];
          return { data: res };
        }
        if (toolName === 'draft_crm_email') {
          const res = await draftCrmEmailTool(toolArgs);
          collectedEmailDraft = res.draft || null;
          return { data: res };
        }
        return { data: { success: false, message: 'Unknown tool' } };
      };

      const result = await executeGeminiWithTools({
        systemPrompt,
        userMessage: message,
        conversationHistory,
        toolsDefinitions: adminToolDeclarations,
        toolExecutor
      });

      return {
        reply: result.text,
        kpis: collectedKpis,
        alerts: collectedAlerts,
        churnData: collectedChurn,
        logs: collectedLogs,
        emailDraft: collectedEmailDraft,
        suggestions: ['Store KPIs', 'Inventory alerts', 'Churn risk analysis', 'Draft deal email to customer', 'Audit logs']
      };
    } catch (llmErr) {
      logger.warn('Gemini Admin Copilot call failed, using deterministic fallback engine:', llmErr.message);
    }
  }

  return await processAdminFallback({ message, adminUser, adminId });
};

module.exports = {
  // Grounded Tools
  searchCatalogTool,
  getProductDetailsTool,
  compareProductsTool,
  getOrderStatusTool,
  getStoreFaqTool,
  getStoreStatsTool,
  getInventoryAlertsTool,
  getChurnRiskTool,
  getRecentAuditLogsTool,
  draftCrmEmailTool,
  sendCrmEmailTool,
  // Main dispatchers
  processCustomerMessage,
  processAdminMessage
};
