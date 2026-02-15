const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    // Initialize payment gateway configurations
    this.gateways = {
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE || 'sandbox'
      }
    };
  }
  
  // Create payment intent with Stripe
  async createStripePayment(order) {
    try {
      const stripe = require('stripe')(this.gateways.stripe.secretKey);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents/paise
        currency: 'inr',
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          userId: order.user.toString()
        },
        description: `Order #${order.orderNumber}`
      });
      
      logger.info(`Stripe payment intent created: ${paymentIntent.id}`, {
        orderId: order._id
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100
      };
    } catch (error) {
      logger.error('Stripe payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }
  
  // Create Razorpay order
  async createRazorpayOrder(order) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: this.gateways.razorpay.keyId,
        key_secret: this.gateways.razorpay.keySecret
      });
      
      const options = {
        amount: Math.round(order.total * 100), // Convert to paise
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order._id.toString(),
          userId: order.user.toString()
        }
      };
      
      const razorpayOrder = await razorpay.orders.create(options);
      
      logger.info(`Razorpay order created: ${razorpayOrder.id}`, {
        orderId: order._id
      });
      
      return {
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100,
        currency: razorpayOrder.currency,
        key: this.gateways.razorpay.keyId
      };
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }
  
  // Verify Razorpay payment
  async verifyRazorpayPayment(paymentId, orderId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.gateways.razorpay.keySecret)
        .update(body.toString())
        .digest('hex');
      
      const isValid = expectedSignature === signature;
      
      if (isValid) {
        logger.info(`Razorpay payment verified: ${paymentId}`);
        return { success: true, paymentId };
      } else {
        logger.error(`Razorpay payment verification failed: ${paymentId}`);
        return { success: false, error: 'Invalid signature' };
      }
    } catch (error) {
      logger.error('Razorpay verification error:', error);
      throw new Error('Payment verification failed');
    }
  }
  
  // Create PayPal payment
  async createPayPalPayment(order) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = this.gateways.paypal.mode === 'production' ?
        new paypal.core.LiveEnvironment(
          this.gateways.paypal.clientId,
          this.gateways.paypal.clientSecret
        ) :
        new paypal.core.SandboxEnvironment(
          this.gateways.paypal.clientId,
          this.gateways.paypal.clientSecret
        );
      
      const client = new paypal.core.PayPalHttpClient(environment);
      
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: (order.total / 83).toFixed(2) // Convert INR to USD
          },
          description: `Order #${order.orderNumber}`,
          custom_id: order._id.toString()
        }]
      });
      
      const response = await client.execute(request);
      
      logger.info(`PayPal order created: ${response.result.id}`, {
        orderId: order._id
      });
      
      return {
        success: true,
        orderId: response.result.id,
        approvalUrl: response.result.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      logger.error('PayPal payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }
  
  // Capture PayPal payment
  async capturePayPalPayment(orderId) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      
      const environment = this.gateways.paypal.mode === 'production' ?
        new paypal.core.LiveEnvironment(
          this.gateways.paypal.clientId,
          this.gateways.paypal.clientSecret
        ) :
        new paypal.core.SandboxEnvironment(
          this.gateways.paypal.clientId,
          this.gateways.paypal.clientSecret
        );
      
      const client = new paypal.core.PayPalHttpClient(environment);
      
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      
      const response = await client.execute(request);
      
      logger.info(`PayPal payment captured: ${orderId}`);
      
      return {
        success: true,
        captureId: response.result.purchase_units[0].payments.captures[0].id,
        status: response.result.status
      };
    } catch (error) {
      logger.error('PayPal payment capture failed:', error);
      throw new Error(`Payment capture failed: ${error.message}`);
    }
  }
  
  // Process cash on delivery
  async processCashOnDelivery(order) {
    // For cash on delivery, we just mark the payment as pending
    logger.info(`Cash on delivery selected for order: ${order.orderNumber}`);
    
    return {
      success: true,
      paymentMethod: 'cash_on_delivery',
      status: 'pending',
      message: 'Payment will be collected on delivery'
    };
  }
  
  // Process payment based on method
  async processPayment(order, paymentMethod) {
    switch (paymentMethod) {
      case 'credit_card':
      case 'debit_card':
        return await this.createStripePayment(order);
      
      case 'paypal':
        return await this.createPayPalPayment(order);
      
      case 'cash_on_delivery':
        return await this.processCashOnDelivery(order);
      
      default:
        // Default to Razorpay for India
        return await this.createRazorpayOrder(order);
    }
  }
  
  // Verify webhook signature (Stripe)
  async verifyStripeWebhook(payload, signature) {
    try {
      const stripe = require('stripe')(this.gateways.stripe.secretKey);
      
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.gateways.stripe.webhookSecret
      );
      
      return { success: true, event };
    } catch (error) {
      logger.error('Stripe webhook verification failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get payment status
  async getPaymentStatus(paymentId, method) {
    try {
      switch (method) {
        case 'stripe':
          const stripe = require('stripe')(this.gateways.stripe.secretKey);
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
          return paymentIntent.status;
        
        case 'razorpay':
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: this.gateways.razorpay.keyId,
            key_secret: this.gateways.razorpay.keySecret
          });
          const payment = await razorpay.payments.fetch(paymentId);
          return payment.status;
        
        default:
          return 'unknown';
      }
    } catch (error) {
      logger.error(`Failed to get payment status for ${paymentId}:`, error);
      throw new Error('Failed to get payment status');
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;