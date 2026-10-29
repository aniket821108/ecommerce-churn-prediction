const aiChatService = require('../../src/services/aiChatService');
const emailService = require('../../src/services/emailService');
const AdminLog = require('../../src/models/AdminLog');

// Mock Product model
jest.mock('../../src/models/Product', () => {
  const sampleProducts = [
    {
      _id: '64f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Wireless Noise Canceling Headphones',
      slug: 'wireless-noise-canceling-headphones',
      price: 4999,
      compareAtPrice: 6999,
      category: 'electronics',
      brand: 'Sony',
      stock: 8,
      images: [{ url: 'https://images.unsplash.com/photo-headphones', isPrimary: true }],
      isFeatured: true,
      isActive: true
    },
    {
      _id: '64f1a2b3c4d5e6f7a8b9c0d2',
      name: 'Budget Earbuds',
      slug: 'budget-earbuds',
      price: 899,
      compareAtPrice: 1299,
      category: 'electronics',
      brand: 'Boat',
      stock: 0,
      images: [{ url: 'https://images.unsplash.com/photo-earbuds', isPrimary: true }],
      isFeatured: false,
      isActive: true
    }
  ];

  return {
    find: jest.fn().mockImplementation((query) => {
      let results = [...sampleProducts];
      if (query.stock && query.stock.$gt === 0) {
        results = results.filter((p) => p.stock > 0);
      }
      if (query.stock && query.stock.$lte !== undefined) {
        results = results.filter((p) => p.stock <= query.stock.$lte);
      }
      return {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(results)
        }),
        lean: jest.fn().mockResolvedValue(results)
      };
    }),
    findOne: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(sampleProducts[0])
    })),
    countDocuments: jest.fn().mockResolvedValue(2)
  };
});

// Mock Order model
jest.mock('../../src/models/Order', () => {
  const sampleOrder = {
    _id: '64f1a2b3c4d5e6f7a8b9c0e1',
    orderNumber: 'ORD-987654321',
    status: 'delivered',
    total: 4999,
    courier: 'FedEx Express',
    trackingNumber: 'FDX987654',
    deliveredAt: new Date(),
    createdAt: new Date(),
    items: [
      {
        name: 'Wireless Noise Canceling Headphones',
        quantity: 1,
        price: 4999,
        image: 'https://images.unsplash.com/photo-headphones'
      }
    ]
  };

  return {
    findOne: jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(sampleOrder)
    })),
    countDocuments: jest.fn().mockResolvedValue(12),
    aggregate: jest.fn().mockResolvedValue([{ totalSales: 75000 }])
  };
});

// Mock User model
jest.mock('../../src/models/User', () => {
  const mockUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c0f1',
    name: 'Customer Test',
    email: 'customer@test.com'
  };

  return {
    findOne: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockUser)
    })),
    find: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: '64f1a2b3c4d5e6f7a8b9c0f1',
            name: 'Customer Test',
            email: 'customer@test.com',
            createdAt: new Date()
          }
        ])
      })
    }),
    countDocuments: jest.fn().mockResolvedValue(20)
  };
});

// Mock AdminLog model
jest.mock('../../src/models/AdminLog', () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: '64f1a2b3c4d5e6f7a8b9c0a1',
          action: 'update',
          entity: 'product',
          admin: { name: 'Super Admin' },
          performedAt: new Date(),
          status: 'success'
        }
      ])
    })
  }),
  countDocuments: jest.fn().mockResolvedValue(3),
  logAction: jest.fn().mockResolvedValue({ _id: '64f1a2b3c4d5e6f7a8b9c0a9' })
}));

// Mock emailService
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-mail-id-123' }),
  sendBulkEmail: jest.fn().mockResolvedValue([{ success: true }]),
  emailTemplates: {
    crmDeal: jest.fn().mockReturnValue({ subject: 'Special Offer from E-Shop!', html: '<p>Offer</p>' })
  }
}));

describe('AI Chat Service Unit Tests', () => {
  describe('Catalog & Product Tools', () => {
    it('searchCatalogTool should return active products and calculate discountPercent', async () => {
      const result = await aiChatService.searchCatalogTool({ inStockOnly: true });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.products[0].name).toBe('Wireless Noise Canceling Headphones');
      expect(result.products[0].discountPercent).toBeGreaterThan(0);
    });

    it('getProductDetailsTool should return full details for existing product', async () => {
      const result = await aiChatService.getProductDetailsTool({ productId: '64f1a2b3c4d5e6f7a8b9c0d1' });

      expect(result.success).toBe(true);
      expect(result.product.slug).toBe('wireless-noise-canceling-headphones');
    });

    it('compareProductsTool should require at least 2 product IDs', async () => {
      const result = await aiChatService.compareProductsTool({ productIds: ['single-id'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 2');
    });
  });

  describe('Order & Policy Tools', () => {
    it('getOrderStatusTool should return order details for authenticated user', async () => {
      const result = await aiChatService.getOrderStatusTool({
        userId: '64f1a2b3c4d5e6f7a8b9c0f1'
      });

      expect(result.success).toBe(true);
      expect(result.order.orderNumber).toBe('ORD-987654321');
      expect(result.order.status).toBe('delivered');
      expect(result.order.statusStep).toBe(4);
    });

    it('getOrderStatusTool should require auth or email when only orderNumber is provided without user', async () => {
      const result = await aiChatService.getOrderStatusTool({ orderNumber: 'ORD-987654321' });

      expect(result.success).toBe(false);
      expect(result.requiresAuth).toBe(true);
    });

    it('getStoreFaqTool should resolve shipping and returns topics accurately', async () => {
      const shippingFaq = await aiChatService.getStoreFaqTool({ topic: 'shipping' });
      expect(shippingFaq.success).toBe(true);
      expect(shippingFaq.faq.title).toContain('Shipping & Delivery');

      const returnsFaq = await aiChatService.getStoreFaqTool({ topic: 'return' });
      expect(returnsFaq.success).toBe(true);
      expect(returnsFaq.faq.title).toContain('Returns & Refund');
    });
  });

  describe('Admin Operations Tools', () => {
    it('getStoreStatsTool should return formatted store KPIs', async () => {
      const result = await aiChatService.getStoreStatsTool();

      expect(result.success).toBe(true);
      expect(result.kpis.totalSales).toBe(75000);
      expect(result.kpis.formattedSales).toContain('₹');
      expect(result.kpis.totalOrders).toBe(12);
    });

    it('getInventoryAlertsTool should categorize out of stock and critically low products', async () => {
      const result = await aiChatService.getInventoryAlertsTool({ threshold: 5 });

      expect(result.success).toBe(true);
      expect(result.totalAlerts).toBeDefined();
    });

    it('getRecentAuditLogsTool should return administrative history', async () => {
      const result = await aiChatService.getRecentAuditLogsTool({ limit: 5 });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.logs)).toBe(true);
    });

    it('draftCrmEmailTool should compose a promotional email draft with deal code and confirmation requirement', async () => {
      const result = await aiChatService.draftCrmEmailTool({
        customerEmail: 'customer@test.com',
        dealCode: 'SAVE20',
        discountPercent: 20
      });

      expect(result.success).toBe(true);
      expect(result.draft).toBeDefined();
      expect(result.draft.customerEmail).toBe('customer@test.com');
      expect(result.draft.dealCode).toBe('SAVE20');
      expect(result.draft.discountPercent).toBe(20);
      expect(result.draft.requiresConfirmation).toBe(true);
    });

    it('sendCrmEmailTool should dispatch email via emailService and record audit log', async () => {
      const result = await aiChatService.sendCrmEmailTool({
        customerEmail: 'customer@test.com',
        customerName: 'Customer Test',
        subject: 'Diwali Special Offer!',
        body: 'Enjoy 20% off with coupon SAVE20.',
        dealCode: 'SAVE20',
        discountPercent: 20,
        adminId: 'admin123',
        adminName: 'Super Admin'
      });

      expect(result.success).toBe(true);
      expect(result.customerEmail).toBe('customer@test.com');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'customer@test.com',
        'crmDeal',
        expect.objectContaining({
          dealCode: 'SAVE20',
          discountPercent: 20
        })
      );
      expect(AdminLog.logAction).toHaveBeenCalledWith(
        'admin123',
        'create',
        'user',
        expect.any(String),
        expect.objectContaining({
          type: 'crm_email',
          customerEmail: 'customer@test.com',
          dealCode: 'SAVE20'
        }),
        null,
        null
      );
    });
  });

  describe('Message Processors & Fallback Dispatches', () => {
    it('processCustomerMessage should handle greetings gracefully', async () => {
      const res = await aiChatService.processCustomerMessage({
        message: 'Hello, what can you do?',
        user: { name: 'Alice' },
        userId: 'alice123'
      });

      expect(res.reply).toBeDefined();
      expect(res.reply).toContain('E-Shop AI Shopping Assistant');
      expect(res.suggestions).toBeDefined();
    });

    it('processAdminMessage should handle KPI requests', async () => {
      const res = await aiChatService.processAdminMessage({
        message: 'Show executive KPI revenue',
        adminUser: { name: 'Admin Boss' },
        adminId: 'admin123'
      });

      expect(res.reply).toBeDefined();
      expect(res.kpis).toBeDefined();
      expect(res.reply).toContain('Executive Store Operations Summary');
    });

    it('processAdminMessage should prepare CRM promotional email draft when email intent is requested', async () => {
      const res = await aiChatService.processAdminMessage({
        message: 'Send promotional deal code SAVE30 to customer@test.com with 30% discount',
        adminUser: { name: 'Admin Boss' },
        adminId: 'admin123'
      });

      expect(res.reply).toBeDefined();
      expect(res.reply).toContain('CRM Promotional Email Draft Prepared');
      expect(res.emailDraft).toBeDefined();
      expect(res.emailDraft.customerEmail).toBe('customer@test.com');
      expect(res.emailDraft.dealCode).toBe('SAVE30');
      expect(res.emailDraft.discountPercent).toBe(30);
      expect(res.emailDraft.requiresConfirmation).toBe(true);
    });
  });
});
