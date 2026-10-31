const invoiceService = require('../../src/services/invoiceService');
const { downloadInvoice, calculateOrderTax } = require('../../src/controllers/orderController');
const Order = require('../../src/models/Order');

jest.mock('../../src/models/Order');

describe('Invoice Service & Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('numberToWords helper', () => {
    it('should correctly convert numbers into Indian numbering words', () => {
      expect(invoiceService.numberToWords(0)).toBe('Rupees Zero Only');
      expect(invoiceService.numberToWords(500)).toBe('Rupees Five Hundred Only');
      expect(invoiceService.numberToWords(4999)).toBe('Rupees Four Thousand Nine Hundred and Ninety Nine Only');
      expect(invoiceService.numberToWords(25000)).toBe('Rupees Twenty Five Thousand Only');
    });
  });

  describe('getHsnCode helper', () => {
    it('should map products to correct HSN / SAC codes', () => {
      expect(invoiceService.getHsnCode({ name: 'Apple iPhone 15 Pro' })).toBe('8517');
      expect(invoiceService.getHsnCode({ name: 'Cotton T-Shirt Casual' })).toBe('6109');
      expect(invoiceService.getHsnCode({ name: 'Clean Code Programming Book' })).toBe('4901');
      expect(invoiceService.getHsnCode({ name: 'Organic Face Cream' })).toBe('3304');
      expect(invoiceService.getHsnCode({ name: 'Wooden Coffee Table' })).toBe('9403');
      expect(invoiceService.getHsnCode({ name: 'Generic Gadget X' })).toBe('9983');
    });

    it('should use item.sku when prefixed with HSN-', () => {
      expect(invoiceService.getHsnCode({ sku: 'HSN-8471' })).toBe('8471');
      expect(invoiceService.getHsnCode({ sku: 'HSN-4901' })).toBe('4901');
    });
  });

  describe('calculateOrderTax statutory GST rules (Section 15(3) CGST Act)', () => {
    it('should apply 0% GST to books under HSN 4901 / book category', () => {
      const items = [{ name: 'Clean Code Book', price: 1000, quantity: 1, category: 'books' }];
      const tax = calculateOrderTax(items, 1000, 0);
      expect(tax).toBe(0);
    });

    it('should deduct trade discounts before applying tax per Section 15(3)', () => {
      // 1000 INR electronics item with 200 INR discount -> Taxable base = 800 -> 18% tax = 144
      const items = [{ name: 'Wireless Headphones', price: 1000, quantity: 1, category: 'electronics' }];
      const tax = calculateOrderTax(items, 1000, 200);
      expect(tax).toBe(144);
    });

    it('should proportionately allocate discount in mixed orders (exempt books + taxable goods)', () => {
      // Book 1000 (50%) + Headphones 1000 (50%) with 400 discount
      // Allocated discount: 200 to Book (0% tax), 200 to Headphones (taxable base 800 * 18% = 144)
      const items = [
        { name: 'Architecture Book', price: 1000, quantity: 1, category: 'books' },
        { name: 'Headphones', price: 1000, quantity: 1, category: 'electronics' }
      ];
      const tax = calculateOrderTax(items, 2000, 400);
      expect(tax).toBe(144);
    });
  });

  describe('generateInvoiceBuffer with multi-item pagination', () => {
    it('should generate a valid PDF buffer starting with %PDF- header for single-item order', async () => {
      const mockOrder = {
        orderNumber: 'ORD202611019999',
        createdAt: new Date(),
        user: { name: 'Test User', email: 'test@example.com' },
        shippingAddress: {
          street: '42 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560001',
          country: 'India',
          phone: '+91 9876543210'
        },
        items: [
          { name: 'Wireless Bluetooth Earbuds', price: 2499, quantity: 1, sku: 'AUDIO-01' }
        ],
        subtotal: 2499,
        tax: 449.82,
        shippingCost: 0,
        discount: 0,
        total: 2948.82,
        payment: {
          method: 'razorpay',
          status: 'completed',
          transactionId: 'pay_test_123',
          paidAt: new Date()
        }
      };

      const buffer = await invoiceService.generateInvoiceBuffer(mockOrder);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
    });

    it('should cleanly paginate multi-item orders (>8 items) across multiple pages without overflow', async () => {
      const items = [];
      for (let i = 1; i <= 10; i++) {
        items.push({
          name: `Product Line Item Number ${i}`,
          price: 500,
          quantity: 1,
          sku: `SKU-ITEM-${i}`,
          category: i % 2 === 0 ? 'books' : 'electronics'
        });
      }

      const multiItemOrder = {
        orderNumber: 'ORD20261101MULTI',
        createdAt: new Date(),
        user: { name: 'Enterprise Buyer', email: 'buyer@corp.com' },
        shippingAddress: {
          street: '77 Brigade Gateway',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560055',
          country: 'India',
          phone: '+91 9876543210'
        },
        items,
        subtotal: 5000,
        discount: 500,
        tax: 405,
        shippingCost: 0,
        total: 4905,
        payment: {
          method: 'razorpay',
          status: 'completed',
          transactionId: 'pay_multi_999',
          paidAt: new Date()
        }
      };

      const buffer = await invoiceService.generateInvoiceBuffer(multiItemOrder);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(5000);
      expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
    });
  });

  describe('downloadInvoice controller', () => {
    it('should return 404 if order does not exist', async () => {
      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = { params: { id: '64f1a2b3c4d5e6f7a8b9c001' }, userId: 'user123', userRole: 'user' };
      const res = {};
      const next = jest.fn();

      await downloadInvoice(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('Order not found');
    });

    it('should return 403 if requesting user is neither order owner nor admin', async () => {
      const mockOrder = {
        _id: 'order123',
        user: { _id: 'owner456', name: 'Real Owner' }
      };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      const req = { params: { id: 'order123' }, userId: 'intruder789', userRole: 'user' };
      const res = {};
      const next = jest.fn();

      await downloadInvoice(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('do not have permission');
    });

    it('should set PDF headers and stream invoice when user is order owner', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD202611018888',
        user: { _id: 'user123', name: 'Authorized User' },
        shippingAddress: { city: 'Delhi', state: 'Delhi', zipCode: '110001' },
        items: [{ name: 'Test Product', price: 500, quantity: 1 }],
        subtotal: 500,
        tax: 90,
        total: 590,
        payment: { method: 'cod', status: 'pending' }
      };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrder)
      });

      const req = { params: { id: 'order123' }, userId: 'user123', userRole: 'user' };
      const res = {
        setHeader: jest.fn()
      };
      const next = jest.fn();

      jest.spyOn(invoiceService, 'generateInvoice').mockImplementation(async (order, stream) => {
        return Promise.resolve();
      });

      await downloadInvoice(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="Invoice-ORD202611018888.pdf"'
      );
      expect(invoiceService.generateInvoice).toHaveBeenCalledWith(mockOrder, res);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
