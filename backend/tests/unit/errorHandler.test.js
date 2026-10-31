const {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  handleCastError,
  handleDuplicateFields,
  handleValidationError,
  handleJWTError,
  handleJWTExpiredError
} = require('../../src/middlewares/errorHandler');

describe('Error Handling Middleware (backend/src/middlewares/errorHandler.js)', () => {
  describe('AppError Class', () => {
    it('should create operational error instance with correct status and code', () => {
      const err = new AppError('Resource not found', 404, 'NOT_FOUND');
      expect(err.message).toBe('Resource not found');
      expect(err.statusCode).toBe(404);
      expect(err.status).toBe('fail');
      expect(err.isOperational).toBe(true);
      expect(err.code).toBe('NOT_FOUND');
    });

    it('should assign status "error" for 500 status codes', () => {
      const err = new AppError('Server explosion', 500);
      expect(err.status).toBe('error');
    });
  });

  describe('Operational Error Handlers', () => {
    it('handleCastError should return 400 AppError with INVALID_ID', () => {
      const mockCast = { path: '_id', value: 'bad_id' };
      const result = handleCastError(mockCast);

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('INVALID_ID');
      expect(result.message).toContain('Invalid _id: bad_id');
      expect(result.isOperational).toBe(true);
    });

    it('handleDuplicateFields should format keyValue into 400 AppError with DUPLICATE_FIELD', () => {
      const mockDup = {
        code: 11000,
        keyValue: { email: 'duplicate@test.com' }
      };
      const result = handleDuplicateFields(mockDup);

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('DUPLICATE_FIELD');
      expect(result.message).toContain('duplicate@test.com');
    });

    it('handleDuplicateFields should handle fallback errmsg without crashing', () => {
      const mockDup = {
        code: 11000,
        errmsg: 'E11000 duplicate key error collection: index: email_1 dup key: { email: "fallback@test.com" }'
      };
      const result = handleDuplicateFields(mockDup);

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('DUPLICATE_FIELD');
    });

    it('handleValidationError should extract all field messages into 400 AppError with errors dictionary', () => {
      const mockValidation = {
        name: 'ValidationError',
        errors: {
          name: { message: 'Product name is required' },
          price: { message: 'Price must be greater than zero' }
        }
      };
      const result = handleValidationError(mockValidation);

      expect(result.statusCode).toBe(400);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('Product name is required');
      expect(result.message).toContain('Price must be greater than zero');
      expect(result.errors.name).toBe('Product name is required');
      expect(result.errors.price).toBe('Price must be greater than zero');
    });

    it('handleJWTError should return 401 AppError with INVALID_TOKEN', () => {
      const result = handleJWTError();
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe('INVALID_TOKEN');
      expect(result.message).toContain('Invalid token');
    });

    it('handleJWTExpiredError should return 401 AppError with TOKEN_EXPIRED', () => {
      const result = handleJWTExpiredError();
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe('TOKEN_EXPIRED');
      expect(result.message).toContain('expired');
    });
  });

  describe('catchAsync Wrapper', () => {
    it('should catch rejected promises and forward error to next()', async () => {
      const testError = new Error('Async explosion');
      const asyncFn = async () => { throw testError; };
      const wrapped = catchAsync(asyncFn);

      const nextMock = jest.fn();
      await wrapped({}, {}, nextMock);

      expect(nextMock).toHaveBeenCalledWith(testError);
    });
  });

  describe('notFound Middleware', () => {
    it('should call next with 404 AppError', () => {
      const nextMock = jest.fn();
      notFound({ originalUrl: '/api/unknown' }, {}, nextMock);

      expect(nextMock).toHaveBeenCalled();
      const err = nextMock.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
    });
  });

  describe('errorHandler Response Formatting', () => {
    function createMockRes() {
      const res = {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; }
      };
      return res;
    }

    it('should format operational error cleanly in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = createMockRes();
      const err = new AppError('Payment processing failed', 400, 'PAYMENT_FAILED');
      errorHandler(err, { originalUrl: '/api/pay', method: 'POST' }, mockRes, () => {});

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.body.success).toBe(false);
      expect(mockRes.body.message).toBe('Payment processing failed');
      expect(mockRes.body.code).toBe('PAYMENT_FAILED');
      expect(mockRes.body.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should format MulterError LIMIT_FILE_SIZE as 400 operational error', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = createMockRes();
      const multerErr = new Error('File too large');
      multerErr.name = 'MulterError';
      multerErr.code = 'LIMIT_FILE_SIZE';
      errorHandler(multerErr, { originalUrl: '/api/products/visual-search', method: 'POST' }, mockRes, () => {});

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.body.success).toBe(false);
      expect(mockRes.body.message).toContain('File size exceeds');
      expect(mockRes.body.code).toBe('FILE_UPLOAD_ERROR');

      process.env.NODE_ENV = originalEnv;
    });

    it('should format invalid file type error as 400 operational error', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = createMockRes();
      const typeErr = new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP images are allowed.');
      errorHandler(typeErr, { originalUrl: '/api/products/visual-search', method: 'POST' }, mockRes, () => {});

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.body.success).toBe(false);
      expect(mockRes.body.message).toContain('Invalid file type');
      expect(mockRes.body.code).toBe('INVALID_FILE_TYPE');

      process.env.NODE_ENV = originalEnv;
    });

    it('should disguise non-operational programming errors with 500 in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = createMockRes();
      const programmingErr = new TypeError('Cannot read property of undefined');
      errorHandler(programmingErr, { originalUrl: '/api/bug', method: 'GET' }, mockRes, () => {});

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.body.success).toBe(false);
      expect(mockRes.body.message).toBe('Something went wrong');
      expect(mockRes.body.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
