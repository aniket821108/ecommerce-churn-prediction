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
    emailDraft: response.emailDraft || null,
    whatsappDraft: response.whatsappDraft || null,
    suggestions: response.suggestions || []
  });
});

/**
 * Handle Admin Confirmed CRM Promotional Email Dispatch
 * Route: POST /api/chat/admin/send-email
 * Access: Private (Admin Only)
 */
exports.handleAdminSendEmail = catchAsync(async (req, res) => {
  const { customerEmail, customerName, subject, body, dealCode, discountPercent } = req.body;

  if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'A valid customer email address is required.'
    });
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email body content is required.'
    });
  }

  const cleanEmail = sanitizeInput(customerEmail.trim());
  const cleanSubject = subject ? sanitizeInput(subject.trim()) : 'Special Offer from E-Shop! 🎉';
  const cleanBody = sanitizeInput(body.trim());
  const cleanCode = dealCode ? sanitizeInput(dealCode.trim()) : null;

  const result = await aiChatService.sendCrmEmailTool({
    customerEmail: cleanEmail,
    customerName: customerName ? sanitizeInput(customerName) : undefined,
    subject: cleanSubject,
    body: cleanBody,
    dealCode: cleanCode,
    discountPercent: discountPercent ? Number(discountPercent) : undefined,
    adminId: req.userId,
    adminName: req.user?.name || 'Administrator',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.error || 'Failed to dispatch email.'
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    logId: result.logId,
    customerEmail: result.customerEmail
  });
});

/**
 * Handle Admin Confirmed CRM WhatsApp Deal Outreach Dispatch
 * Route: POST /api/chat/admin/send-whatsapp
 * Access: Private (Admin Only)
 */
exports.handleAdminSendWhatsapp = catchAsync(async (req, res) => {
  const { customerPhone, customerName, customerEmail, message, dealCode, discountPercent } = req.body;

  if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({
      success: false,
      message: 'A valid customer phone number (at least 10 digits) is required.'
    });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp message content is required.'
    });
  }

  const cleanPhone = customerPhone.trim();
  const cleanMessage = sanitizeInput(message.trim());
  const cleanName = customerName ? sanitizeInput(customerName) : undefined;
  const cleanEmail = customerEmail ? sanitizeInput(customerEmail.trim()) : undefined;
  const cleanCode = dealCode ? sanitizeInput(dealCode.trim()) : null;

  const result = await aiChatService.sendWhatsappDealTool({
    customerPhone: cleanPhone,
    customerName: cleanName,
    customerEmail: cleanEmail,
    message: cleanMessage,
    dealCode: cleanCode,
    discountPercent: discountPercent ? Number(discountPercent) : undefined,
    adminId: req.userId,
    adminName: req.user?.name || 'Administrator',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  if (!result.success) {
    return res.status(500).json({
      success: false,
      message: result.error || 'Failed to dispatch WhatsApp deal message.'
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    logId: result.logId,
    customerPhone: result.customerPhone,
    waLink: result.waLink,
    mode: result.mode
  });
});
