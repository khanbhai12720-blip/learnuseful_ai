const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { HTTP_STATUS } = require('../config/constants');

// ========================================
// SECURITY AUDIT & MONITORING
// ========================================

/**
 * Log suspicious activity
 */
exports.logSuspiciousActivity = async (userId, activityType, details) => {
    try {
        await AuditLog.create({
            userId,
            activityType,
            details,
            severity: 'warning',
            timestamp: new Date(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent
        });

        // If too many suspicious activities, lock account
        const recentActivities = await AuditLog.countDocuments({
            userId,
            timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

        if (recentActivities > 10) {
            const lockDuration = 30 * 60 * 1000; // 30 minutes
            await User.findByIdAndUpdate(userId, {
                accountLockedUntil: new Date(Date.now() + lockDuration)
            });
        }
    } catch (error) {
        console.error('Error logging suspicious activity:', error);
    }
};

/**
 * Track failed login attempts
 */
exports.trackFailedLogin = async (email, ipAddress) => {
    try {
        const user = await User.findOne({ email });
        if (!user) return;

        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        user.lastFailedLoginAt = new Date();
        user.lastLoginIp = ipAddress;

        if (user.failedLoginAttempts >= 5) {
            user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await user.save();
    } catch (error) {
        console.error('Error tracking failed login:', error);
    }
};

/**
 * Reset failed login attempts on successful login
 */
exports.resetFailedLoginAttempts = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            failedLoginAttempts: 0,
            accountLockedUntil: null
        });
    } catch (error) {
        console.error('Error resetting failed login:', error);
    }
};

/**
 * Get audit logs for admin
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const { userId, startDate, endDate, activityType } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;
        if (activityType) filter.activityType = activityType;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(1000);

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Generate security report
 */
exports.getSecurityReport = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const suspiciousActivities = await AuditLog.countDocuments({
            timestamp: { $gte: thirtyDaysAgo },
            severity: 'warning'
        });

        const failedLogins = await User.countDocuments({
            lastFailedLoginAt: { $gte: thirtyDaysAgo }
        });

        const lockedAccounts = await User.countDocuments({
            accountLockedUntil: { $gt: new Date() }
        });

        res.json({
            success: true,
            report: {
                period: '30 days',
                suspiciousActivities,
                failedLogins,
                lockedAccounts,
                recommendations: []
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};