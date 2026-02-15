const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        subject: {
            type: String,
            required: true
        },
        questionsAnswered: {
            type: Number,
            default: 0
        },
        correctAnswers: {
            type: Number,
            default: 0
        },
        lastActivityAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

progressSchema.index({ userId: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
