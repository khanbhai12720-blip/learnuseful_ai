const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../config/constants');

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            errors: errors.array()
        });
    }
    return next();
};

module.exports = {
    validateRequest
};
