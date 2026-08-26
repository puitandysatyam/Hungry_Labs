"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebhook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const processWebhook = async (payloadText, signature) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        // Validate signature using standard format
        const generatedSignature = crypto_1.default
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
        const payment = await db_1.default.payment.findFirst({ where: { razorpayOrderId: rzpOrderId } });
        if (!payment)
            return true; // Could be an old order or mismatch, return true so Razorpay stops retrying
        if (event === 'payment.captured' || event === 'payment.authorized') {
            await db_1.default.$transaction([
                db_1.default.payment.update({
                    where: { id: payment.id },
                    data: { status: "SUCCESS", razorpayPaymentId: rzpPaymentId, razorpaySignature: signature }
                }),
                db_1.default.order.update({
                    where: { id: payment.orderId },
                    data: { status: "CONFIRMED" }
                })
            ]);
        }
        else if (event === 'payment.failed') {
            await db_1.default.$transaction([
                db_1.default.payment.update({
                    where: { id: payment.id },
                    data: { status: "FAILED", razorpayPaymentId: rzpPaymentId }
                }),
                db_1.default.order.update({
                    where: { id: payment.orderId },
                    data: { status: "FAILED" }
                })
            ]);
        }
        return true;
    }
    catch (e) {
        console.error("Webhook exception:", e);
        return false;
    }
};
exports.processWebhook = processWebhook;
//# sourceMappingURL=paymentService.js.map