const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter
transporter.verify((error) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email service is ready to send messages');
  }
});

// Email templates
const emailTemplates = {

  // ── OTP Verification (NEW) ──────────────────────────
  otpVerification: ({ name, otp }) => ({
    subject: 'Your E-Shop Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; font-size: 28px; margin: 0;">E-Shop</h1>
            <p style="color: #6B7280; margin-top: 4px; font-size: 14px;">Email Verification</p>
          </div>

          <!-- Body -->
          <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for registering with E-Shop! Please use the verification code below to complete your registration.
          </p>

          <!-- OTP Box -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 12px; padding: 20px 48px;">
              <p style="margin: 0; font-size: 13px; color: #6B7280; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Your OTP Code</p>
              <p style="margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #4F46E5; font-family: 'Courier New', monospace;">${otp}</p>
            </div>
          </div>

          <!-- Warning -->
          <div style="background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              ⏱️ This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            If you did not create an E-Shop account, please ignore this email.
          </p>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="text-align: center; color: #9CA3AF; font-size: 13px; margin: 0;">
            E-Shop · Secure Online Shopping
          </p>
        </div>
      </div>
    `
  }),

  // ── Welcome (existing) ──────────────────────────────
  welcome: (user) => ({
    subject: 'Welcome to E-Shop! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome ${user.name}!</h1>
        <p>Thank you for registering with E-Shop.</p>
        <p>Your account has been successfully created.</p>
        <p>Start shopping now and enjoy exclusive deals!</p>
        <br>
        <p>Best regards,</p>
        <p>The E-Shop Team</p>
      </div>
    `
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Thank you for your order!</h1>
        <p>Your order has been confirmed and is being processed.</p>
        <h3>Order Details:</h3>
        <p>Order Number: ${order.orderNumber}</p>
        <p>Total Amount: ₹${order.total.toFixed(2)}</p>
        <p>Payment Method: ${order.payment.method}</p>
        <br>
        <p>We'll notify you once your order ships.</p>
        <br>
        <p>Best regards,</p>
        <p>The E-Shop Team</p>
      </div>
    `
  }),

  orderShipped: (order) => ({
    subject: `Your Order Has Shipped - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Your order is on the way!</h1>
        <p>Great news! Your order has been shipped.</p>
        <h3>Shipping Details:</h3>
        <p>Tracking Number: ${order.trackingNumber}</p>
        <p>Courier: ${order.courier}</p>
        <p>Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>
        <br>
        <p>Best regards,</p>
        <p>The E-Shop Team</p>
      </div>
    `
  }),

  passwordReset: ({ name, resetToken }) => ({
    subject: 'Reset Your E-Shop Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; font-size: 28px; margin: 0;">E-Shop</h1>
            <p style="color: #6B7280; margin-top: 4px; font-size: 14px;">Password Reset</p>
          </div>
          <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new one.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}"
               style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Reset Password
            </a>
          </div>
          <div style="background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">⏱️ This link expires in <strong>30 minutes</strong>. It can only be used once.</p>
          </div>
          <p style="color: #6B7280; font-size: 14px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="text-align: center; color: #9CA3AF; font-size: 13px; margin: 0;">E-Shop · Secure Online Shopping</p>
        </div>
      </div>
    `
  }),

  passwordChanged: ({ name }) => ({
    subject: 'Your E-Shop Password Has Been Changed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #4F46E5; font-size: 28px; margin: 0;">E-Shop</h1>
            <p style="color: #6B7280; margin-top: 4px; font-size: 14px;">Security Alert</p>
          </div>
          <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your password was successfully changed. If you made this change, no further action is needed.</p>
          <div style="background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
            <p style="margin: 0; color: #991B1B; font-size: 14px;">⚠️ If you did <strong>not</strong> make this change, please contact support immediately.</p>
          </div>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="text-align: center; color: #9CA3AF; font-size: 13px; margin: 0;">E-Shop · Secure Online Shopping</p>
        </div>
      </div>
    `
  }),

  // ── CRM Promotional / Deal Outreach ────────────────────────
  crmDeal: ({ customerName, subject, body, dealCode, discountPercent, adminName }) => ({
    subject: subject || 'Special Offer from E-Shop! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 36px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid #4F46E5;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4F46E5; font-size: 26px; margin: 0;">E-Shop Exclusive Offer</h1>
            <p style="color: #6B7280; margin-top: 4px; font-size: 13px;">Curated by your Store Concierge</p>
          </div>
          
          <p style="color: #111827; font-size: 15px; margin-bottom: 12px;">Hello <strong>${customerName || 'Valued Customer'}</strong>,</p>
          
          <div style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap;">
${body}
          </div>

          ${dealCode ? `
          <div style="text-align: center; margin: 28px 0; background: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 10px; padding: 16px;">
            <span style="font-size: 12px; font-weight: 600; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px;">Your Promo Code</span>
            <p style="font-size: 28px; font-weight: bold; color: #1E1B4B; margin: 6px 0; letter-spacing: 2px;">${dealCode}</p>
            ${discountPercent ? `<p style="font-size: 13px; color: #4338CA; margin: 0; font-weight: 600;">Get <strong>${discountPercent}% OFF</strong> on your next purchase!</p>` : ''}
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products"
               style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Claim Offer & Shop Now
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 28px 0;" />
          <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin: 0;">
            Sent by the E-Shop Customer Success Team${adminName ? ` (${adminName})` : ''} · Secure Online Shopping
          </p>
        </div>
      </div>
    `
  })
};

// ── Send single email ─────────────────────────────────
const sendEmail = async (to, templateName, data) => {
  try {
    if (!emailTemplates[templateName]) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    const template = emailTemplates[templateName](data);

    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.subject
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

// ── Send bulk email ───────────────────────────────────
const sendBulkEmail = async (recipients, templateName, data) => {
  try {
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await sendEmail(recipient, templateName, data);
        results.push({ recipient, success: true, ...result });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }
    return results;
  } catch (error) {
    logger.error('Failed to send bulk email:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendEmail,
  sendBulkEmail,
  emailTemplates
};
