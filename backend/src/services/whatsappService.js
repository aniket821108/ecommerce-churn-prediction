const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Standard WhatsApp message templates for E-Shop
 */
const whatsappTemplates = {
  crmDeal: ({ customerName, message, dealCode, discountPercent, storeUrl }) => {
    const name = customerName || 'Valued Customer';
    const link = storeUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

    let text = `🎉 *Exclusive Deal from E-Shop!*\n\n` +
      `Hi *${name}*,\n\n` +
      `${message}\n\n`;

    if (dealCode) {
      text += `🏷️ *Promo Code:* \`${dealCode}\`\n`;
    }
    if (discountPercent) {
      text += `🎁 *Discount:* ${discountPercent}% OFF\n`;
    }

    text += `\n👉 *Shop & Redeem:* ${link}/products\n\n` +
      `_Secure Online Shopping · E-Shop Customer Care Desk_`;

    return text;
  }
};

/**
 * Sanitize and format phone number for WhatsApp international standard
 * 10-digit Indian numbers get automatically prefixed with 91.
 */
const formatWhatsappNumber = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Generate a direct WhatsApp Web click-to-chat deep link
 */
const generateWaLink = (phone, text) => {
  const formatted = formatWhatsappNumber(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
};

/**
 * Send WhatsApp Message
 * - If WHATSAPP_API_URL and WHATSAPP_ACCESS_TOKEN are configured: Sends via Meta Cloud API.
 * - Else if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER are configured: Sends via Twilio API.
 * - Otherwise: Generates verified direct web click-to-chat deep link for WhatsApp Web/App.
 */
const sendWhatsappMessage = async ({ phone, templateName = 'crmDeal', data = {} }) => {
  try {
    const formattedPhone = formatWhatsappNumber(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error(`Invalid phone number for WhatsApp: "${phone}". A valid 10-digit mobile number is required.`);
    }

    const templateFn = whatsappTemplates[templateName] || whatsappTemplates.crmDeal;
    const messageText = templateFn(data);
    const waLink = generateWaLink(formattedPhone, messageText);

    // 1. Meta WhatsApp Business Cloud API (Official Provider)
    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_ACCESS_TOKEN) {
      const response = await axios.post(
        process.env.WHATSAPP_API_URL,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: messageText }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );

      const messageId = response.data?.messages?.[0]?.id || `wa-meta-${Date.now()}`;
      logger.info(`Meta WhatsApp message sent to ${formattedPhone}: ${messageId}`);

      return {
        success: true,
        messageId,
        recipientPhone: formattedPhone,
        messageText,
        waLink,
        mode: 'cloud_api'
      };
    }

    // 2. Twilio Programmable Messaging API (WhatsApp Sandbox / Live)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const params = new URLSearchParams();
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

      params.append('From', fromNumber);
      params.append('To', `whatsapp:+${formattedPhone}`);
      params.append('Body', messageText);

      const authHeader = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const response = await axios.post(twilioUrl, params.toString(), {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });

      const messageId = response.data?.sid || `wa-tw-${Date.now()}`;
      logger.info(`Twilio WhatsApp message sent to +${formattedPhone}: ${messageId}`);

      return {
        success: true,
        messageId,
        recipientPhone: formattedPhone,
        messageText,
        waLink,
        mode: 'twilio_api'
      };
    }

    // 3. Direct Web Link / Click-to-Chat Mode (Free, zero-setup, opens WhatsApp Web)
    const simulatedId = `wa-sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logger.info(`WhatsApp dispatch generated via Click-to-Chat link for ${formattedPhone}: ${simulatedId}`);

    return {
      success: true,
      messageId: simulatedId,
      recipientPhone: formattedPhone,
      messageText,
      waLink,
      mode: 'web_link'
    };
  } catch (error) {
    logger.error('Failed to dispatch WhatsApp message:', error.message);
    throw new Error(error.message || 'Failed to dispatch WhatsApp message');
  }
};

module.exports = {
  whatsappTemplates,
  formatWhatsappNumber,
  generateWaLink,
  sendWhatsappMessage
};
