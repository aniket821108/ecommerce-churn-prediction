const invoiceService = require('../../src/services/invoiceService');
const { downloadInvoice } = require('../../src/controllers/orderController');
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
    });
  });

  describe('generateInvoiceBuffer', () => {
    it('should generate a valid PDF buffer starting with %PDF- header', async () => {
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
