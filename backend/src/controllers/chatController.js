const { catchAsync } = require('../middlewares/errorHandler');
const aiChatService = require('../services/aiChatService');
const { sanitizeInput } = require('../utils/validators');
const AdminLog = require('../models/AdminLog');

/**
 * Handle Storefront Customer Assistant Chat
 * Route: POST /api/chat/customer
 * Access: Public / Optional Auth (Guest & Authenticated Shoppers)
 */
exports.handleCustomerChat = catchAsync(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A message string is required.'
    });
  }

  const cleanMessage = sanitizeInput(message.trim());

  // Prevent giant payloads
  if (cleanMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message length exceeds the 1,000 character limit.'
    });
  }

  const response = await aiChatService.processCustomerMessage({
    message: cleanMessage,
    conversationHistory,
    user: req.user || null,
    userId: req.userId || null
  });

  return res.status(200).json({
    success: true,
    reply: response.reply,
    products: response.products || [],
    order: response.order || null,
    comparison: response.comparison || null,
    suggestions: response.suggestions || []
  });
});

/**
 * Handle Store Admin Operations Copilot Chat
 * Route: POST /api/chat/admin
 * Access: Private (Admin Only)
 */
exports.handleAdminChat = catchAsync(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A message string is required.'
    });
  }

  const cleanMessage = sanitizeInput(message.trim());

  if (cleanMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message length exceeds the 1,000 character limit.'
    });
  }

  const response = await aiChatService.processAdminMessage({
    message: cleanMessage,
    conversationHistory,
    adminUser: req.user,
    adminId: req.userId
  });

  // Log copilot query asynchronously for administrative accountability
  if (req.userId && AdminLog.logAction) {
    AdminLog.logAction(
      req.userId,
      'create',
      'setting',
      null,
      { copilotQuery: cleanMessage.slice(0, 80) },
      req.ip,
      req.headers['user-agent']
    ).catch(() => {});
  }

  return res.status(200).json({
    success: true,
    reply: response.reply,
    kpis: response.kpis || null,
    alerts: response.alerts || [],
    churnData: response.churnData || [],
    logs: response.logs || [],
    suggestions: response.suggestions || []
  });
});

