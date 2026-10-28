const request = require('supertest');

jest.mock('../../src/models/Product', () => {
  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    equals: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([
      { _id: '64f1a2b3c4d5e6f7a8b9c0d1', name: 'Sample Product', price: 99 }
    ]),
    getFilter: jest.fn().mockReturnValue({ isActive: true })
  };

  return {
    find: jest.fn().mockReturnValue(mockQuery),
    countDocuments: jest.fn().mockResolvedValue(1),
    findById: jest.fn().mockImplementation((id) => {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error(`Cast to ObjectId failed for value "${id}" (type string) at path "_id" for model "Product"`);
        err.name = 'CastError';
        err.path = '_id';
        err.value = id;
        return Promise.reject(err);
      }
      return Promise.resolve(null);
    })
  };
});

const app = require('../../src/app');

describe('Products API Integration Tests', () => {
  describe('Public Product Endpoints', () => {
    it('GET /api/products should return HTTP 200 with pagination structure', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('GET /api/products/invalid_id_format should return 400 Bad Request with code: "INVALID_ID"', async () => {
      const res = await request(app).get('/api/products/invalid_mongo_id_123');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_ID');
      expect(res.body.message).toContain('Invalid _id');
    });
  });

  describe('Protected Product Mutation Endpoints (401 Unauthorized)', () => {
    it('POST /api/products without token should return 401', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product', price: 99 });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/products/:id without token should return 401', async () => {
      const res = await request(app)
        .put('/api/products/64f1a2b3c4d5e6f7a8b9c0d1')
        .send({ price: 199 });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/products/:id without token should return 401', async () => {
      const res = await request(app)
        .delete('/api/products/64f1a2b3c4d5e6f7a8b9c0d1');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
