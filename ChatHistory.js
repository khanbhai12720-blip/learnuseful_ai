const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        subject: String,
        messages: [chatMessageSchema]
    },
    { timestamps: true }
);

chatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
