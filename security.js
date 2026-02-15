// ========================================
// SECURITY CONFIGURATION
// ========================================

const securityConfig = {
    // ========================================
    // 1. PASSWORD SECURITY
    // ========================================
    password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90, // Force password change every 90 days
        historyCount: 5 // Don't allow reuse of last 5 passwords
    },

    // ========================================
    // 2. JWT SECURITY
    // ========================================
    jwt: {
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        algorithm: 'HS256',
        issuer: 'eduai-platform',
        audience: 'eduai-users'
    },

    // ========================================
    // 3. SESSION SECURITY
    // ========================================
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        },
        resave: false,
        saveUninitialized: false
    },

    // ========================================
    // 4. ENCRYPTION
    // ========================================
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
    },

    // ========================================
    // 5. API SECURITY
    // ========================================
    api: {
        maxRequestSize: '10mb',
        maxJsonSize: '5mb',
        maxParameterSize: '50kb',
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        requireApiKey: true,
        keyRotationDays: 90
    },

    // ========================================
    // 6. RATE LIMITING TIERS
    // ========================================
    rateLimits: {
        free: {
            questionsPerHour: 10,
            questionsPerDay: 100,
            apiCallsPerMinute: 5
        },
        starter: {
            questionsPerHour: 100,
            questionsPerDay: 1000,
            apiCallsPerMinute: 50
        },
        pro: {
            questionsPerHour: 500,
            questionsPerDay: -1, // unlimited
            apiCallsPerMinute: 200
        },
        elite: {
            questionsPerHour: -1, // unlimited
            questionsPerDay: -1,
            apiCallsPerMinute: -1
        }
    },

    // ========================================
    // 7. ABUSE DETECTION THRESHOLDS
    // ========================================
    abuseDetection: {
        failedLoginAttempts: 5,
        failedLoginWindow: 15 * 60 * 1000, // 15 minutes
        suspiciousActivityWindow: 60 * 60 * 1000, // 1 hour
        maxSuspiciousActivities: 10,
        ipBanDuration: 24 * 60 * 60 * 1000, // 24 hours
        accountLockDuration: 30 * 60 * 1000 // 30 minutes
    },

    // ========================================
    // 8. PAYMENT SECURITY
    // ========================================
    payment: {
        pciDSSCompliant: true,
        requireSslCertificate: true,
        validateSignatures: true,
        encryptPaymentData: true,
        logTransactions: true,
        maskCardNumbers: true,
        saveTokens: false, // Don't save full card data
        webhookTimeout: 5000,
        webhookRetries: 3
    },

    // ========================================
    // 9. DATABASE SECURITY
    // ========================================
    database: {
        sslRequired: true,
        ipWhitelisting: true,
        encryptionAtRest: true,
        automaticBackups: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        auditLogging: true
    },

    // ========================================
    // 10. LOGGING & MONITORING
    // ========================================
    logging: {
        logLevel: process.env.LOG_LEVEL || 'info',
        logSensitiveData: false,
        logFailedAttempts: true,
        logApiCalls: true,
        logPaymentTransactions: true,
        retentionDays: 90,
        encryptLogs: true
    },

    // ========================================
    // 11. FILE UPLOAD SECURITY
    // ========================================
    fileUpload: {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        blockExecutable: true,
        scanForMalware: true,
        quarantineFolder: './quarantine'
    },

    // ========================================
    // 12. API KEY ROTATION
    // ========================================
    apiKeyRotation: {
        enabled: true,
        rotationDays: 90,
        gracePeriodDays: 7,
        maxKeysPerUser: 5
    },

    // ========================================
    // 13. 2FA / MFA
    // ========================================
    mfa: {
        enabled: true,
        methods: ['TOTP', 'Email', 'SMS'],
        defaultMethod: 'Email',
        totpWindow: 30, // seconds
        maxAttempts: 3
    },

    // ========================================
    // 14. SECURITY HEADERS
    // ========================================
    headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Content-Security-Policy': "default-src 'self'"
    }
};

module.exports = securityConfig;