const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plan'
        },
        invoiceNumber: {
            type: String,
            unique: true,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        },
        status: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
            default: 'Pending'
        },
        paymentMethod: {
            type: String,
            enum: ['Razorpay', 'Manual', 'Credit Card'],
            default: 'Razorpay'
        },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        description: String,
        billingPeriod: {
            startDate: Date,
            endDate: Date
        },
        items: [
            {
                name: String,
                quantity: Number,
                price: Number,
                total: Number
            }
        ],
        invoiceUrl: String, // URL to PDF invoice
        pdfPath: String, // Local file path
        notes: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        paidAt: Date,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Generate invoice number
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `INV-${Date.now()}-${count + 1}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);