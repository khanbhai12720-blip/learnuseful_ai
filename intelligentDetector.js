const openai = require('../config/openai');

// ========================================
// INTELLIGENT QUESTION DETECTOR
// ========================================

/**
 * Detects:
 * 1. Subject automatically
 * 2. Exam type
 * 3. Explanation level
 * 4. Best language for response
 */

class IntelligentDetector {
    constructor() {
        this.subjects = {
            'math': ['mathematics', 'algebra', 'geometry', 'calculus', 'quadratic', 'equation', 'theorem', 'formula'],
            'physics': ['motion', 'force', 'energy', 'wave', 'light', 'electricity', 'magnetic', 'quantum'],
            'chemistry': ['acid', 'base', 'reaction', 'compound', 'element', 'bonding', 'redox', 'molecule'],
            'biology': ['cell', 'organ', 'reproduction', 'evolution', 'genetics', 'ecosystem', 'animal', 'plant'],
            'english': ['grammar', 'tense', 'sentence', 'vocabulary', 'comprehension', 'essay', 'writing', 'literature'],
            'hindi': ['व्याकरण', 'संज्ञा', 'क्रिया', 'हिंदी', 'काव्य', 'साहित्य', 'वाक्य', 'लेखन'],
            'reasoning': ['logic', 'series', 'analogy', 'classification', 'coding', 'decoding', 'syllogism'],
            'gk': ['capital', 'country', 'history', 'geography', 'government', 'constitution', 'general', 'knowledge'],
            'economics': ['demand', 'supply', 'market', 'inflation', 'gdp', 'trade', 'economy'],
            'political_science': ['government', 'constitution', 'democracy', 'parliament', 'law', 'justice']
        };

        this.exams = {
            'ssc-gd': ['ssc gd', 'general duty', 'ssc constable'],
            'ssc-cgl': ['ssc cgl', 'combined graduate', 'tier 1', 'tier 2'],
            'railway': ['railway', 'ntpc', 'rrb', 'group d', 'asi', 'tc'],
            'police': ['police', 'constable', 'si', 'sub inspector'],
            'agniveer': ['agniveer', 'army', 'airforce', 'navy'],
            'bank': ['bank', 'ibps', 'clerk', 'po', 'probationary'],
            'upsc': ['upsc', 'ias', 'ips', 'cse', 'civil service'],
            'class10': ['class 10', 'board', 'ncert', 'x', '10th'],
            'class12': ['class 12', 'board', 'ncert', 'xii', '12th'],
            'degree': ['graduation', 'ba', 'bsc', 'bcom', 'college', 'university']
        };

        this.levelIndicators = {
            'beginner': ['simple', 'easy', 'basic', 'explain', 'what is', 'define'],
            'intermediate': ['how', 'why', 'difference', 'compare', 'explain'],
            'advanced': ['derive', 'prove', 'complex', 'analyze', 'intricate', 'competitive', 'exam', 'board']
        };
    }

    /**
     * Detect subject from question using NLP
     * Fallback to OpenAI if not found
     */
    async detectSubject(question) {
        const questionLower = question.toLowerCase();

        // Keyword matching
        for (const [subject, keywords] of Object.entries(this.subjects)) {
            for (const keyword of keywords) {
                if (questionLower.includes(keyword)) {
                    return subject;
                }
            }
        }

        // Fallback: Use OpenAI for detection
        try {
            const model = process.env.OPENAI_DETECT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
            const response = await openai.responses.create({
                model,
                input: `Detect the subject of the given question. Respond with ONLY the subject name from: mathematics, physics, chemistry, biology, english, hindi, reasoning, gk, economics, political_science. If unsure, respond with your best guess.\n\nQuestion: ${question}`,
                max_output_tokens: 10,
                temperature: 0.3
            });

            const detected = (response.output_text || response.output?.[0]?.content?.[0]?.text || '').toLowerCase().trim();
            return detected || 'gk';
        } catch (error) {
            console.error('Subject detection error:', error);
            return 'gk'; // Default fallback
        }
    }

    /**
     * Detect exam type from question
     */
    async detectExamType(question, userProfile = {}) {
        const questionLower = question.toLowerCase();

        // Keyword matching
        for (const [exam, keywords] of Object.entries(this.exams)) {
            for (const keyword of keywords) {
                if (questionLower.includes(keyword)) {
                    return exam;
                }
            }
        }

        // User profile-based fallback
        if (userProfile.targetExam) {
            return userProfile.targetExam;
        }

        // Default to general
        return 'general';
    }

    /**
     * Detect explanation level
     */
    async detectLevel(question, userProfile = {}) {
        const questionLower = question.toLowerCase();

        // User preference
        if (userProfile.preferredLevel) {
            return userProfile.preferredLevel;
        }

        // Check exam level
        if (userProfile.targetExam === 'class10') return 'beginner';
        if (userProfile.targetExam === 'class12') return 'intermediate';
        if (['ssc-cgl', 'upsc', 'bank'].includes(userProfile.targetExam)) return 'advanced';

        // Keyword matching
        for (const [level, keywords] of Object.entries(this.levelIndicators)) {
            for (const keyword of keywords) {
                if (questionLower.includes(keyword)) {
                    return level === 'beginner' ? 'beginner' : level;
                }
            }
        }

        // Default
        return 'intermediate';
    }

    /**
     * Detect language preference
     */
    async detectLanguage(question, userProfile = {}) {
        // User preference
        if (userProfile.preferredLanguage) {
            return userProfile.preferredLanguage;
        }

        const questionLower = question.toLowerCase();
        const hindiChars = (question.match(/[\u0900-\u097F]/g) || []).length;

        // If more than 30% Hindi characters, prefer Hindi
        if (hindiChars / question.length > 0.3) {
            return 'hindi';
        }

        // Default to English
        return 'english';
    }

    /**
     * Get bilingual flag
     */
    async shouldProvideBilingual(userProfile = {}) {
        return userProfile.preferredLanguage === 'both' || userProfile.bilingual === true;
    }

    /**
     * Main detection function - call this from controller
     */
    async detectAll(question, userProfile = {}) {
        const [subject, examType, level, language, bilingual] = await Promise.all([
            this.detectSubject(question),
            this.detectExamType(question, userProfile),
            this.detectLevel(question, userProfile),
            this.detectLanguage(question, userProfile),
            this.shouldProvideBilingual(userProfile)
        ]);

        return {
            subject,
            examType,
            level,
            language,
            bilingual,
            timestamp: new Date()
        };
    }
}

module.exports = new IntelligentDetector();
