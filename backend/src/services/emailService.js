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
  welcome: (user) => ({
    subject: 'Welcome to Our E-commerce Store!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome ${user.name}!</h1>
        <p>Thank you for registering with our e-commerce store.</p>
        <p>Your account has been successfully created.</p>
        <p>Start shopping now and enjoy exclusive deals!</p>
        <br>
        <p>Best regards,</p>
        <p>The E-commerce Team</p>
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
        <p>The E-commerce Team</p>
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
        <p>You can track your order using the provided tracking number.</p>
        <br>
        <p>Best regards,</p>
        <p>The E-commerce Team</p>
      </div>
    `
  }),
  
  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
           style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,</p>
        <p>The E-commerce Team</p>
      </div>
    `
  })
};

// Send email
const sendEmail = async (to, templateName, data) => {
  try {
    if (!emailTemplates[templateName]) {
      throw new Error(`Email template "${templateName}" not found`);
    }
    
    const template = emailTemplates[templateName](data);
    
    const mailOptions = {
      from: `"E-commerce Store" <${process.env.EMAIL_FROM}>`,
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

// Send bulk email
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