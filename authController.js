const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { HTTP_STATUS } = require('../config/constants');
const securityController = require('./securityController');

const generateToken = (user) => {
    const payload = {
        id: user._id,
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

const safeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    credits: user.credits,
    planId: user.planId,
    planExpiresAt: user.planExpiresAt,
    preferredLanguage: user.preferredLanguage,
    preferredLevel: user.preferredLevel,
    subscriptionStatus: user.subscriptionStatus
});

const ensureFreePlan = async () => {
    let plan = await Plan.findOne({ name: 'Free' });
    if (!plan) {
        plan = await Plan.create({
            name: 'Free',
            description: 'Free starter plan',
            monthlyPrice: 0,
            yearlyPrice: 0,
            creditsMonthly: 10,
            features: ['Basic AI', 'Limited questions'],
            isActive: true
        });
    }
    return plan;
};

// ========================================
// REGISTER
// ========================================

exports.register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            educationLevel,
            targetExam,
            preferredLanguage,
            preferredLevel,
            bilingual
        } = req.body;

        if (!name || !email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const freePlan = await ensureFreePlan();

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            educationLevel,
            targetExam,
            preferredLanguage,
            preferredLevel,
            bilingual: Boolean(bilingual),
            planId: freePlan?._id,
            credits: freePlan?.creditsMonthly || 10,
            subscriptionStatus: 'active'
        });

        const token = generateToken(user);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            token,
            user: safeUser(user)
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// LOGIN
// ========================================

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
        if (!user) {
            await securityController.trackFailedLogin(email, req.ip);
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Account locked. Please try again later.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            await securityController.trackFailedLogin(email, req.ip);
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        await securityController.resetFailedLoginAttempts(user._id);

        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: safeUser(user)
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET CURRENT USER
// ========================================

exports.getMe = async (req, res) => {
    res.json({
        success: true,
        user: safeUser(req.user)
    });
};
