const request = require('supertest');
const app = require('../../src/app');

describe('Admin Logs & System Utilities Integration Tests', () => {
  describe('Admin Authentication Guarding (401 Unauthorized)', () => {
    it('GET /api/admin/logs without token should return 401', async () => {
      const res = await request(app).get('/api/admin/logs');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/system/metrics without token should return 401', async () => {
      const res = await request(app).get('/api/admin/system/metrics');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/system/clear-cache without token should return 401', async () => {
      const res = await request(app).post('/api/admin/system/clear-cache');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/system/notification without token should return 401', async () => {
      const res = await request(app)
        .post('/api/admin/system/notification')
        .send({ message: 'System alert' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/admin/system/backup without token should return 401', async () => {
      const res = await request(app).post('/api/admin/system/backup');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
