const request = require('supertest');

// Mock Product model
jest.mock('../../src/models/Product', () => {
  const mockProduct = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Nike Air Running Shoes',
    slug: 'nike-air-running-shoes',
    price: 1899,
    compareAtPrice: 2499,
    category: 'clothing',
    brand: 'Nike',
    stock: 12,
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', isPrimary: true }],
    isFeatured: true,
    isActive: true
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([mockProduct])
  };

  return {
    find: jest.fn().mockReturnValue(mockQuery),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProduct)
    }),
    countDocuments: jest.fn().mockResolvedValue(10)
  };
});

// Mock Order model
jest.mock('../../src/models/Order', () => {
  const mockOrder = {
    _id: '64f1a2b3c4d5e6f7a8b9c0e2',
    orderNumber: 'ORD-170000000000',
    status: 'shipped',
    total: 1899,
    courier: 'BlueDart Express',
    trackingNumber: 'TRKC0E2',
    createdAt: new Date(),
    items: [
      {
        name: 'Nike Air Running Shoes',
        quantity: 1,
        price: 1899,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
      }
    ]
  };

  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(mockOrder)
  };

  return {
    findOne: jest.fn().mockReturnValue(mockQuery),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockOrder])
    }),
    countDocuments: jest.fn().mockResolvedValue(25),
    aggregate: jest.fn().mockResolvedValue([{ totalSales: 48500 }])
  };
});

// Mock AdminLog model
jest.mock('../../src/models/AdminLog', () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([])
  }),
  countDocuments: jest.fn().mockResolvedValue(5),
  logAction: jest.fn().mockResolvedValue({ _id: '64f1a2b3c4d5e6f7a8b9c0d8' })
}));

// Mock User model
jest.mock('../../src/models/User', () => ({
  find: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([
      { _id: '64f1a2b3c4d5e6f7a8b9c0f3', name: 'John Doe', email: 'john@example.com', createdAt: new Date() }
    ])
  }),
  findOne: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({
      _id: '64f1a2b3c4d5e6f7a8b9c0f3',
      name: 'John Doe',
      email: 'john@example.com'
    })
  })),
  findById: jest.fn().mockImplementation((id) => ({
    select: jest.fn().mockResolvedValue({
      _id: id,
      name: 'Admin User',
      email: 'admin@eshop.com',
      role: 'admin',
      isActive: true,
      tokenVersion: 0
    })
  })),
  countDocuments: jest.fn().mockResolvedValue(15)
}));

// Mock emailService
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-int-test-123' }),
  sendBulkEmail: jest.fn().mockResolvedValue([{ success: true }]),
  emailTemplates: {
    crmDeal: jest.fn().mockReturnValue({ subject: 'Special Offer from E-Shop!', html: '<p>Offer</p>' })
  }
}));

// Mock jwt utils for auth
const jwt = require('jsonwebtoken');
process.env.JWT_ACCESS_SECRET = 'test_access_secret';

const app = require('../../src/app');

describe('AI Chatbot & Operations Copilot API Integration Tests', () => {
  describe('Customer Chat Endpoint — POST /api/chat/customer', () => {
    it('should return 400 Bad Request when message is missing', async () => {
      const res = await request(app)
        .post('/api/chat/customer')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('message string is required');
    });

    it('should return 200 with catalog product recommendations for product search query', async () => {
      const res = await request(app)
        .post('/api/chat/customer')
        .send({ message: 'Find running shoes under ₹2,000' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0].name).toBe('Nike Air Running Shoes');
      expect(res.body.suggestions).toBeDefined();
    });

    it('should return 200 with grounded store return policy for policy inquiries', async () => {
      const res = await request(app)
        .post('/api/chat/customer')
        .send({ message: 'What is your return policy?' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toContain('Returns & Refund');
      expect(res.body.reply).toContain('30-day');
    });

    it('should return 200 with order tracking information when tracking number is queried', async () => {
      const res = await request(app)
        .post('/api/chat/customer')
        .send({ message: 'Track my order ORD-170000000000 with email john@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.orderNumber).toBe('ORD-170000000000');
      expect(res.body.order.status).toBe('shipped');
    });
  });

  describe('Admin Operations Copilot Endpoint — POST /api/chat/admin', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/chat/admin')
        .send({ message: 'Show store KPIs' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin request with 403 Forbidden', async () => {
      const userToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0f3', role: 'user', tokenVersion: 0 },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      // Temporarily mock User.findById to return role 'user'
      const User = require('../../src/models/User');
      User.findById.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          _id: '64f1a2b3c4d5e6f7a8b9c0f3',
          name: 'Regular Customer',
          email: 'user@example.com',
          role: 'user',
          isActive: true,
          tokenVersion: 0
        })
      });

      const res = await request(app)
        .post('/api/chat/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'Show store KPIs' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with executive KPIs when requested by an authorized administrator', async () => {
      const adminToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0d9', role: 'admin', tokenVersion: 0 },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .post('/api/chat/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Show store performance and KPIs' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.kpis).toBeDefined();
      expect(res.body.kpis.totalSales).toBe(48500);
      expect(res.body.reply).toContain('Executive Store Operations Summary');
    });

    it('should return email draft preview when admin requests CRM email outreach', async () => {
      const adminToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0d9', role: 'admin', tokenVersion: 0 },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .post('/api/chat/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Send promotional deal code DIWALI20 to john@example.com with 20% discount' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.emailDraft).toBeDefined();
      expect(res.body.emailDraft.customerEmail).toBe('john@example.com');
      expect(res.body.emailDraft.dealCode).toBe('DIWALI20');
      expect(res.body.emailDraft.discountPercent).toBe(20);
    });
  });

  describe('Admin Confirmed CRM Email Dispatch — POST /api/chat/admin/send-email', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/chat/admin/send-email')
        .send({
          customerEmail: 'john@example.com',
          body: 'Special offer!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request missing customerEmail with 400 Bad Request', async () => {
      const adminToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0d9', role: 'admin', tokenVersion: 0 },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .post('/api/chat/admin/send-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Missing email' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid customer email address is required');
    });

    it('should successfully dispatch email and return audit record when requested by admin', async () => {
      const adminToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0d9', role: 'admin', tokenVersion: 0 },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .post('/api/chat/admin/send-email')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerEmail: 'john@example.com',
          customerName: 'John Doe',
          subject: 'Exclusive 20% Discount Just for You!',
          body: 'We are thrilled to offer you a 20% discount on all electronics. Use code DIWALI20 at checkout.',
          dealCode: 'DIWALI20',
          discountPercent: 20
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.customerEmail).toBe('john@example.com');
      expect(res.body.message).toContain('successfully dispatched');
    });
  });
});
