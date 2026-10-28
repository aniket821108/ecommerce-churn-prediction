const jwt    = require('jsonwebtoken');
const logger = require('./logger');

const ACCESS_EXPIRE  = process.env.JWT_ACCESS_EXPIRE  || '15m';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Get JWT Access Secret
 */
const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: JWT_ACCESS_SECRET is not configured in production!');
    }
    return 'fallback-dev-access-secret';
  }
  return secret;
};

/**
 * Get JWT Refresh Secret
 */
const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: JWT_REFRESH_SECRET is not configured in production!');
    }
    return 'fallback-dev-refresh-secret';
  }
  return secret;
};

/**
 * Sign an Access Token
 * Payload: { id, tokenVersion, type: 'access', ...extraClaims }
 *
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {number} [tokenVersion=0]
 * @param {object} [extraClaims={}]
 * @returns {string} JWT access token string
 */
const signAccessToken = (id, tokenVersion = 0, extraClaims = {}) => {
  return jwt.sign(
    {
      id: id ? id.toString() : undefined,
      tokenVersion: typeof tokenVersion === 'number' ? tokenVersion : 0,
      type: 'access',
      ...extraClaims
    },
    getAccessSecret(),
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || ACCESS_EXPIRE }
  );
};

/**
 * Sign a Refresh Token
 * Payload: { id, tokenVersion, type: 'refresh' }
 *
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {number} [tokenVersion=0]
 * @returns {string} JWT refresh token string
 */
const signRefreshToken = (id, tokenVersion = 0) => {
  return jwt.sign(
    {
      id: id ? id.toString() : undefined,
      tokenVersion: typeof tokenVersion === 'number' ? tokenVersion : 0,
      type: 'refresh'
    },
    getRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || REFRESH_EXPIRE }
  );
};

/**
 * Verify an Access Token
 * Throws JsonWebTokenError or TokenExpiredError on failure
 *
 * @param {string} token
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

/**
 * Verify a Refresh Token
 * Throws JsonWebTokenError or TokenExpiredError on failure
 *
 * @param {string} token
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

// ── Backward-compatible Aliases ─────────────────────────
const generateToken = (userId, roleOrVersion, extra) => {
  const tokenVersion = typeof roleOrVersion === 'number' ? roleOrVersion : 0;
  const extraClaims = typeof roleOrVersion === 'string' ? { role: roleOrVersion, ...extra } : (extra || {});
  return signAccessToken(userId, tokenVersion, extraClaims);
};

const generateRefreshToken = (userId, tokenVersion = 0) => {
  return signRefreshToken(userId, tokenVersion);
};

const verifyToken = (token) => {
  try {
    return verifyAccessToken(token);
  } catch (err) {
    return null;
  }
};

module.exports = {
  getAccessSecret,
  getRefreshSecret,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateToken,
  generateRefreshToken,
  verifyToken
};