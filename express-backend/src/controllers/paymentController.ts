import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        
        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ error: "orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required." });
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

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        // Because we used express.raw(), req.body is a Buffer
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
