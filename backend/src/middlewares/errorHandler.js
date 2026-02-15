const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error(`Error: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
    userId: req.userId || 'anonymous'
  });

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production error response
    if (err.isOperational) {
      // Operational, trusted error: send message to client
      res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Something went wrong'
      });
    } else {
      // Programming or unknown error: don't leak error details
      logger.error('PROGRAMMING ERROR:', err);
      
      res.status(500).json({
        success: false,
        message: 'Something went wrong'
      });
    }
  }
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(error);
};

// Handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle specific errors
const handleValidationError = (err) => {
  const message = Object.values(err.errors).map(el => el.message).join(', ');
  return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401);
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