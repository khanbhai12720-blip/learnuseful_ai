const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: ['Free', 'Starter', 'Pro', 'Elite']
        },
        description: String,
        monthlyPrice: {
            type: Number,
            default: 0 // 0 for free plan
        },
        yearlyPrice: {
            type: Number,
            default: 0
        },
        creditsMonthly: {
            type: Number,
            required: true,
            default: 10 // Free gets 10 credits/month
        },
        features: [String], // e.g., ['Basic AI', 'Limited questions', 'No support']
        prioritySupport: {
            type: Boolean,
            default: false
        },
        customization: {
            type: Boolean,
            default: false
        },
        analytics: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'yearly', 'lifetime'],
            default: 'monthly'
        },
        razorpayPlanId: String, // For Razorpay subscriptions
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);