import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: string;
    orderId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        addons: Array<{ name: string; price: number }>;
        lineTotal: number;
    }>;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentId: string;
    status: string;
}

/**
 * Generates a professional invoice PDF buffer using PDFKit.
 * Returns a Promise<Buffer> containing the PDF.
 */
export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Invoice ${data.invoiceNumber}`,
                Author: 'The Hungry Lab',
                Subject: `Invoice for Order #${data.orderId}`,
                CreationDate: new Date()
            }
        });

        doc.pipe(stream);

        // ---------- Header ----------
        doc.fillColor('#1a1a1a').fontSize(26).font('Helvetica-Bold');
        doc.text('THE HUNGRY LAB', 50, 45, { align: 'left' });

        doc.fillColor('#ff5a30').fontSize(14).font('Helvetica-Bold');
        doc.text('INVOICE', 50, 75, { align: 'right' });

        doc.fillColor('#666666').fontSize(9).font('Helvetica');
        doc.text('Cloud Kitchen & Food Delivery', 50, 72, { align: 'right' });
        doc.text('Bansdroni, Kolkata, West Bengal 700070', 50, 84, { align: 'right' });

        // ---------- Invoice details block ----------
        const topY = 110;

        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
        doc.text('Invoice Number:', 50, topY);
        doc.text('Invoice Date:', 50, topY + 18);
        doc.text('Order ID:', 50, topY + 36);
        doc.text('Payment Status:', 50, topY + 54);

        doc.fillColor('#333333').fontSize(10).font('Helvetica');
        doc.text(data.invoiceNumber, 150, topY);
        doc.text(data.invoiceDate, 150, topY + 18);
        doc.text(`#${data.orderId}`, 150, topY + 36);
        doc.text(data.status, 150, topY + 54);

        // ---------- Customer info ----------
        const custY = topY + 90;

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text('Bill To', 50, custY);

        doc.fillColor('#333333').fontSize(9.5).font('Helvetica');
        doc.text(data.customerName, 50, custY + 18);
        doc.text(data.customerEmail, 50, custY + 32);
        doc.text(data.customerPhone, 50, custY + 46);
        doc.text(data.deliveryAddress, 50, custY + 60);

        // ---------- Items table ----------
        const tableY = custY + 110;

        const colX = {
            item: 50,
            qty: 300,
            unit: 360,
            addons: 430,
            total: 520
        };

        doc.fillColor('#000000').fontSize(9.5).font('Helvetica-Bold');
        doc.text('Item', colX.item, tableY);
        doc.text('Qty', colX.qty, tableY, { align: 'right' });
        doc.text('Unit Price', colX.unit, tableY, { align: 'right' });
        doc.text('Add-ons', colX.addons, tableY);
        doc.text('Line Total', colX.total, tableY, { align: 'right' });

        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, tableY + 14).lineTo(560, tableY + 14).stroke();

        let rowY = tableY + 20;
        for (const item of data.items) {
            doc.fillColor('#333333').fontSize(9).font('Helvetica');
            doc.text(item.name, colX.item, rowY, { width: 240, ellipsis: true });
            doc.text(String(item.quantity), colX.qty, rowY, { align: 'right', width: 30 });
            doc.text(`₹${item.unitPrice.toFixed(2)}`, colX.unit, rowY, { align: 'right', width: 60 });

            if (item.addons && item.addons.length > 0) {
                const addonText = item.addons.map(a => `+${a.name} (₹${a.price.toFixed(2)})`).join(', ');
                doc.text(addonText, colX.addons, rowY, { width: 80, ellipsis: true });
            }

            doc.text(`₹${item.lineTotal.toFixed(2)}`, colX.total, rowY, { align: 'right', width: 60 });

            rowY += 22;
        }

        // ---------- Totals ----------
        const totalsY = rowY + 15;

        const totals = [
            { label: 'Subtotal', value: data.subtotal },
            { label: 'Tax', value: data.taxAmount },
            { label: 'Discount', value: -data.discountAmount },
            { label: 'Total', value: data.totalAmount, bold: true }
        ];

        let tY = totalsY;
        for (const t of totals) {
            const isTotal = t.label === 'Total';
            doc.fillColor('#000000').fontSize(isTotal ? 11 : 9.5).font(isTotal ? 'Helvetica-Bold' : 'Helvetica');
            doc.text(t.label, 400, tY, { align: 'right', width: 140 });
            doc.text(`₹${t.value.toFixed(2)}`, 500, tY, { align: 'right', width: 50 });
            if (isTotal) {
                doc.strokeColor('#ff5a30').lineWidth(1);
                doc.moveTo(400, tY + 10).lineTo(560, tY + 10).stroke();
            }
            tY += 20;
        }

        // ---------- Payment info ----------
        const payY = tY + 25;

        doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
        doc.text('Payment Details', 50, payY);

        doc.fillColor('#333333').fontSize(9.5).font('Helvetica');
        doc.text(`Method: ${data.paymentMethod}`, 50, payY + 18);
        doc.text(`Payment ID: ${data.paymentId}`, 50, payY + 32);

        // ---------- Footer ----------
        const footerY = 780;

        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, footerY).lineTo(560, footerY).stroke();

        doc.fillColor('#666666').fontSize(8).font('Helvetica');
        doc.text('Thank you for ordering with The Hungry Lab!', 50, footerY + 14, { align: 'center', width: 510 });
        doc.text('For support, email: support@thehungrylab.in | Phone: +91 6291872593', 50, footerY + 26, { align: 'center', width: 510 });
        doc.text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 38, { align: 'center', width: 510 });

        doc.end();
    });
}

export default generateInvoicePdf;
