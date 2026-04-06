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

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password.</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}"
           style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,</p>
        <p>The E-Shop Team</p>
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