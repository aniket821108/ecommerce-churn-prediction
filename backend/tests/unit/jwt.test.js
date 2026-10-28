const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateToken,
  generateRefreshToken,
  verifyToken,
  getAccessSecret,
  getRefreshSecret
} = require('../../src/utils/jwt');
const jwt = require('jsonwebtoken');

describe('JWT Utility Module (backend/src/utils/jwt.js)', () => {
  const mockUserId = '64f1a2b3c4d5e6f7a8b9c0d1';

  describe('Secrets Configuration', () => {
    it('should return valid access secret string', () => {
      const secret = getAccessSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should return valid refresh secret string', () => {
      const secret = getRefreshSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });
  });

  describe('signAccessToken & verifyAccessToken', () => {
    it('should sign access token with standard payload claims { id, tokenVersion, type }', () => {
      const token = signAccessToken(mockUserId, 3);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(mockUserId);
      expect(decoded.tokenVersion).toBe(3);
      expect(decoded.type).toBe('access');
      expect(decoded.exp).toBeDefined();
    });

    it('should support extraClaims when signing access tokens', () => {
      const token = signAccessToken(mockUserId, 0, { role: 'admin' });
      const decoded = verifyAccessToken(token);
      expect(decoded.role).toBe('admin');
      expect(decoded.type).toBe('access');
    });

    it('should throw TokenExpiredError when verifying an expired access token', () => {
      const expiredToken = jwt.sign(
        { id: mockUserId, tokenVersion: 0, type: 'access' },
        getAccessSecret(),
        { expiresIn: '-1s' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow();
      try {
        verifyAccessToken(expiredToken);
      } catch (err) {
        expect(err.name).toBe('TokenExpiredError');
      }
    });

    it('should throw JsonWebTokenError when verifying a tampered token', () => {
      const token = signAccessToken(mockUserId, 0);
      const tampered = token.slice(0, -6) + 'abcdef';

      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('signRefreshToken & verifyRefreshToken', () => {
    it('should sign refresh token with type: "refresh"', () => {
      const token = signRefreshToken(mockUserId, 1);
      const decoded = verifyRefreshToken(token);

      expect(decoded.id).toBe(mockUserId);
      expect(decoded.tokenVersion).toBe(1);
      expect(decoded.type).toBe('refresh');
    });

    it('should fail verification if refresh token is verified with access secret', () => {
      // If access and refresh secrets are distinct, cross verification fails
      if (getAccessSecret() !== getRefreshSecret()) {
        const refreshToken = signRefreshToken(mockUserId, 1);
        expect(() => verifyAccessToken(refreshToken)).toThrow();
      }
    });
  });

  describe('Backward Compatibility Aliases', () => {
    it('generateToken should produce valid verifiable access token', () => {
      const token = generateToken(mockUserId, 'customer');
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(mockUserId);
    });

    it('verifyToken should return decoded object or null on error', () => {
      const valid = signAccessToken(mockUserId);
      expect(verifyToken(valid)).not.toBeNull();
      expect(verifyToken('invalid.token.string')).toBeNull();
    });
  });
});
