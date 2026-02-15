const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
    helmetConfig,
    globalLimiter,
    sanitizeInputs,
    mongoSanitization,
    corsOptions,
    requestIdMiddleware,
    preventParameterPollution,
    securityHeaders,
    requestTimeout
} = require('./middleware/security');

const app = express();
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// ========================================
// SECURITY MIDDLEWARE (in order)
// ========================================

// 1. Security headers
app.use(helmetConfig);
app.use(securityHeaders);

// 2. CORS
app.use(cors(corsOptions));

// 3. Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Request ID
app.use(requestIdMiddleware);

// 5. Request timeout
app.use(requestTimeout(30000));

// 6. Rate limiting
app.use('/api/', globalLimiter);

// 7. Input sanitization
app.use(sanitizeInputs);

// 8. MongoDB injection prevention
app.use(mongoSanitization);

// 9. Parameter pollution prevention
app.use(preventParameterPollution);

// ========================================
// ROUTES
// ========================================

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const paymentRoutes = require('./routes/payment');

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payment', paymentRoutes);

// ========================================
// ERROR HANDLING
// ========================================

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
