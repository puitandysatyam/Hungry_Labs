import { Request, Response } from 'express';
import * as invoiceService from '../services/invoiceService';

/**
 * POST /api/invoices/generate/:orderId
 * Generate invoice for a confirmed order (idempotent).
 * Requires authentication.
 */
export const generateInvoice = async (req: Request, res: Response) => {
    try {
        const orderId = Number(req.params.orderId);
        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({ error: 'Valid order ID is required.' });
        }

        // Authorization: user can only generate invoices for their own orders unless ADMIN
        const order = await (require('../config/db') as any).order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const requestingUser = (req as any).user;
        if (requestingUser.role !== 'ADMIN' && String(order.customerId) !== String(requestingUser?.id)) {
            return res.status(403).json({ error: 'Access denied — you can only generate invoices for your own orders.' });
        }

        const invoice = await invoiceService.generateAndStoreInvoice(orderId);

        return res.status(201).json({
            success: true,
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                orderId: invoice.orderId,
                status: invoice.status,
                totalAmount: invoice.totalAmount,
                issuedAt: invoice.issuedAt,
                pdfUrl: invoice.pdfUrl
            }
        });
    } catch (e: any) {
        console.error('[InvoiceController] Generate error:', e.message);
        return res.status(400).json({ error: e.message || 'Failed to generate invoice.' });
    }
};

/**
 * GET /api/invoices/download/:orderId
 * Get a presigned download URL for the invoice PDF.
 * Requires authentication.
 */
export const downloadInvoice = async (req: Request, res: Response) => {
    try {
        const orderId = Number(req.params.orderId);
        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({ error: 'Valid order ID is required.' });
        }

        const { url, invoiceNumber } = await invoiceService.getInvoiceDownloadUrl(orderId);

        if (!url) {
            return res.status(404).json({ error: 'Invoice not found for this order.' });
        }

        return res.json({
            success: true,
            invoiceNumber,
            downloadUrl: url,
            expiresIn: 300
        });
    } catch (e: any) {
        console.error('[InvoiceController] Download error:', e.message);
        return res.status(500).json({ error: e.message || 'Failed to get download URL.' });
    }
};

/**
 * POST /api/admin/invoices/resend/:orderId
 * Resend invoice email (admin only).
 */
export const resendInvoice = async (req: Request, res: Response) => {
    try {
        const orderId = Number(req.params.orderId);
        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({ error: 'Valid order ID is required.' });
        }

        const result = await invoiceService.resendInvoiceEmail(orderId);

        return res.json({
            success: true,
            message: `Invoice email resent for order #${orderId}`,
            invoiceNumber: result.invoiceNumber
        });
    } catch (e: any) {
        console.error('[InvoiceController] Resend error:', e.message);
        return res.status(400).json({ error: e.message || 'Failed to resend invoice.' });
    }
};

export default {
    generateInvoice,
    downloadInvoice,
    resendInvoice
};
