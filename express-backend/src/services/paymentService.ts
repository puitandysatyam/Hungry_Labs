import crypto from 'crypto';
import prisma from '../config/db';
import { sendOrderConfirmation } from './emailService';
import { generateAndStoreInvoice } from './invoiceService';

interface VerifyPaymentParams {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

/**
 * Verifies Razorpay payment signature from client checkout handler.
 * Per official Razorpay documentation:
 * HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
export const verifyPayment = async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
}: VerifyPaymentParams) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        throw new Error("Razorpay secret key is not configured on the server.");
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new Error("Missing required payment verification parameters.");
    }

    // Generate expected signature
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const isAuthentic = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(razorpaySignature, 'utf-8')
    );

    if (!isAuthentic) {
        console.error(`[Razorpay] Invalid payment signature for Order #${orderId}`);
        throw new Error("Invalid payment signature. Verification failed.");
    }

    // Locate the Payment record
    const payment = await prisma.payment.findFirst({
        where: {
            OR: [
                { razorpayOrderId: razorpayOrderId },
                { orderId: Number(orderId) }
            ]
        },
        include: { order: true }
    });

    if (!payment) {
        throw new Error(`No payment record found matching Razorpay Order ${razorpayOrderId}`);
    }

    // Idempotency: if already confirmed, return success without duplicate side-effects
    if (payment.status === 'SUCCESS' && payment.order.status === 'CONFIRMED') {
        return {
            success: true,
            message: "Payment already verified.",
            orderId: payment.orderId,
            status: "CONFIRMED"
        };
    }

    // Atomically confirm payment and order
    const [, updatedOrder] = await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "SUCCESS",
                razorpayPaymentId: razorpayPaymentId
            }
        }),
        prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" }
        })
    ]);

    // Send order confirmation email asynchronously
    if (updatedOrder.customerEmail) {
        sendOrderConfirmation(
            updatedOrder.customerEmail,
            updatedOrder.customerName || 'Food Lover',
            updatedOrder.id,
            razorpayPaymentId,
            updatedOrder.totalAmount
        ).catch(err => console.error("[Razorpay] Error sending order confirmation email:", err));
    }

    // Auto-generate invoice and upload to B2
    generateAndStoreInvoice(updatedOrder.id).catch(err => console.error("[Razorpay] Error generating invoice:", err));

    return {
        success: true,
        message: "Payment verified and order confirmed.",
        orderId: updatedOrder.id,
        status: updatedOrder.status
    };
};

/**
 * Fetch the current payment + order status for a given local order ID.
 * Used by frontend to reconcile after verification failures or modal dismiss.
 */
export const getPaymentStatus = async (orderId: number) => {
    const payment = await prisma.payment.findFirst({
        where: { orderId },
        include: { order: true }
    });

    if (!payment) {
        return {
            found: false,
            orderId,
            status: "NOT_FOUND",
            razorpayOrderId: null,
            razorpayPaymentId: null,
            amount: null,
            refunded: false
        };
    }

    return {
        found: true,
        orderId: payment.orderId,
        status: payment.status,
        orderStatus: payment.order.status,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        refunded: payment.refunded
    };
};

/**
 * Initiate a refund via Razorpay for a given payment.
 * Returns the Razorpay refund reference.
 */
export const initiateRefund = async ({
    orderId,
    amount,
    reason
}: {
    orderId: number;
    amount?: number; // in paise; if omitted, full refund
    reason?: string;
}) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId || !secret) {
        throw new Error("Razorpay credentials not configured on the server.");
    }

    const payment = await prisma.payment.findFirst({
        where: { orderId },
        include: { order: true }
    });

    if (!payment) {
        throw new Error(`No payment record found for order #${orderId}`);
    }

    if (payment.status !== 'SUCCESS') {
        throw new Error("Cannot refund a payment that is not successful.");
    }

    if (payment.refunded) {
        throw new Error("This payment has already been refunded.");
    }

    if (!payment.razorpayPaymentId) {
        throw new Error("No Razorpay payment ID on record to refund against.");
    }

    const razorpay = new (require('razorpay'))({
        key_id: keyId,
        key_secret: secret
    });

    const refundAmount = amount ?? payment.amount;
    if (!refundAmount || refundAmount <= 0) {
        throw new Error("Invalid refund amount.");
    }

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundAmount,
        ...(reason ? { notes: { reason } } : {})
    });

    // Mark refunded in DB
    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            refunded: true,
            refundId: refund.id
        }
    });

    // Update order status to reflect refund
    await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" }
    });

    return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        orderId: payment.orderId
    };
};

/**
 * Retry payment for a stuck PENDING or FAILED order.
 * Creates a new Razorpay order and updates the Payment record mapping.
 */
export const retryPayment = async (orderId: number) => {
    const payment = await prisma.payment.findFirst({
        where: { orderId },
        include: { order: true }
    });

    if (!payment) {
        throw new Error(`No payment record found for order #${orderId}`);
    }

    const order = payment.order;
    if (order.status === 'CONFIRMED' && payment.status === 'SUCCESS') {
        throw new Error("Order is already confirmed and paid.");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials not configured on the server.");
    }

    const razorpay = new (require('razorpay'))({
        key_id: keyId,
        key_secret: keySecret
    });

    const amountInPaise = payment.amount ?? Math.round(order.totalAmount * 100);
    if (!amountInPaise || amountInPaise < 100) {
        throw new Error("Invalid order amount for retry.");
    }

    const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_retry_order_${order.id}_${Date.now()}`
    });

    // Update existing payment record to point to the new Razorpay order
    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            razorpayOrderId: rzpOrder.id,
            razorpayPaymentId: null,
            status: "CREATED",
            refunded: false,
            refundId: null
        }
    });

    // Reset order to PENDING so it can flow through normally again
    await prisma.order.update({
        where: { id: order.id },
        data: { status: "PENDING" }
    });

    return {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        status: "PENDING"
    };
};

/**
 * Handles incoming Razorpay Webhooks.
 * Validates HMAC SHA-256 with RAZORPAY_WEBHOOK_SECRET.
 */
export const processWebhook = async (payloadText: string, signature: string): Promise<boolean> => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        if (!secret) {
            console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.");
            return false;
        }

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadText)
            .digest('hex');

        if (generatedSignature !== signature) {
            console.error("[Razorpay Webhook] Signature mismatch.");
            return false;
        }

        const payload = JSON.parse(payloadText);
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;

        if (!paymentEntity) return true;

        const rzpOrderId = paymentEntity.order_id;
        const rzpPaymentId = paymentEntity.id;

        const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId: rzpOrderId },
            include: { order: true }
        });

        if (!payment) return true; // Unknown or legacy order, acknowledge to Razorpay

        if (event === 'payment.captured' || event === 'payment.authorized') {
            // Idempotency: if already confirmed by client-side verify, do not re-send email
            if (payment.status === 'SUCCESS' && payment.order.status === 'CONFIRMED') {
                return true;
            }

            const [, updatedOrder] = await prisma.$transaction([
                prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: "SUCCESS", razorpayPaymentId: rzpPaymentId }
                }),
                prisma.order.update({
                    where: { id: payment.orderId },
                    data: { status: "CONFIRMED" }
                })
            ]);

            if (updatedOrder.customerEmail) {
                sendOrderConfirmation(
                    updatedOrder.customerEmail,
                    updatedOrder.customerName || '',
                    updatedOrder.id,
                    rzpPaymentId,
                    updatedOrder.totalAmount
                ).catch(err => console.error("[Webhook] Error sending confirmation email:", err));
            }

            // Auto-generate invoice via webhook
            generateAndStoreInvoice(updatedOrder.id).catch(err => console.error("[Webhook] Error generating invoice:", err));
        } else if (event === 'payment.failed') {
            if (payment.status !== 'SUCCESS') {
                await prisma.$transaction([
                    prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: "FAILED", razorpayPaymentId: rzpPaymentId }
                    }),
                    prisma.order.update({
                        where: { id: payment.orderId },
                        data: { status: "FAILED" }
                    })
                ]);
            }
        } else if (event === 'payment.refunded') {
            // Acknowledge refund processed by Razorpay
            await prisma.payment.update({
                where: { id: payment.id },
                data: { refunded: true }
            });
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: "REFUNDED" }
            });
        } else if (event === 'order.paid') {
            // Order fully paid (could be via multiple partial payments)
            if (payment.status !== 'SUCCESS') {
                await prisma.$transaction([
                    prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: "SUCCESS", razorpayPaymentId: rzpPaymentId }
                    }),
                    prisma.order.update({
                        where: { id: payment.orderId },
                        data: { status: "CONFIRMED" }
                    })
                ]);
            }
        } else if (event === 'refund.processed') {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { refunded: true }
            });
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: "REFUNDED" }
            });
        }

        return true;
    } catch (e) {
        console.error("[Razorpay Webhook] Exception processing webhook:", e);
        return false;
    }
};
