import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        // Because we used express.raw(), req.body is a Buffer
        const payloadText = (req.body as Buffer).toString('utf8'); 
        const signature = req.headers['x-razorpay-signature'] as string;

        const isProcessed = await paymentService.processWebhook(payloadText, signature);

        if (isProcessed) {
            res.status(200).send();
        } else {
            res.status(400).send("Webhook processing failed.");
        }
    } catch (e) {
        res.status(400).send("Webhook exception");
    }
};
