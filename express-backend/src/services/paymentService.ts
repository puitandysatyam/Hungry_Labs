import crypto from 'crypto';
import prisma from '../config/db';
import { sendOrderConfirmation } from './emailService';

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

    return {
        success: true,
        message: "Payment verified and order confirmed.",
        orderId: updatedOrder.id,
        status: updatedOrder.status
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
        }

        return true;
    } catch (e) {
        console.error("[Razorpay Webhook] Exception processing webhook:", e);
        return false;
    }
};
