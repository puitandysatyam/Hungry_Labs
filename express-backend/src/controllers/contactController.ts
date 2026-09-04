import { Request, Response } from 'express';
import { sendContactNotification } from '../services/emailService';

export const handleContactSubmit = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, category, orderId, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required." });
        }

        const ticketId = 'HL-' + Math.floor(10000 + Math.random() * 90000);

        // Send email notifications asynchronously
        sendContactNotification({
            name,
            email,
            phone: phone || 'N/A',
            category: category || 'General Inquiry',
            orderId: orderId || undefined,
            message,
            ticketId
        }).catch(err => console.error("[ContactController] Async email dispatch error:", err));

        return res.status(200).json({
            success: true,
            ticketId,
            message: "Inquiry received successfully. Our team will contact you shortly."
        });
    } catch (error: any) {
        console.error("[ContactController] Error handling contact form:", error);
        return res.status(500).json({ error: "Failed to process contact inquiry." });
    }
};

export const getContactConfig = (req: Request, res: Response) => {
    res.json({
        supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'thehungrylab.kitchen@gmail.com',
        supportPhone: process.env.SUPPORT_PHONE || '6291872593'
    });
};

