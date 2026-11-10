import nodemailer from 'nodemailer';

type OrderItemDetail = {
    name: string;
    quantity: number;
    unitPrice: number;
    addons: { name: string; price: number }[];
    lineTotal: number;
};

type OrderEmailDetails = {
    orderId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    items: OrderItemDetail[];
    subtotal?: number;
    totalAmount: number;
    status?: string;
    paymentId?: string;
};

const getTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_FROM || 'thehungrylab.kitchen@gmail.com';
    const pass = process.env.SMTP_PASS || '';

    if (!pass) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });
};

const getFromEmail = () => process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || 'thehungrylab.kitchen@gmail.com';
const getSupportPhone = () => process.env.SUPPORT_PHONE || '6291872593';

const formatItemsText = (items: OrderItemDetail[]) => {
    if (!items.length) return 'No items';
    return items.map(i => {
        const addonStr = i.addons?.length ? ` (+ ${i.addons.map(a => `${a.name} ₹${a.price}`).join(', ')})` : '';
        return `- ${i.quantity}x ${i.name}${addonStr} = ₹${i.lineTotal.toFixed(2)}`;
    }).join('\n');
};

const formatItemsHtml = (items: OrderItemDetail[]) => {
    if (!items.length) return '<p>No items</p>';
    return `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr>
            <th style="text-align:left;border-bottom:1px solid #e2e8f0;padding:6px">Item</th>
            <th style="text-align:center;border-bottom:1px solid #e2e8f0;padding:6px">Qty</th>
            <th style="text-align:right;border-bottom:1px solid #e2e8f0;padding:6px">Amount</th>
        </tr></thead>
        <tbody>${items.map(i => `
            <tr>
                <td style="padding:6px;border-bottom:1px solid #f1f5f9">
                    <strong>${i.name}</strong>
                    ${i.addons?.length ? `<div style="font-size:12px;color:#64748b">+ ${i.addons.map(a => `${a.name} (₹${a.price})`).join(', ')}</div>` : ''}
                </td>
                <td style="padding:6px;text-align:center;border-bottom:1px solid #f1f5f9">${i.quantity}</td>
                <td style="padding:6px;text-align:right;border-bottom:1px solid #f1f5f9">₹${i.lineTotal.toFixed(2)}</td>
            </tr>`).join('')}</tbody>
    </table>`;
};

const orderDetailsBlockHtml = (details: OrderEmailDetails) => `
    <div style="background-color:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Order ID:</strong> #${details.orderId}</p>
        ${details.status ? `<p style="margin:4px 0;"><strong>Status:</strong> ${details.status}</p>` : ''}
        <p style="margin:4px 0;"><strong>Customer:</strong> ${details.customerName || 'Food Lover'}</p>
        ${details.customerPhone ? `<p style="margin:4px 0;"><strong>Phone:</strong> ${details.customerPhone}</p>` : ''}
        ${details.deliveryAddress ? `<p style="margin:4px 0;"><strong>Delivery Address:</strong> ${details.deliveryAddress}</p>` : ''}
        ${details.paymentId ? `<p style="margin:4px 0;"><strong>Payment ID:</strong> ${details.paymentId}</p>` : ''}
    </div>
    <div style="margin:16px 0;">
        <h3 style="margin:0 0 8px 0;font-size:16px;">Order Items</h3>
        ${formatItemsHtml(details.items)}
        <div style="text-align:right;margin-top:12px;font-size:16px;"><strong>Total: ₹${details.totalAmount.toFixed(2)}</strong></div>
    </div>
`;

const orderDetailsBlockText = (details: OrderEmailDetails) => 
    `Order ID: #${details.orderId}\n` +
    (details.status ? `Status: ${details.status}\n` : '') +
    `Customer: ${details.customerName || 'Food Lover'}\n` +
    (details.customerPhone ? `Phone: ${details.customerPhone}\n` : '') +
    (details.deliveryAddress ? `Delivery Address: ${details.deliveryAddress}\n` : '') +
    (details.paymentId ? `Payment ID: ${details.paymentId}\n` : '') +
    `\nItems:\n${formatItemsText(details.items)}\n\nTotal: ₹${details.totalAmount.toFixed(2)}\n`;

export const sendOrderConfirmation = async (
    toEmail: string,
    details: OrderEmailDetails,
    attachments?: any[]
) => {
    const fromEmail = getFromEmail();
    const supportPhone = getSupportPhone();

    const subject = `The Hungry Lab: Order #${details.orderId} Confirmed!`;
    const text = `Hi ${details.customerName || 'Food Lover'},\n\nYour payment is confirmed and your order is awaiting kitchen acceptance.\n\n` +
        orderDetailsBlockText(details) +
        `\nOur kitchen will review and accept your order shortly. If there is any issue, we will notify you and process a refund.\n\n` +
        `Questions? Call us at +91 ${supportPhone} or reply to this email (${fromEmail}).\n\n— The Hungry Lab Team`;

    const html = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#ff5a30;margin-top:0;">Order Confirmed & Awaiting Kitchen Acceptance</h2>
            <p>Hi <strong>${details.customerName || 'Food Lover'}</strong>,</p>
            <p>Thank you for your order! Your payment is confirmed. Our kitchen will review and accept it shortly.</p>
            ${orderDetailsBlockHtml(details)}
            <p style="font-size:0.9em;color:#64748b;">If the kitchen cannot fulfill your order (e.g. unavailable ingredients), we will automatically refund you and notify you by email.</p>
            <p style="font-size:0.9em;color:#64748b;">Need help? Call <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.</p>
        </div>
    `;

    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.log(`[EmailService] Simulated order confirmation sent to ${toEmail} for Order #${details.orderId}`);
            return;
        }
        await transporter.sendMail({ from: `"The Hungry Lab" <${fromEmail}>`, to: toEmail, subject, text, html, attachments });
        console.log(`[EmailService] Order confirmation sent to ${toEmail}`);
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
    const text = `Hi ${customerName || 'Food Lover'},\n\nPlease find attached your invoice for Order #${orderId}.\nInvoice: ${invoiceNumber}\nTotal: ₹${amount.toFixed(2)}\n\n— The Hungry Lab Team`;
    const html = `<div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#ff5a30;margin-top:0;">Invoice #${invoiceNumber}</h2>
        <p>Hi <strong>${customerName || 'Food Lover'}</strong>, please find your invoice attached for Order #${orderId} (₹${amount.toFixed(2)}).</p>
        <p style="font-size:0.9em;color:#64748b;">Questions? Call <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.</p>
    </div>`;
    try {
        const transporter = getTransporter();
        if (!transporter) { console.log(`[EmailService] Simulated invoice email sent to ${toEmail} for ${invoiceNumber}`); return; }
        await transporter.sendMail({
            from: `"The Hungry Lab" <${fromEmail}>`, to: toEmail, subject, text, html,
            attachments: [{ filename: `invoice-${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        });
    } catch (error) {
        console.error(`[EmailService] Failed to send invoice email to ${toEmail}:`, error);
    }
};

export const sendRefundNotification = async (
    toEmail: string,
    details: OrderEmailDetails,
    refundId: string,
    reason?: string,
    attachments?: any[]
) => {
    const fromEmail = getFromEmail();
    const supportPhone = getSupportPhone();
    const subject = `The Hungry Lab: Refund Processed for Order #${details.orderId}`;
    const text = `Hi ${details.customerName || 'Food Lover'},\n\nA refund has been processed for your order.\n\n` +
        orderDetailsBlockText(details) +
        `Refund ID: ${refundId}\n${reason ? `Reason: ${reason}\n` : ''}\n` +
        `The amount will be credited to your original payment method within 5-7 business days.\n\n— The Hungry Lab Team`;
    const html = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#10b981;margin-top:0;">Refund Processed</h2>
            <p>Hi <strong>${details.customerName || 'Food Lover'}</strong>, a refund has been processed for your order.</p>
            <div style="background:#f0fdf4;padding:12px;border-radius:8px;border-left:4px solid #10b981;margin:12px 0;">
                <p style="margin:4px 0;"><strong>Refund ID:</strong> ${refundId}</p>
                ${reason ? `<p style="margin:4px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            ${orderDetailsBlockHtml(details)}
            <p style="font-size:0.9em;color:#64748b;">Refund will be credited within 5-7 business days. Questions? Call <strong>+91 ${supportPhone}</strong>.</p>
        </div>
    `;
    try {
        const transporter = getTransporter();
        if (!transporter) { console.log(`[EmailService] Simulated refund email to ${toEmail} for Order #${details.orderId}`); return; }
        await transporter.sendMail({ from: `"The Hungry Lab" <${fromEmail}>`, to: toEmail, subject, text, html, attachments });
    } catch (error) {
        console.error(`[EmailService] Failed to send refund notification to ${toEmail}:`, error);
    }
};

export const sendCancellationNotification = async (
    toEmail: string,
    details: OrderEmailDetails,
    reason?: string,
    refunded?: boolean,
    refundId?: string,
    attachments?: any[]
) => {
    const fromEmail = getFromEmail();
    const supportPhone = getSupportPhone();
    const subject = `The Hungry Lab: Order #${details.orderId} ${refunded ? 'Cancelled & Refund Initiated' : 'Cancelled'}`;
    const text = `Hi ${details.customerName || 'Food Lover'},\n\nYour order has been cancelled.\n\n` +
        orderDetailsBlockText(details) +
        `${reason ? `Reason: ${reason}\n` : ''}` +
        (refunded ? `Refund ID: ${refundId || 'N/A'}\nRefund will be credited within 5-7 business days.\n` : '') +
        `\n— The Hungry Lab Team`;
    const html = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:640px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#dc2626;margin-top:0;">Order Cancelled</h2>
            <p>Hi <strong>${details.customerName || 'Food Lover'}</strong>, your order has been cancelled.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            ${refunded ? `<p style="color:#059669;font-weight:600;">Refund initiated${refundId ? ` (Refund ID: ${refundId})` : ''}. Amount will be credited within 5-7 business days.</p>` : ''}
            ${orderDetailsBlockHtml(details)}
            <p style="font-size:0.9em;color:#64748b;">Questions? Call <strong>+91 ${supportPhone}</strong> or email <strong>${fromEmail}</strong>.</p>
        </div>
    `;
    try {
        const transporter = getTransporter();
        if (!transporter) { console.log(`[EmailService] Simulated cancellation email to ${toEmail} for Order #${details.orderId}`); return; }
        await transporter.sendMail({ from: `"The Hungry Lab" <${fromEmail}>`, to: toEmail, subject, text, html, attachments });
    } catch (error) {
        console.error(`[EmailService] Failed to send cancellation notification to ${toEmail}:`, error);
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

    const adminSubject = `[Inquiry #${inquiry.ticketId}] New Contact Message: ${inquiry.category}`;
    const adminText = `New customer inquiry received:\n\nTicket ID: #${inquiry.ticketId}\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nSubject: ${inquiry.category}\nOrder Ref: ${inquiry.orderId || 'N/A'}\n\nMessage:\n${inquiry.message}`;

    try {
        const transporter = getTransporter();
        if (!transporter) { console.log(`[EmailService] Logged inquiry #${inquiry.ticketId}`); return; }
        await transporter.sendMail({ from: `"The Hungry Lab Website" <${fromEmail}>`, to: supportEmail, subject: adminSubject, text: adminText });
        await transporter.sendMail({
            from: `"The Hungry Lab Support" <${fromEmail}>`,
            to: inquiry.email,
            subject: `We've received your message [Ticket #${inquiry.ticketId}]`,
            text: `Hi ${inquiry.name},\n\nWe have received your message regarding "${inquiry.category}". Ticket: #${inquiry.ticketId}. Our team will reply within 2 hours.\n\n— The Hungry Lab Team`
        });
    } catch (error) {
        console.error(`[EmailService] Error dispatching inquiry email #${inquiry.ticketId}:`, error);
    }
};

