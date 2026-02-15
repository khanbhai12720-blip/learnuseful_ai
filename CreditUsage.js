const mongoose = require('mongoose');

const creditUsageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        creditsSpent: {
            type: Number,
            required: true,
            default: 1
        },
        action: {
            type: String,
            enum: ['Ask Question', 'Generate Practice', 'Mock Test', 'Premium Feature'],
            default: 'Ask Question'
        },
        subject: String,
        examType: String,
        description: String,
        balanceBefore: Number,
        balanceAfter: Number,
        usedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

// Create index for analytics queries
creditUsageSchema.index({ userId: 1, usedAt: -1 });
creditUsageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CreditUsage', creditUsageSchema);