// ========================================
// CONSTANTS FILE
// ========================================

const SUBJECTS = {
    MATH: 'math',
    REASONING: 'reasoning',
    GK: 'gk',
    ENGLISH: 'english',
    HINDI: 'hindi'
};

const DIFFICULTY_LEVELS = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced'
};

const LANGUAGES = {
    ENGLISH: 'english',
    HINDI: 'hindi',
    BOTH: 'both'
};

const USER_LEVELS = {
    FREE: 'free',
    PREMIUM: 'premium',
    ELITE: 'elite'
};

// Usage Limits per day
const DAILY_LIMITS = {
    free: 10,
    premium: 500,
    elite: -1 // unlimited
};

// API Response Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
};

// Error Messages
const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already registered',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid or expired token',
    DAILY_LIMIT_EXCEEDED: 'Daily question limit exceeded',
    INVALID_SUBJECT: 'Invalid subject selected',
    SERVER_ERROR: 'Internal server error',
    INVALID_INPUT: 'Invalid input parameters'
};

// Success Messages
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    SIGNUP_SUCCESS: 'Account created successfully',
    QUESTION_ANSWERED: 'Question answered successfully',
    PROGRESS_UPDATED: 'Progress updated successfully'
};

module.exports = {
    SUBJECTS,
    DIFFICULTY_LEVELS,
    LANGUAGES,
    USER_LEVELS,
    DAILY_LIMITS,
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
};