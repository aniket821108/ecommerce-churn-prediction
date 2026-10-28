const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (code) this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Specific operational error mappers ─────────────────
const handleValidationError = (err) => {
  const errors = Object.keys(err.errors || {}).reduce((acc, key) => {
    acc[key] = err.errors[key].message;
    return acc;
  }, {});
  const message = Object.values(err.errors || {}).map(el => el.message).join(', ') || 'Validation failed';
  const appError = new AppError(message, 400, 'VALIDATION_ERROR');
  appError.errors = errors;
  return appError;
};

const handleDuplicateFields = (err) => {
  let value = '';
  if (err.keyValue) {
    const keys = Object.keys(err.keyValue);
    value = keys.map(k => `${k}: "${err.keyValue[k]}"`).join(', ');
  } else if (err.errmsg) {
    const match = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    value = match ? match[0] : '';
  } else if (err.message) {
    const match = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    value = match ? match[0] : '';
  }
  const message = value
    ? `Duplicate field value: ${value}. Please use another value`
    : 'Duplicate field value entered. Please use another value';
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path || 'id'}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');
};

// ── Error handling middleware ─────────────────────────
const errorHandler = (err, req, res, next) => {
  // Automatically clean up any temporary files uploaded in this request
  if (req.file || req.files) {
    try {
      const { cleanupFiles } = require('../utils/fileUtils');
      cleanupFiles(req.file || req.files);
    } catch (cleanupErr) {
      logger.error('Failed to clean up files in error handler:', cleanupErr);
    }
  }

  // Intercept and map known Mongoose, MongoDB, and JWT operational errors
  let error = err;

  if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFields(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  error.statusCode = error.statusCode || err.statusCode || 500;
  error.status = error.status || err.status || (`${error.statusCode}`.startsWith('4') ? 'fail' : 'error');

  // Log error: warn for 4xx client errors, error for 5xx/internal errors
  const logData = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    statusCode: error.statusCode,
    userId: req.userId || 'anonymous'
  };

  if (error.statusCode >= 500) {
    logger.error(`Server Error [500]: ${error.message || err.message}`, { ...logData, stack: err.stack });
  } else {
    logger.warn(`Client Error [${error.statusCode}]: ${error.message}`, logData);
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message || err.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.errors ? { errors: error.errors } : {}),
      error: err,
      stack: err.stack
    });
  } else {
    // Production error response
    if (error.isOperational) {
      const response = {
        success: false,
        message: error.message || 'Something went wrong'
      };
      if (error.code) response.code = error.code;
      if (error.errors) response.errors = error.errors;

      res.status(error.statusCode).json(response);
    } else {
      logger.error('PROGRAMMING ERROR (NON-OPERATIONAL):', err);

      res.status(500).json({
        success: false,
        message: 'Something went wrong'
      });
    }
  }
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server`, 404, 'NOT_FOUND');
  next(error);
};

// Handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync,
  handleValidationError,
  handleDuplicateFields,
  handleCastError,
  handleJWTError,
  handleJWTExpiredError
};