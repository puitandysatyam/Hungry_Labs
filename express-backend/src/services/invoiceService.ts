import prisma from '../config/db';
import { generateInvoicePdf } from '../utils/pdfGenerator';
import { uploadBufferToB2, getB2DownloadUrl } from '../utils/b2';
import { sendOrderConfirmation, sendInvoiceEmail } from './emailService';

function generateInvoiceNumber(orderId: number): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${dateStr}-${orderId}`;
}

function buildOrderDetails(order: any, invoiceNumber?: string) {
    const items = (order.orderItems || []).map((item: any) => {
        const unitPrice = item.menuItem?.price ?? 0;
        const addons = (item.addons || []).map((a: any) => ({ name: a.name, price: a.price }));
        const addonTotal = addons.reduce((s: number, a: any) => s + a.price, 0);
        return {
            name: item.menuItem?.name || 'Item',
            quantity: item.quantity,
            unitPrice,
            addons,
            lineTotal: (unitPrice + addonTotal) * item.quantity
        };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
    return {
        details: {
            orderId: order.id,
            customerName: order.customerName || 'Food Lover',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',
            deliveryAddress: order.deliveryAddress || '',
            items,
            subtotal,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentId: order.payment?.razorpayPaymentId || 'N/A'
        },
        invoiceData: {
            invoiceNumber: invoiceNumber || generateInvoiceNumber(order.id),
            invoiceDate: new Date().toLocaleDateString('en-IN'),
            orderId: order.id,
            customerName: order.customerName || 'Food Lover',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',
            deliveryAddress: order.deliveryAddress || '',
            items,
            subtotal,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: order.totalAmount,
            paymentMethod: 'Razorpay (Online)',
            paymentId: order.payment?.razorpayPaymentId || 'N/A',
            status: order.status
        }
    };
}

export async function generateAndStoreInvoice(orderId: number) {
    const existing = await prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: { include: { menuItem: true, addons: true } },
            payment: true
        }
    }) as any;

    if (!order) throw new Error(`Order #${orderId} not found`);
    if (!order.customerEmail) throw new Error(`Order #${orderId} has no customer email`);

    const invoiceNumber = generateInvoiceNumber(orderId);
    const { details, invoiceData } = buildOrderDetails(order, invoiceNumber);
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    const b2ObjectKey = `invoices/${invoiceNumber}.pdf`;
    const { objectKey } = await uploadBufferToB2(pdfBuffer, b2ObjectKey, 'application/pdf');
    const pdfUrl = await getB2DownloadUrl(objectKey, 300) || `b2://${objectKey}`;

    const invoice = await prisma.invoice.create({
        data: {
            orderId: order.id,
            invoiceNumber,
            pdfUrl,
            b2ObjectKey: objectKey,
            amount: details.subtotal || details.totalAmount,
            taxAmount: 0,
            totalAmount: details.totalAmount,
            status: 'ISSUED'
        }
    });

    // Send order confirmation with full details + invoice PDF attached
    sendOrderConfirmation(
        order.customerEmail,
        details,
        [{ filename: `invoice-${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    ).catch(err => console.error(`[InvoiceService] Confirmation+invoice email failed for ${invoiceNumber}:`, err.message));

    return invoice;
}

export async function getInvoiceDownloadUrl(orderId: number): Promise<{ url: string | null; invoiceNumber: string }> {
    const invoice = await prisma.invoice.findUnique({ where: { orderId } });
    if (!invoice) return { url: null, invoiceNumber: '' };
    const url = await getB2DownloadUrl(invoice.b2ObjectKey, 300);
    return { url, invoiceNumber: invoice.invoiceNumber };
}

export async function getInvoicePdfBuffer(orderId: number): Promise<{ buffer: Buffer; invoiceNumber: string } | null> {
    const invoice = await prisma.invoice.findUnique({ where: { orderId } });
    if (!invoice) return null;
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { menuItem: true, addons: true } }, payment: true }
    }) as any;
    if (!order) return null;
    const { invoiceData } = buildOrderDetails(order, invoice.invoiceNumber);
    const buffer = await generateInvoicePdf(invoiceData);
    return { buffer, invoiceNumber: invoice.invoiceNumber };
}

export async function resendInvoiceEmail(orderId: number) {
    const invoice = await prisma.invoice.findUnique({ where: { orderId } });
    if (!invoice) throw new Error(`Invoice for order #${orderId} not found`);
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { menuItem: true, addons: true } }, payment: true }
    }) as any;
    if (!order || !order.customerEmail) throw new Error(`Order #${orderId} has no customer email`);
    const { invoiceData } = buildOrderDetails(order, invoice.invoiceNumber);
    const pdfBuffer = await generateInvoicePdf(invoiceData);
    await sendInvoiceEmail(order.customerEmail, order.customerName || 'Food Lover', order.id, invoice.invoiceNumber, pdfBuffer, invoice.totalAmount);
    return { success: true, invoiceNumber: invoice.invoiceNumber };
}

export default { generateAndStoreInvoice, getInvoiceDownloadUrl, getInvoicePdfBuffer, resendInvoiceEmail };
