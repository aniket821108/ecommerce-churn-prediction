const jwt = require('jsonwebtoken');

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-dev-access-secret';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-dev-refresh-secret';

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    getAccessSecret(),
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    getRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken };