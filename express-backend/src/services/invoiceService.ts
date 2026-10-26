import prisma from '../config/db';
import { generateInvoicePdf } from '../utils/pdfGenerator';
import { uploadBufferToB2, getB2DownloadUrl, deleteB2Object } from '../utils/b2';
import { sendInvoiceEmail } from './emailService';

interface OrderWithItems {
    id: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
    totalAmount: number;
    status: string;
    createdAt: Date;
    orderItems: Array<{
        id: number;
        quantity: number;
        menuItem: {
            name: string;
            price: number;
        };
        addons: Array<{
            name: string;
            price: number;
        }>;
    }>;
    payment?: {
        razorpayPaymentId: string | null;
        status: string;
        amount: number;
    } | null;
}

/**
 * Generate invoice number: INV-YYYYMMDD-{orderId}
 */
function generateInvoiceNumber(orderId: number): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${dateStr}-${orderId}`;
}

/**
 * Generate invoice for a confirmed order.
 * Steps:
 * 1. Fetch order with items from Prisma
 * 2. Check if invoice already exists (idempotency)
 * 3. Generate PDF buffer via PDFKit
 * 4. Upload PDF to B2
 * 5. Create Invoice record in Prisma
 * 6. Send invoice email with PDF attachment
 * Returns the created Invoice record.
 */
export async function generateAndStoreInvoice(orderId: number) {
    // Idempotency: return existing invoice if already generated
    const existing = await prisma.invoice.findUnique({
        where: { orderId },
        include: { order: true }
    });
    if (existing) {
        return existing;
    }

    // Fetch order with full details
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: {
                include: {
                    menuItem: true,
                    addons: true
                }
            },
            payment: true
        }
    }) as OrderWithItems | null;

    if (!order) {
        throw new Error(`Order #${orderId} not found`);
    }

    if (!order.customerEmail) {
        throw new Error(`Order #${orderId} has no customer email`);
    }

    const invoiceNumber = generateInvoiceNumber(orderId);

    // Build invoice data for PDF
    const items = order.orderItems.map(item => {
        const unitPrice = item.menuItem.price;
        const addonTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
        const lineTotal = (unitPrice + addonTotal) * item.quantity;
        return {
            name: item.menuItem.name,
            quantity: item.quantity,
            unitPrice,
            addons: item.addons.map(a => ({ name: a.name, price: a.price })),
            lineTotal
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = 0; // No tax for now
    const discountAmount = 0; // Discount already reflected in totalAmount
    const totalAmount = order.totalAmount;

    const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date().toLocaleDateString('en-IN'),
        orderId: order.id,
        customerName: order.customerName || 'Food Lover',
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone || '',
        deliveryAddress: order.deliveryAddress || '',
        items,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod: 'Razorpay (Online)',
        paymentId: order.payment?.razorpayPaymentId || 'N/A',
        status: order.status
    };

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    // Upload to B2
    const b2ObjectKey = `invoices/${invoiceNumber}.pdf`;
    const { objectKey } = await uploadBufferToB2(pdfBuffer, b2ObjectKey, 'application/pdf');

    // Get download URL for storage reference
    const pdfUrl = await getB2DownloadUrl(objectKey, 300) || `https://b2.example.com/${objectKey}`;

    // Create Invoice record
    const invoice = await prisma.invoice.create({
        data: {
            orderId: order.id,
            invoiceNumber,
            pdfUrl,
            b2ObjectKey: objectKey,
            amount: subtotal,
            taxAmount,
            totalAmount,
            status: 'ISSUED'
        }
    });

    // Send invoice email with PDF attachment (fire and forget, don't block)
    sendInvoiceEmail(
        order.customerEmail,
        order.customerName || 'Food Lover',
        order.id,
        invoiceNumber,
        pdfBuffer,
        totalAmount
    ).catch(err => console.error(`[InvoiceService] Email failed for invoice ${invoiceNumber}:`, err.message));

    return invoice;
}

/**
 * Download invoice PDF from B2 (returns presigned URL for secure download).
 */
export async function getInvoiceDownloadUrl(orderId: number): Promise<{ url: string | null; invoiceNumber: string }> {
    const invoice = await prisma.invoice.findUnique({
        where: { orderId }
    });

    if (!invoice) {
        return { url: null, invoiceNumber: '' };
    }

    const url = await getB2DownloadUrl(invoice.b2ObjectKey, 300);
    return { url, invoiceNumber: invoice.invoiceNumber };
}

/**
 * Resend invoice email (admin endpoint).
 */
export async function resendInvoiceEmail(orderId: number) {
    const invoice = await prisma.invoice.findUnique({
        where: { orderId },
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                            addons: true
                        }
                    },
                    payment: true
                }
            }
        }
    });

    if (!invoice) {
        throw new Error(`Invoice for order #${orderId} not found`);
    }

    const order = invoice.order;
    if (!order.customerEmail) {
        throw new Error(`Order #${orderId} has no customer email`);
    }

    // Regenerate PDF and send
    const items = order.orderItems.map((item: any) => {
        const unitPrice = item.menuItem.price;
        const addonTotal = item.addons.reduce((sum: number, a: any) => sum + a.price, 0);
        const lineTotal = (unitPrice + addonTotal) * item.quantity;
        return {
            name: item.menuItem.name,
            quantity: item.quantity,
            unitPrice,
            addons: item.addons.map((a: any) => ({ name: a.name, price: a.price })),
            lineTotal
        };
    });

    const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date().toLocaleDateString('en-IN'),
        orderId: order.id,
        customerName: order.customerName || 'Food Lover',
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone || '',
        deliveryAddress: order.deliveryAddress || '',
        items,
        subtotal: invoice.amount,
        taxAmount: invoice.taxAmount,
        discountAmount: 0,
        totalAmount: invoice.totalAmount,
        paymentMethod: 'Razorpay (Online)',
        paymentId: order.payment?.razorpayPaymentId || 'N/A',
        status: order.status
    };

    const pdfBuffer = await generateInvoicePdf(invoiceData);

    await sendInvoiceEmail(
        order.customerEmail,
        order.customerName || 'Food Lover',
        order.id,
        invoice.invoiceNumber,
        pdfBuffer,
        invoice.totalAmount
    );

    return { success: true, invoiceNumber: invoice.invoiceNumber };
}

export default {
    generateAndStoreInvoice,
    getInvoiceDownloadUrl,
    resendInvoiceEmail
};
