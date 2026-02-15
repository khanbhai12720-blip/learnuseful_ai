const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ========================================
// INVOICE PDF GENERATOR
// ========================================

class InvoiceGenerator {
    async generateInvoice(invoice, user) {
        try {
            // Create invoices directory if it doesn't exist
            const invoicesDir = path.join(__dirname, '../invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
            const filepath = path.join(invoicesDir, filename);

            // Create PDF document
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .text('EduAI', 50, 50);

            doc.fontSize(10)
                .font('Helvetica')
                .text('AI-Powered Education Platform', 50, 80);

            // Invoice title and details
            doc.fontSize(16)
                .font('Helvetica-Bold')
                .text('INVOICE', 400, 50);

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80)
                .text(`Date: ${new Date().toLocaleDateString()}`, 400, 95)
                .text(`Status: ${invoice.status}`, 400, 110);

            // Bill to section
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('Bill To:', 50, 150);

            doc.fontSize(10)
                .font('Helvetica')
                .text(user.name || 'N/A', 50, 170)
                .text(user.email, 50, 185)
                .text(user.phone || '', 50, 200);

            // Items table
            const tableTop = 250;
            const col1 = 50;
            const col2 = 300;
            const col3 = 400;
            const col4 = 500;

            // Table header
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('Description', col1, tableTop)
                .text('Quantity', col2, tableTop)
                .text('Unit Price', col3, tableTop)
                .text('Total', col4, tableTop);

            // Horizontal line
            doc.moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .stroke();

            // Table items
            let itemTop = tableTop + 30;
            invoice.items.forEach((item) => {
                doc.fontSize(9)
                    .font('Helvetica')
                    .text(item.name, col1, itemTop)
                    .text(item.quantity.toString(), col2, itemTop)
                    .text(`INR ${item.price}`, col3, itemTop)
                    .text(`INR ${item.total}`, col4, itemTop);
                itemTop += 25;
            });

            // Total
            itemTop += 10;
            doc.moveTo(50, itemTop)
                .lineTo(550, itemTop)
                .stroke();

            itemTop += 15;
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('Total Amount:', col3, itemTop)
                .text(`INR ${invoice.amount}`, col4, itemTop);

            // Payment method
            itemTop += 50;
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('Payment Method:', 50, itemTop)
                .font('Helvetica')
                .text(invoice.paymentMethod, 50, itemTop + 20);

            // Thank you message
            itemTop += 70;
            doc.fontSize(10)
                .font('Helvetica')
                .text('Thank you for your payment!', 50, itemTop);

            // Footer
            doc.fontSize(8)
                .text('EduAI - AI Education Platform | www.eduai.com', 50, doc.page.height - 50, {
                    align: 'center'
                });

            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filepath));
                stream.on('error', reject);
            });
        } catch (error) {
            console.error('Invoice generation error:', error);
            throw error;
        }
    }
}

module.exports = new InvoiceGenerator();
