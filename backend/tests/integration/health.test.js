const request = require('supertest');
const app = require('../../src/app');

describe('Health & Not Found Integration Tests', () => {
  it('GET /health should return 200 with status: "healthy"', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.memory).toBeDefined();
  });

  it('GET /api/non-existent-endpoint should return 404 with NOT_FOUND', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toContain('Can\'t find');
  });
});
