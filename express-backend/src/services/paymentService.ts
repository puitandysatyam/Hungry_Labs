import crypto from 'crypto';
import prisma from '../config/db';

export const processWebhook = async (payloadText: string, signature: string): Promise<boolean> => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

        // Validate signature using standard format
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadText)
            .digest('hex');

        if (generatedSignature !== signature) {
            console.error("Razorpay webhook signature mismatch");
            return false;
        }

        // Parse payload AFTER signature validation
        const payload = JSON.parse(payloadText);
        const event = payload.event;
        const paymentEntity = payload.payload.payment.entity;
        
        const rzpOrderId = paymentEntity.order_id;
        const rzpPaymentId = paymentEntity.id;

        const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: rzpOrderId } });
        if (!payment) return true; // Could be an old order or mismatch, return true so Razorpay stops retrying

        if (event === 'payment.captured' || event === 'payment.authorized') {
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
        } else if (event === 'payment.failed') {
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

        return true;
    } catch (e) {
        console.error("Webhook exception:", e);
        return false;
    }
};
