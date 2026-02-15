const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = process.env.LOG_LEVEL || 'info';

const shouldLog = (level) => {
    const currentIndex = levels.indexOf(currentLevel);
    const levelIndex = levels.indexOf(level);
    if (currentIndex === -1 || levelIndex === -1) {
        return true;
    }
    return levelIndex <= currentIndex;
};

const logger = {
    error: (...args) => {
        if (shouldLog('error')) console.error(...args);
    },
    warn: (...args) => {
        if (shouldLog('warn')) console.warn(...args);
    },
    info: (...args) => {
        if (shouldLog('info')) console.log(...args);
    },
    debug: (...args) => {
        if (shouldLog('debug')) console.debug(...args);
    }
};

module.exports = logger;
