const openai = require('../config/openai');
const { getPrompt, getGovExamPrompt } = require('../utils/prompts');
const { getNCERTPrompt, getDegreePrompt } = require('../utils/ncertAndDegreePrompts');
const PromptSelector = require('../utils/promptSelector');
const IntelligentDetector = require('../utils/intelligentDetector');
const BilingualResponseHandler = require('../utils/bilingualResponseHandler');
const User = require('../models/User');
const CreditUsage = require('../models/CreditUsage');
const Question = require('../models/Question');
const { HTTP_STATUS, ERROR_MESSAGES, DAILY_LIMITS } = require('../config/constants');

// ========================================
// ASK QUESTION WITH INTELLIGENT DETECTION
// ========================================

exports.askQuestion = async (req, res) => {
    try {
        const { question, subject, examType, level, language, bilingual } = req.body;
        const userId = req.user.id;

        // Check user exists and has credits
        const user = await User.findById(userId).populate('planId');
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check plan expiry
        if (user.planExpiresAt && user.planExpiresAt < new Date()) {
            // Downgrade to free plan
            const freePlan = await require('../models/Plan').findOne({ name: 'Free' });
            user.planId = freePlan._id;
            await user.save();
        }

        // Check credits
        if (user.credits <= 0) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'No credits left. Please upgrade your plan.',
                action: 'upgrade'
            });
        }

        // Build user profile for detection
        const userProfile = {
            class: user.educationLevel,
            targetExam: user.targetExam,
            preferredLevel: user.preferredLevel,
            preferredLanguage: user.preferredLanguage,
            bilingual: user.bilingual || bilingual
        };

        // Intelligent detection
        const detection = await IntelligentDetector.detectAll(question, userProfile);

        // Use provided values or detected values
        const finalSubject = subject || detection.subject;
        const finalExamType = examType || detection.examType;
        const finalLevel = level || detection.level;
        const finalLanguage = language || detection.language;
        const shouldBilingual = bilingual !== undefined ? bilingual : detection.bilingual;

        // Get appropriate prompt
        let basePrompt;

        if (['10', '12'].includes(finalExamType)) {
            // NCERT prompt
            basePrompt = getNCERTPrompt(finalExamType, finalSubject, finalLanguage);
        } else if (['ba', 'bsc', 'bcom'].includes(finalExamType)) {
            // Degree prompt
            basePrompt = getDegreePrompt(finalExamType, finalLanguage);
        } else if (['ssc-gd', 'ssc-cgl', 'railway', 'police', 'agniveer', 'group-d'].includes(finalExamType)) {
            // Competitive exam prompt
            basePrompt = getGovExamPrompt(finalExamType, finalLanguage);
        } else {
            // General prompt
            basePrompt = getPrompt(finalSubject, finalLevel, finalLanguage);
        }

        // Add bilingual instruction
        let prompt = basePrompt;
        if (shouldBilingual && finalLanguage !== 'both') {
            prompt += `\n\nIMPORTANT: Provide the answer in BOTH Hindi and English using clear headers:\nHindi Answer:\n[Your Hindi answer here]\n\nEnglish Answer:\n[Your English answer here]`;
        }

        prompt += `\n\nQuestion: ${question}`;

        // Call OpenAI
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const maxOutputTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10);
        const temperature = Number(process.env.OPENAI_TEMPERATURE || '0.7');

        const response = await openai.responses.create({
            model,
            input: prompt,
            max_output_tokens: maxOutputTokens,
            temperature
        });

        const aiAnswer = response.output_text
            || response.output?.[0]?.content?.[0]?.text
            || '';

        // Process bilingual response
        let formattedAnswer;
        if (shouldBilingual && finalLanguage !== 'both') {
            prompt += `\n\nIMPORTANT: Provide the answer in BOTH Hindi and English using clear headers:\nHindi Answer:\n[Your Hindi answer here]\n\nEnglish Answer:\n[Your English answer here]`;
        } else {
            formattedAnswer = BilingualResponseHandler.createMonolingualResponse(aiAnswer, finalLanguage);
        }

        // Deduct credits
        user.credits -= 1;
        await user.save();

        // Save question history
        const questionRecord = await Question.create({
            userId,
            question,
            answer: formattedAnswer,
            subject: finalSubject,
            examType: finalExamType,
            level: finalLevel,
            language: finalLanguage,
            bilingual: shouldBilingual,
            modelUsed: model
        });

        // Log credit usage
        const creditUsage = new CreditUsage({
            userId: userId,
            questionId: questionRecord?._id,
            creditsSpent: 1,
            action: 'Ask Question',
            subject: finalSubject,
            examType: finalExamType,
            balanceBefore: user.credits + 1,
            balanceAfter: user.credits
        });
        await creditUsage.save();

        // Response
        res.json({
            success: true,
            data: {
                question: question,
                answer: formattedAnswer,
                metadata: {
                    subject: finalSubject,
                    examType: finalExamType,
                    level: finalLevel,
                    language: finalLanguage,
                    bilingual: shouldBilingual,
                    detectedAutomatically: !subject || !examType || !level
                },
                credits: {
                    spent: 1,
                    remaining: user.credits,
                    planName: user.planId?.name
                }
            }
        });
    } catch (error) {
        console.error('Question error:', error);
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET CREDIT USAGE ANALYTICS
// ========================================

exports.getCreditUsage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const usage = await CreditUsage.find({
            userId,
            usedAt: { $gte: startDate }
        }).sort({ usedAt: -1 });

        const totalCreditsUsed = usage.reduce((sum, item) => sum + item.creditsSpent, 0);

        res.json({
            success: true,
            data: {
                totalUsed: totalCreditsUsed,
                count: usage.length,
                details: usage
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            success: false,
            message: error.message
        });
    }
};


