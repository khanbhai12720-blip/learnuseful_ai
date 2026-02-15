const express = require('express');

const router = express.Router();

// Basic placeholder auth routes to avoid server errors while you implement full logic
router.post('/signup', (req, res) => {
	res.status(501).json({ success: false, message: 'Signup not implemented yet' });
});

router.post('/login', (req, res) => {
	res.status(501).json({ success: false, message: 'Login not implemented yet' });
});

router.post('/refresh', (req, res) => {
	res.status(501).json({ success: false, message: 'Token refresh not implemented yet' });
});

module.exports = router;
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Register
router.post(
    '/register',
    authLimiter,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validateRequest,
    authController.register
);

// Login
router.post(
    '/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validateRequest,
    authController.login
);

// Current user
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
