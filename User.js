const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String },
        email: { type: String, lowercase: true, index: true },
        passwordHash: { type: String },
        phone: String,
        educationLevel: String,
        targetExam: String,
        preferredLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
        preferredLanguage: { type: String, enum: ['english', 'hindi', 'both'] },
        bilingual: { type: Boolean, default: false },
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
        planExpiresAt: Date,
        credits: { type: Number, default: 10 },
        subscriptionStatus: { type: String, default: 'inactive' },
        lastPaymentDate: Date,
        role: { type: String, enum: ['student', 'admin'], default: 'student' },
        isActive: { type: Boolean, default: true },
        emailVerified: { type: Boolean, default: false },
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorVerified: { type: Boolean, default: false },
        failedLoginAttempts: { type: Number, default: 0 },
        accountLockedUntil: Date,
        lastFailedLoginAt: Date,
        lastLoginIp: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
