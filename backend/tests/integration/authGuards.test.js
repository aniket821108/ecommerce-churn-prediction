const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const { getAccessSecret } = require('../../src/utils/jwt');

describe('Authentication & Route Protection Integration Tests', () => {
  describe('Unauthenticated Protection (401 Unauthorized)', () => {
    it('GET /api/auth/me without token should return 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authenticate');
    });

    it('GET /api/cart without token should return 401', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/orders without token should return 401', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/dashboard without token should return 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Invalid & Expired Token Rejection', () => {
    it('GET /api/auth/me with malformed Bearer token should return 401 "Invalid token"', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid token');
    });

    it('GET /api/auth/me with expired token should return 401 with code: "TOKEN_EXPIRED"', async () => {
      const expiredToken = jwt.sign(
        { id: '64f1a2b3c4d5e6f7a8b9c0d1', tokenVersion: 0, type: 'access' },
        getAccessSecret(),
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Public Auth Validation Endpoints', () => {
    it('POST /api/auth/login without credentials should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email and password are required');
    });

    it('POST /api/auth/login with malformed email should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Password123@' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email format');
    });

    it('POST /api/auth/send-otp with missing fields should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'valid@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('All fields are required');
    });

    it('POST /api/auth/refresh-token without cookie should return 401 with code: "NO_REFRESH"', async () => {
      const res = await request(app).post('/api/auth/refresh-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('NO_REFRESH');
    });
  });
});
