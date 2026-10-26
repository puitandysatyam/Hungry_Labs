import nodemailer from 'nodemailer';

// Sourced dynamically from environment variables
const getTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_FROM || 'thehungrylab.kitchen@gmail.com';
    const pass = process.env.SMTP_PASS || '';

    if (!pass) {
        // If password is not configured yet, return null to log gracefully without throwing
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });
};

const getFromEmail = () => process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || 'thehungrylab.kitchen@gmail.com';
const getSupportPhone = () => process.env.SUPPORT_PHONE || '6291872593';

export const sendOrderConfirmation = async (
    toEmail: string,
    customerName: string,
    orderId: number,
    paymentId: string,
    amount: number,
    attachments?: any[]
) => {
    const fromEmail = getFromEmail();
    const supportPhone = getSupportPhone();

    const subject = `The Hungry Lab: Order #${orderId} Confirmed!`;
    const text = `Hi ${customerName || 'Food Lover'},\n\n` +
        `Your order has been confirmed!\n` +
        `Order ID: #${orderId}\n` +
        `Total Amount Paid: ₹${amount.toFixed(2)}\n` +
        `Payment ID: ${paymentId}\n\n` +
        `Our culinary scientists are assembling and cooking your fresh meal right now.\n\n` +
        `Questions or modifications? Call us at +91 ${supportPhone} or reply to this email (${fromEmail}).\n\n` +
        `Enjoy your meal!\n` +
        `— The Hungry Lab Team`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #ff5a30; margin-top: 0;">Order Confirmed! 🚀</h2>
            <p>Hi <strong>${customerName || 'Food Lover'}</strong>,</p>
            <p>Thank you for ordering with The Hungry Lab. Our kitchen has received your order and cooking has begun!</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
            </div>
            <p style="font-size: 0.9em; color: #64748b;">
                Need help with your delivery? Contact our kitchen hotline at <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.
            </p>
        </div>
    `;

    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Simulated order confirmation sent to ${toEmail} for Order #${orderId}`);
            return;
        }

        await transporter.sendMail({
            from: `"The Hungry Lab" <${fromEmail}>`,
            to: toEmail,
            subject,
            text,
            html,
            attachments
        });
        console.log(`[EmailService] Order confirmation successfully sent to ${toEmail}`);
    } catch (error) {
        console.error(`[EmailService] Failed to send order confirmation to ${toEmail}:`, error);
    }
};

export const sendInvoiceEmail = async (
    toEmail: string,
    customerName: string,
    orderId: number,
    invoiceNumber: string,
    pdfBuffer: Buffer,
    amount: number
) => {
    const fromEmail = getFromEmail();
    const supportPhone = getSupportPhone();

    const subject = `The Hungry Lab: Invoice #${invoiceNumber} for Order #${orderId}`;
    const text = `Hi ${customerName || 'Food Lover'},\n\n` +
        `Please find attached your invoice for Order #${orderId}.\n\n` +
        `Invoice Number: ${invoiceNumber}\n` +
        `Order ID: #${orderId}\n` +
        `Total Amount: ₹${amount.toFixed(2)}\n\n` +
        `Thank you for ordering with The Hungry Lab!\n\n` +
        `Questions? Call us at +91 ${supportPhone} or reply to this email (${fromEmail}).\n\n` +
        `— The Hungry Lab Team`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #ff5a30; margin-top: 0;">Invoice #${invoiceNumber} 🧾</h2>
            <p>Hi <strong>${customerName || 'Food Lover'}</strong>,</p>
            <p>Please find attached your invoice for Order #${orderId} from The Hungry Lab.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p style="margin: 4px 0;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${amount.toFixed(2)}</p>
            </div>
            <p style="font-size: 0.9em; color: #64748b;">
                The invoice PDF is attached to this email. For any questions, contact our kitchen hotline at <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.
            </p>
        </div>
    `;

    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Simulated invoice email sent to ${toEmail} for Invoice #${invoiceNumber}`);
            return;
        }

        await transporter.sendMail({
            from: `"The Hungry Lab" <${fromEmail}>`,
            to: toEmail,
            subject,
            text,
            html,
            attachments: [
                {
                    filename: `invoice-${invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });
        console.log(`[EmailService] Invoice email successfully sent to ${toEmail}`);
    } catch (error) {
        console.error(`[EmailService] Failed to send invoice email to ${toEmail}:`, error);
    }
};

export const sendRefundNotification = async (
    toEmail: string,
    customerName: string,
    orderId: number,
    amount: number,
    refundId: string,
    reason?: string
) => {
    const fromEmail = process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || 'thehungrylab.kitchen@gmail.com';
    const supportPhone = process.env.SUPPORT_PHONE || '6291872593';

    const subject = `The Hungry Lab: Refund Issued for Order #${orderId}`;
    const text = `Hi ${customerName || 'Food Lover'},\n\n` +
        `A refund has been issued for your order!\n` +
        `Order ID: #${orderId}\n` +
        `Refund Amount: ₹${amount.toFixed(2)}\n` +
        `Refund ID: ${refundId}\n` +
        (reason ? `Reason: ${reason}\n` : '') +
        `\nThe refunded amount will be credited back to your original payment method within 5-7 business days.\n\n` +
        `Questions? Call us at +91 ${supportPhone} or reply to this email (${fromEmail}).\n\n` +
        `— The Hungry Lab Team`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">Refund Issued 💰</h2>
            <p>Hi <strong>${customerName || 'Food Lover'}</strong>,</p>
            <p>A refund has been processed for your order with The Hungry Lab.</p>
            <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 4px 0;"><strong>Order ID:</strong> #${orderId}</p>
                <p style="margin: 4px 0;"><strong>Refund Amount:</strong> ₹${amount.toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Refund ID:</strong> ${refundId}</p>
                ${reason ? `<p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            <p style="font-size: 0.9em; color: #64748b;">
                The refunded amount will be credited back to your original payment method within 5-7 business days.<br/>
                Need help? Contact our kitchen hotline at <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.
            </p>
        </div>
    `;

    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Simulated refund notification sent to ${toEmail} for Order #${orderId}`);
            return;
        }

        await transporter.sendMail({
            from: `"The Hungry Lab" <${fromEmail}>`,
            to: toEmail,
            subject,
            text,
            html
        });
        console.log(`[EmailService] Refund notification successfully sent to ${toEmail}`);
    } catch (error) {
        console.error(`[EmailService] Failed to send refund notification to ${toEmail}:`, error);
    }
};

export const sendContactNotification = async (inquiry: {
    name: string;
    email: string;
    phone: string;
    category: string;
    orderId?: string;
    message: string;
    ticketId: string;
}) => {
    const fromEmail = process.env.EMAIL_FROM || 'thehungrylab.kitchen@gmail.com';
    const supportEmail = process.env.SUPPORT_EMAIL || 'thehungrylab.kitchen@gmail.com';

    // 1. Notification to the kitchen team
    const adminSubject = `[Inquiry #${inquiry.ticketId}] New Contact Message: ${inquiry.category}`;
    const adminText = `New customer inquiry received:\n\n` +
        `Ticket ID: #${inquiry.ticketId}\n` +
        `Name: ${inquiry.name}\n` +
        `Email: ${inquiry.email}\n` +
        `Phone: ${inquiry.phone}\n` +
        `Subject: ${inquiry.category}\n` +
        `Order Ref: ${inquiry.orderId || 'N/A'}\n\n` +
        `Message:\n${inquiry.message}`;

    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Logged inquiry #${inquiry.ticketId} from ${inquiry.email}: ${inquiry.category}`);
            return;
        }

        await transporter.sendMail({
            from: `"The Hungry Lab Website" <${fromEmail}>`,
            to: supportEmail,
            subject: adminSubject,
            text: adminText
        });

        // 2. Automated acknowledgment to customer
        await transporter.sendMail({
            from: `"The Hungry Lab Support" <${fromEmail}>`,
            to: inquiry.email,
            subject: `We've received your message [Ticket #${inquiry.ticketId}]`,
            text: `Hi ${inquiry.name},\n\nWe have received your message regarding "${inquiry.category}".\n` +
                `Your ticket reference is #${inquiry.ticketId}. Our kitchen support team will review and reply within 2 hours.\n\n` +
                `Best regards,\nThe Hungry Lab Team`
        });
        console.log(`[EmailService] Inquiry notifications dispatched for #${inquiry.ticketId}`);
    } catch (error) {
        console.error(`[EmailService] Error dispatching inquiry email #${inquiry.ticketId}:`, error);
    }
};

