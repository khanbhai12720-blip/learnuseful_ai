const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Invoice = require('../models/Invoice');
const InvoiceGenerator = require('../utils/invoiceGenerator');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ========================================
// GET ALL PLANS
// ========================================

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true });
        res.json({
            success: true,
            plans
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// START PAYMENT / CREATE RAZORPAY ORDER
// ========================================

exports.startPayment = async (req, res) => {
    try {
        const { planId, billingCycle = 'monthly' } = req.body;
        const userId = req.user.id;

        // Validate plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Get price based on billing cycle
        const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1, // Auto-capture payment
            notes: {
                userId: userId,
                planId: planId,
                planName: plan.name
            }
        });

        // Save order temporarily (you might want to store this)
        res.json({
            success: true,
            orderId: order.id,
            amount: amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: plan.name,
            billingCycle
        });
    } catch (error) {
        console.error('Payment start error:', error);
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// VERIFY PAYMENT & CREATE SUBSCRIPTION
// ========================================

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, planId, billingCycle = 'monthly' } = req.body;
        const userId = req.user.id;

        // Verify signature
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Get plan details
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate expiry date
        const expiryDays = billingCycle === 'yearly' ? 365 : 30;
        const planExpiresAt = new Date();
        planExpiresAt.setDate(planExpiresAt.getDate() + expiryDays);

        // Update user subscription
        user.planId = planId;
        user.planExpiresAt = planExpiresAt;
        user.credits = plan.creditsMonthly;
        user.subscriptionStatus = 'active';
        user.lastPaymentDate = new Date();
        await user.save();

        // Create invoice
        const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
        const invoice = new Invoice({
            userId: userId,
            planId: planId,
            amount: amount,
            status: 'Paid',
            paymentMethod: 'Razorpay',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            description: `${plan.name} Plan - ${billingCycle} billing`,
            billingPeriod: {
                startDate: new Date(),
                endDate: planExpiresAt
            },
            items: [
                {
                    name: `${plan.name} Plan (${billingCycle})`,
                    quantity: 1,
                    price: amount,
                    total: amount
                }
            ],
            paidAt: new Date()
        });

        await invoice.save();

        // Generate invoice PDF
        try {
            const invoicePath = await InvoiceGenerator.generateInvoice(invoice, user);
            invoice.pdfPath = invoicePath;
            invoice.invoiceUrl = `/invoices/${invoice._id}`;
            await invoice.save();
        } catch (pdfError) {
            console.error('Invoice generation error:', pdfError);
            // Continue even if PDF generation fails
        }

        res.json({
            success: true,
            message: 'Payment successful',
            invoiceId: invoice._id,
            planExpiresAt: planExpiresAt,
            creditsAdded: plan.creditsMonthly
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// PAYMENT WEBHOOK (from Razorpay)
// ========================================

exports.handleWebhook = async (req, res) => {
    try {
        const { event, payload } = req.body;

        // Verify webhook signature
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(payload);
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Webhook verification failed'
            });
        }

        // Handle payment success
        if (event === 'payment.authorized') {
            const { receipt, notes } = payload.payment.entity;
            // Additional processing if needed
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET USER SUBSCRIPTION
// ========================================

exports.getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate('planId');

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            subscription: {
                planId: user.planId?._id,
                planName: user.planId?.name,
                credits: user.credits,
                expiresAt: user.planExpiresAt,
                status: user.subscriptionStatus,
                isExpired: user.planExpiresAt < new Date()
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET USER INVOICES
// ========================================

exports.getUserInvoices = async (req, res) => {
    try {
        const userId = req.user.id;
        const invoices = await Invoice.find({ userId })
            .populate('planId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            invoices
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// DOWNLOAD INVOICE
// ========================================

exports.downloadInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check permission
        if (invoice.userId.toString() !== req.user.id.toString()) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Send file
        res.download(invoice.pdfPath, `Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// BUY CREDITS (One-time purchase)
// ========================================

exports.buyCredits = async (req, res) => {
    try {
        const { creditsAmount = 100 } = req.body;
        const userId = req.user.id;

        // Credit pricing (example: 1 credit = 0.5 INR)
        const pricePerCredit = 0.5;
        const totalPrice = creditsAmount * pricePerCredit;

        // Create Razorpay order for credits
        const order = await razorpay.orders.create({
            amount: totalPrice * 100,
            currency: 'INR',
            receipt: `credits_${Date.now()}`,
            notes: {
                userId: userId,
                credits: creditsAmount,
                type: 'credit-purchase'
            }
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: totalPrice,
            credits: creditsAmount,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// VERIFY CREDIT PURCHASE
// ========================================

exports.verifyCreditPurchase = async (req, res) => {
    try {
        const { orderId, paymentId, signature, credits } = req.body;
        const userId = req.user.id;

        // Verify signature
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Add credits to user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        user.credits += credits;
        await user.save();

        // Create invoice for credit purchase
        const invoice = new Invoice({
            userId: userId,
            amount: credits * 0.5,
            status: 'Paid',
            paymentMethod: 'Razorpay',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            description: `${credits} Credits Purchase`,
            items: [
                {
                    name: `${credits} Credits`,
                    quantity: 1,
                    price: credits * 0.5,
                    total: credits * 0.5
                }
            ],
            paidAt: new Date()
        });

        await invoice.save();

        res.json({
            success: true,
            message: 'Credits added successfully',
            creditsAdded: credits,
            newBalance: user.credits,
            invoiceId: invoice._id
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};