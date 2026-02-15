const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        question: {
            type: String,
            required: true
        },
        answer: {
            type: mongoose.Schema.Types.Mixed
        },
        subject: String,
        examType: String,
        level: String,
        language: String,
        bilingual: {
            type: Boolean,
            default: false
        },
        modelUsed: String,
        tokensUsed: Number
    },
    { timestamps: true }
);

questionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
