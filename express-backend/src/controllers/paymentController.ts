import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../config/db';
import * as paymentService from '../services/paymentService';

/**
 * STEP 1: Backend Endpoint to Create Order
 * POST /api/create-order or /api/payment/create-order
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
export const createRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { amount, currency = "INR", receipt } = req.body;

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(401).json({ error: "Razorpay credentials not configured on the server." });
        }

        const amountInPaise = Number(amount);
        if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
            return res.status(400).json({ error: "Invalid amount. Minimum amount is 100 paise (₹1.00)." });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
            amount: Math.round(amountInPaise),
            currency: String(currency || "INR"),
            receipt: String(receipt || `rcpt_${Date.now()}`)
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error: any) {
        console.error("[Razorpay API Error - createRazorpayOrder]:", error);
        if (error.statusCode === 401 || error.status === 401) {
            return res.status(401).json({ error: "Razorpay authentication failed. Verify API credentials." });
        }
        return res.status(500).json({
            error: "Failed to create Razorpay order",
            details: error.message || error
        });
    }
};

/**
 * STEP 3: Backend Endpoint to Verify Payment Signature
 * POST /api/verify-payment or /api/payment/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 */
export const verifyPaymentSignatureDirect = async (req: Request, res: Response) => {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(401).json({ error: "Razorpay secret key not configured on server." });
        }

        const orderId = req.body.order_id || req.body.razorpay_order_id || req.body.razorpayOrderId;
        const paymentId = req.body.payment_id || req.body.razorpay_payment_id || req.body.razorpayPaymentId;
        const signature = req.body.razorpay_signature || req.body.razorpaySignature || req.body.signature;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                error: "Missing required fields. 'order_id', 'payment_id', and 'razorpay_signature' are mandatory."
            });
        }

        const text = `${orderId}|${paymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(text)
            .digest('hex');

        let isAuthentic = false;
        try {
            isAuthentic = crypto.timingSafeEqual(
                Buffer.from(generatedSignature, 'utf-8'),
                Buffer.from(signature, 'utf-8')
            );
        } catch {
            isAuthentic = false;
        }

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Signature verification failed: Tampered or invalid signature."
            });
        }

        // If a local DB order exists for this Razorpay order, update its status
        const localOrderId = req.body.orderId ? Number(req.body.orderId) : null;
        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { razorpayOrderId: String(orderId) },
                    ...(localOrderId ? [{ orderId: localOrderId }] : [])
                ]
            }
        });

        if (payment && payment.status !== 'SUCCESS') {
            await prisma.$transaction([
                prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: "SUCCESS", razorpayPaymentId: String(paymentId) }
                }),
                prisma.order.update({
                    where: { id: payment.orderId },
                    data: { status: "CONFIRMED" }
                })
            ]);
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order_id: orderId,
            payment_id: paymentId
        });
    } catch (error: any) {
        console.error("[Razorpay API Error - verifyPaymentSignatureDirect]:", error);
        return res.status(500).json({
            error: "Error verifying payment signature",
            details: error.message || error
        });
    }
};

/**
 * Specialized verification for restaurant checkout flow with orderId
 */
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const orderId = req.body.orderId || req.body.order_id;
        const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id || req.body.order_id;
        const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id || req.body.payment_id;
        const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature || req.body.signature;

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ error: "Missing required fields for payment verification." });
        }

        const result = await paymentService.verifyPayment({
            orderId: Number(orderId),
            razorpayOrderId: String(razorpayOrderId),
            razorpayPaymentId: String(razorpayPaymentId),
            razorpaySignature: String(razorpaySignature)
        });

        res.status(200).json(result);
    } catch (e: any) {
        console.error("[PaymentController] Verify error:", e.message || e);
        res.status(400).json({ error: e.message || "Payment verification failed." });
    }
};

/**
 * Webhook handler for async Razorpay server-to-server notifications
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const payloadText = Buffer.isBuffer(req.body)
            ? req.body.toString('utf8')
            : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

        const signature = req.headers['x-razorpay-signature'] as string;

        const isProcessed = await paymentService.processWebhook(payloadText, signature);

        if (isProcessed) {
            res.status(200).json({ status: "ok" });
        } else {
            res.status(400).send("Webhook processing failed.");
        }
    } catch (e) {
        res.status(400).send("Webhook exception");
    }
};
