const { prompts, govExamPrompts, getPrompt, getGovExamPrompt } = require('./prompts');
const { ncertPrompts, degreePrompts, getNCERTPrompt, getDegreePrompt, getAnswerWritingGuide } = require('./ncertAndDegreePrompts');

// ========================================
// PROMPT SELECTOR - INTELLIGENTLY CHOOSE PROMPTS
// ========================================

/**
 * Unified function to select appropriate prompt based on:
 * 1. Education Level (Class 10, 12, BA, BSc, BCom, Graduation)
 * 2. Subject
 * 3. Type (NCERT, Competitive Exam, Degree)
 * 4. Language (Hindi, English)
 * 5. Difficulty Level (Beginner, Advanced, Exam-Oriented)
 */

class PromptSelector {
    constructor() {
        this.ncertSubjects = ['10', '12'];
        this.degreeTypes = ['ba', 'bsc', 'bcom'];
        this.competitiveExams = ['ssc-gd', 'ssc-cgl', 'railway', 'police', 'agniveer', 'group-d'];
        this.generalSubjects = ['math', 'reasoning', 'gk', 'english', 'hindi'];
    }

    /**
     * Select prompt based on user's requirement
     *
     * @param {Object} options - Configuration object
     * @param {String} options.educationLevel - '10', '12', 'ba', 'bsc', 'bcom', 'graduate'
     * @param {String} options.subject - Subject name
     * @param {String} options.type - 'ncert', 'degree', 'competitive', 'general'
     * @param {String} options.language - 'hindi', 'english'
     * @param {String} options.difficulty - 'beginner', 'advanced', 'examoriented'
     * @returns {String} Selected prompt
     */
    selectPrompt(options) {
        const {
            educationLevel,
            subject,
            type = 'general',
            language = 'hindi',
            difficulty = 'beginner'
        } = options;

        try {
            // NCERT Prompts (Class 10, 12)
            if (type === 'ncert' || this.ncertSubjects.includes(educationLevel)) {
                const prompt = getNCERTPrompt(educationLevel, subject, language);
                if (prompt) return prompt;
            }

            // Degree Prompts (BA, BSc, BCom)
            if (type === 'degree' || this.degreeTypes.includes(educationLevel)) {
                const prompt = getDegreePrompt(educationLevel, language);
                if (prompt) return prompt;
            }

            // Competitive Exam Prompts
            if (type === 'competitive' && this.competitiveExams.includes(educationLevel)) {
                const prompt = getGovExamPrompt(educationLevel, language);
                if (prompt) return prompt;
            }

            // General Subject Prompts (for competitive exams or self-study)
            if (type === 'general' || this.generalSubjects.includes(subject)) {
                const prompt = getPrompt(subject, difficulty, language);
                if (prompt) return prompt;
            }

            throw new Error('Could not find appropriate prompt');
        } catch (error) {
            console.error('Prompt selection error:', error.message);
            return this.getDefaultPrompt(language);
        }
    }

    /**
     * Get answer writing guide
     */
    getAnswerWritingGuide(answerType, language = 'hindi') {
        return getAnswerWritingGuide(answerType, language);
    }

    /**
     * Get default prompt 