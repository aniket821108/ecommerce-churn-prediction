const {
  isValidObjectId,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePrice,
  validateQuantity,
  validatePINCode,
  sanitizeInput,
  sanitizeObject
} = require('../../src/utils/validators');

describe('Validation Utility Module (backend/src/utils/validators.js)', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid 24-character hexadecimal ObjectId', () => {
      expect(isValidObjectId('64f1a2b3c4d5e6f7a8b9c0d1')).toBe(true);
    });

    it('should return false for invalid strings', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId('12345')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid standard email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('customer.name+tag@sub.domain.co')).toBe(true);
    });

    it('should reject malformed email strings', () => {
      expect(validateEmail('plainaddress')).toBe(false);
      expect(validateEmail('@missingusername.com')).toBe(false);
      expect(validateEmail('user@.missingdomain.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid 10-digit Indian phone numbers starting with 6-9', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('8123456789')).toBe(true);
      expect(validatePhone('7000000000')).toBe(true);
      expect(validatePhone('6999999999')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(false); // starts with 1
      expect(validatePhone('98765')).toBe(false); // too short
      expect(validatePhone('987654321000')).toBe(false); // too long
      expect(validatePhone('abcdefghij')).toBe(false); // non-numeric
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords meeting all requirements', () => {
      const result = validatePassword('SecureP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBeNull();
      expect(result.errors.uppercase).toBeNull();
      expect(result.errors.lowercase).toBeNull();
      expect(result.errors.numbers).toBeNull();
      expect(result.errors.specialChar).toBeNull();
    });

    it('should reject weak passwords and identify missing criteria', () => {
      const short = validatePassword('Sh1!');
      expect(short.isValid).toBe(false);
      expect(short.errors.length).not.toBeNull();

      const noSpecial = validatePassword('Password123');
      expect(noSpecial.isValid).toBe(false);
      expect(noSpecial.errors.specialChar).not.toBeNull();

      const noUpper = validatePassword('password123!');
      expect(noUpper.isValid).toBe(false);
      expect(noUpper.errors.uppercase).not.toBeNull();
    });
  });

  describe('validatePrice & validateQuantity', () => {
    it('should validate non-negative numerical prices', () => {
      expect(validatePrice(0)).toBe(true);
      expect(validatePrice(199.99)).toBe(true);
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });

    it('should validate positive integer quantities within bounds', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(50)).toBe(true);
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-5)).toBe(false);
      expect(validateQuantity(1.5)).toBe(false);
      expect(validateQuantity(2000)).toBe(false);
    });
  });

  describe('validatePINCode', () => {
    it('should accept valid 6-digit Indian PIN codes', () => {
      expect(validatePINCode('110001')).toBe(true);
      expect(validatePINCode('560001')).toBe(true);
      expect(validatePINCode('010001')).toBe(false); // cannot start with 0
      expect(validatePINCode('11001')).toBe(false); // 5 digits
    });
  });

  describe('sanitizeInput & sanitizeObject', () => {
    it('should escape HTML tags to mitigate XSS attacks', () => {
      const dirty = '<script>alert("xss")</script>';
      const clean = sanitizeInput(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('&lt;script&gt;');
    });

    it('should sanitize nested objects recursively', () => {
      const input = {
        name: '<b>John</b>',
        profile: {
          bio: '<img src=x onerror=alert(1)>'
        }
      };
      const sanitized = sanitizeObject(input);
      expect(sanitized.name).toContain('&lt;b&gt;');
      expect(sanitized.profile.bio).toContain('&lt;img');
    });
  });
});
