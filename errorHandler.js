const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

// ========================================
// CENTRALIZED ERROR HANDLER
// ========================================

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', err);

    // Default error
    let statusCode = HTTP_STATUS.INTERNAL_ERROR;
    let message = 'Internal Server Error';
    let details = {};

    // Validation Error
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = 'Validation Error';
        details = err.details || {};
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        statusCode = HTTP_STATUS.CONFLICT;
        message = 'Email already registered';
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Token has expired';
    }

    // Custom Error
    if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        details: process.env.NODE_ENV === 'development' ? details : {}
    });
};

module.exports = {
    errorHandler
};