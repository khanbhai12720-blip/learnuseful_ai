const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        activityType: {
            type: String,
            enum: [
                'login',
                'logout',
                'signup',
                'password_change',
                'email_change',
                'payment_success',
                'payment_failed',
                'api_call',
                'suspicious_activity',
                'account_locked'
            ],
            required: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        severity: {
            type: String,
            enum: ['info', 'warning', 'critical'],
            default: 'info'
        },
        ipAddress: String,
        userAgent: String,
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

// Create index for fast queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ activityType: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);