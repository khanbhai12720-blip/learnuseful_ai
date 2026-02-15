const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Get all available plans
router.get('/plans', paymentController.getPlans);

// Start payment process
router.post('/start', authMiddleware, paymentController.startPayment);

// Verify payment and create subscription
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// Webhook for Razorpay
router.post('/webhook', paymentController.handleWebhook);

// Get user subscription details
router.get('/subscription', authMiddleware, paymentController.getUserSubscription);

// Get user invoices
router.get('/invoices', authMiddleware, paymentController.getUserInvoices);

// Download invoice
router.get('/invoices/:invoiceId/download', authMiddleware, paymentController.downloadInvoice);

// Buy credits (one-time)
router.post('/credits/buy', authMiddleware, paymentController.buyCredits);

// Verify credit purchase
router.post('/credits/verify', authMiddleware, paymentController.verifyCreditPurchase);

module.exports = router;