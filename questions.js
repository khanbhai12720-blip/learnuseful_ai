const express = require('express');

const router = express.Router();

// Placeholder endpoints for questions/chat functionality
router.post('/ask', (req, res) => {
	res.status(501).json({ success: false, message: 'Ask question endpoint not implemented yet' });
});

router.get('/usage', (req, res) => {
	res.status(501).json({ success: false, message: 'Credit usage endpoint not implemented yet' });
});

module.exports = router;
const express = require('express');
const { body, query } = require('express-validator');
const questionController = require('../controllers/questionController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Ask question (AI)
router.post(
    '/ask',
    authMiddleware,
    apiLimiter,
    [
        body('question').trim().notEmpty().withMessage('Question is required'),
        body('language').optional().isIn(['english', 'hindi', 'both']),
        body('level').optional().isIn(['beginner', 'intermediate', 'advanced'])
    ],
    validateRequest,
    questionController.askQuestion
);

// Credit usage analytics
router.get(
    '/usage',
    authMiddleware,
    [query('days').optional().isInt({ min: 1, max: 365 })],
    validateRequest,
    questionController.getCreditUsage
);

module.exports = router;
