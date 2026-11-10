import prisma from '../config/db';
import Razorpay from 'razorpay';
import { initiateRefund } from './paymentService';
import { sendRefundNotification, sendCancellationNotification } from './emailService';
import { getInvoicePdfBuffer } from './invoiceService';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

const resolveCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    let coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (!coupon) {
        if (cleanCode === 'HUNGRY10') {
            coupon = { id: 0, code: 'HUNGRY10', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 100, active: true } as any;
        } else if (cleanCode === 'WELCOME50') {
            coupon = { id: 0, code: 'WELCOME50', discountType: 'FLAT', discountValue: 50, minOrderValue: 200, active: true } as any;
        }
    }
    return coupon;
};

export const applyCoupon = async (code: string) => {
    const coupon = await resolveCoupon(code);
    if (!coupon) return { valid: false, message: "Invalid coupon", discountType: null, discountValue: null, minOrderValue: null };
    if (!coupon.active) return { valid: false, message: "Coupon is no longer active", discountType: null, discountValue: null, minOrderValue: null };
    return { valid: true, message: "Coupon applied!", discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderValue: coupon.minOrderValue };
};

export const placeOrder = async (data: any, authenticatedUserId?: number) => {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) throw new Error("Order must contain at least one item.");
    const customerName = (data.customerName || '').trim();
    const customerEmail = (data.customerEmail || '').trim();
    const customerPhone = (data.customerPhone || '').trim();
    const deliveryAddress = (data.deliveryAddress || '').trim();
    if (!customerName || customerName.length > 100) throw new Error("Valid customer name is required (max 100 characters).");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) throw new Error("A valid email address is required for order confirmation.");
    const phoneRegex = /^[0-9+ -]{10,15}$/;
    if (!customerPhone || !phoneRegex.test(customerPhone)) throw new Error("A valid 10-digit mobile number is required for delivery.");
    if (!deliveryAddress || deliveryAddress.length < 5 || deliveryAddress.length > 500) throw new Error("A valid delivery address is required (5 to 500 characters).");

    let calculatedTotal = 0;
    const validatedItems: Array<{ menuItemId: number; quantity: number; selectedAddOnIds: number[]; }> = [];

    for (let item of data.items) {
        const menuItemId = Number(item.menuItemId);
        const quantity = Number(item.quantity);
        if (!menuItemId || isNaN(menuItemId)) throw new Error("Invalid menu item ID.");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error(`Invalid quantity for item: must be an integer between 1 and 50.`);
        const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem) throw new Error(`Menu item #${menuItemId} not found.`);
        let itemTotal = menuItem.price;
        const validAddOnIds: number[] = [];
        if (Array.isArray(item.selectedAddOnIds) && item.selectedAddOnIds.length > 0) {
            const cleanAddonIds = item.selectedAddOnIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0);
            if (cleanAddonIds.length > 0) {
                const addons = await prisma.addon.findMany({ where: { id: { in: cleanAddonIds } } });
                addons.forEach(a => { itemTotal += a.price; validAddOnIds.push(a.id); });
            }
        }
        calculatedTotal += (itemTotal * quantity);
        validatedItems.push({ menuItemId, quantity, selectedAddOnIds: validAddOnIds });
    }

    if (data.couponCode) {
        const coupon = await resolveCoupon(String(data.couponCode));
        if (coupon && calculatedTotal >= coupon.minOrderValue && coupon.active) {
            if (coupon.discountType === 'FLAT') calculatedTotal -= coupon.discountValue;
            else if (coupon.discountType === 'PERCENTAGE') calculatedTotal -= (calculatedTotal * (coupon.discountValue / 100));
            calculatedTotal = Math.max(1.0, calculatedTotal);
        }
    }

    const finalCustomerId = authenticatedUserId ?? (data.userId ? Number(data.userId) : null);

    const orderData = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: { customerId: finalCustomerId, customerName, customerEmail, customerPhone, deliveryAddress, totalAmount: Math.round(calculatedTotal * 100) / 100, status: "PENDING" }
        });
        for (let item of validatedItems) {
            await tx.orderItem.create({
                data: { orderId: order.id, menuItemId: item.menuItemId, quantity: item.quantity, addons: { connect: item.selectedAddOnIds.map((id: number) => ({ id })) } }
            });
        }
        return order;
    });

    let rzpOrder;
    try {
        rzpOrder = await razorpay.orders.create({ amount: Math.round(calculatedTotal * 100), currency: "INR", receipt: `receipt_order_${orderData.id}` });
    } catch (rzpErr: any) {
        await prisma.order.update({ where: { id: orderData.id }, data: { status: "FAILED" } });
        console.error("[Razorpay API Error]:", rzpErr);
        throw new Error("Unable to initialize payment gateway. Please try again.");
    }

    await prisma.payment.create({ data: { orderId: orderData.id, razorpayOrderId: rzpOrder.id, status: "CREATED", amount: Math.round(calculatedTotal * 100) } });
    return { orderId: orderData.id, status: orderData.status, etaMinutes: 30, razorpayOrderId: rzpOrder.id, amount: calculatedTotal };
};

async function fetchOrderDetails(orderId: number) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true, orderItems: { include: { menuItem: true, addons: true } } }
    }) as any;
    if (!order) return null;
    const items = (order.orderItems || []).map((item: any) => {
        const unitPrice = item.menuItem?.price ?? 0;
        const addons = (item.addons || []).map((a: any) => ({ name: a.name, price: a.price }));
        const addonTotal = addons.reduce((s: number, a: any) => s + a.price, 0);
        return { name: item.menuItem?.name || 'Item', quantity: item.quantity, unitPrice, addons, lineTotal: (unitPrice + addonTotal) * item.quantity };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
    return {
        orderId: order.id,
        customerName: order.customerName || 'Food Lover',
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone || '',
        deliveryAddress: order.deliveryAddress || '',
        items,
        subtotal,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentId: order.payment?.razorpayPaymentId || 'N/A',
        refundId: order.payment?.refundId
    };
}

async function refundPaidOrder(orderId: number, reason: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order || !order.payment) return { refunded: false };
    if (order.payment.status !== 'SUCCESS' || !order.payment.razorpayPaymentId) return { refunded: false };
    if (order.payment.refunded) return { refunded: true, refundId: order.payment.refundId };
    try {
        const result = await initiateRefund({ orderId, amount: order.payment.amount, reason });
        return { refunded: true, refundId: result.refundId };
    } catch (e) {
        console.error(`[Refund] Failed for order #${orderId}:`, e);
        return { refunded: false };
    }
}

export const cleanupStalePendingOrders = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const staleOrders = await prisma.order.findMany({
        where: { status: "PENDING", createdAt: { lt: thirtyMinutesAgo } },
        include: { payment: true },
        orderBy: { createdAt: 'asc' }
    });
    const results = { total: staleOrders.length, refunded: 0, cancelled: 0, errors: [] as string[] };
    for (const order of staleOrders) {
        try {
            const payment = order.payment;
            if (payment && payment.status === 'SUCCESS' && payment.razorpayPaymentId) {
                const reason = "Auto-refund: Order stuck in PENDING beyond 30-minute window";
                const refundRes = await refundPaidOrder(order.id, reason);
                await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
                const details = await fetchOrderDetails(order.id);
                if (details?.customerEmail) {
                    const inv = await getInvoicePdfBuffer(order.id).catch(() => null);
                    await sendRefundNotification(
                        details.customerEmail,
                        details,
                        refundRes.refundId || payment.refundId || payment.razorpayPaymentId || 'N/A',
                        reason,
                        inv ? [{ filename: `invoice-${inv.invoiceNumber}.pdf`, content: inv.buffer, contentType: 'application/pdf' }] : []
                    ).catch(() => {});
                }
                results.refunded++;
            } else {
                await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
                if (payment && payment.status !== 'FAILED') await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
                results.cancelled++;
            }
        } catch (err: any) {
            results.errors.push(`Order #${order.id}: ${err.message}`);
        }
    }
    return results;
};

/**
 * Cancel order: allowed for PENDING/PAID/CONFIRMED/ACCEPTED (before preparing/out-for-delivery).
 * If paid, triggers automatic refund. Sends cancellation/refund email with details (+invoice if available).
 */
export const cancelOrder = async (orderId: number, reason?: string, cancelledBy: 'customer' | 'admin' | 'system' = 'customer') => {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error(`Order #${orderId} not found.`);
    if (['CANCELLED', 'REJECTED'].includes(order.status)) throw new Error(`Order #${orderId} is already ${order.status.toLowerCase()}.`);
    if (order.status === 'DELIVERED') throw new Error(`Cannot cancel order #${orderId} — already delivered.`);
    if (['PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)) throw new Error(`Cannot cancel order #${orderId} — it is already being prepared or out for delivery.`);
    if (order.status === 'REFUNDED') throw new Error(`Order #${orderId} is already refunded.`);

    const cancelReason = reason || (cancelledBy === 'admin' ? 'Cancelled by admin' : 'Cancelled by customer');
    const wasPaid = order.payment?.status === 'SUCCESS' && !!order.payment?.razorpayPaymentId;

    if (wasPaid) {
        const refundRes = await refundPaidOrder(orderId, cancelReason);
        await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
        const details = await fetchOrderDetails(orderId);
        if (details?.customerEmail) {
            const inv = await getInvoicePdfBuffer(orderId).catch(() => null);
            await sendRefundNotification(
                details.customerEmail,
                details,
                refundRes.refundId || 'N/A',
                cancelReason,
                inv ? [{ filename: `invoice-${inv.invoiceNumber}.pdf`, content: inv.buffer, contentType: 'application/pdf' }] : []
            ).catch(() => {});
        }
        return { orderId, status: 'REFUNDED', refunded: true, reason: cancelReason, refundId: refundRes.refundId };
    }

    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    if (order.payment && order.payment.status !== 'FAILED') {
        await prisma.payment.update({ where: { id: order.payment.id }, data: { status: "FAILED" } });
    }
    const details = await fetchOrderDetails(orderId);
    if (details?.customerEmail) {
        await sendCancellationNotification(details.customerEmail, details, cancelReason).catch(() => {});
    }
    return { orderId, status: 'CANCELLED', refunded: false, reason: cancelReason };
};

/**
 * Kitchen rejects an order (e.g. lack of ingredients) before preparing.
 * Triggers automatic refund if paid and notifies customer.
 */
export const rejectOrder = async (orderId: number, reason?: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error(`Order #${orderId} not found.`);
    if (['REJECTED', 'CANCELLED', 'REFUNDED', 'DELIVERED'].includes(order.status)) throw new Error(`Order #${orderId} cannot be rejected in ${order.status} state.`);
    if (['PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)) throw new Error(`Cannot reject order #${orderId} — preparation/delivery already started.`);

    const rejectReason = reason || 'Rejected by kitchen (e.g. ingredient unavailability)';
    const wasPaid = order.payment?.status === 'SUCCESS' && !!order.payment?.razorpayPaymentId;

    if (wasPaid) {
        const refundRes = await refundPaidOrder(orderId, rejectReason);
        await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
        const details = await fetchOrderDetails(orderId);
        if (details?.customerEmail) {
            const inv = await getInvoicePdfBuffer(orderId).catch(() => null);
            await sendRefundNotification(
                details.customerEmail,
                details,
                refundRes.refundId || 'N/A',
                `Order rejected: ${rejectReason}`,
                inv ? [{ filename: `invoice-${inv.invoiceNumber}.pdf`, content: inv.buffer, contentType: 'application/pdf' }] : []
            ).catch(() => {});
        }
        return { orderId, status: 'REFUNDED', refunded: true, reason: rejectReason, refundId: refundRes.refundId };
    }

    await prisma.order.update({ where: { id: orderId }, data: { status: "REJECTED" } });
    const details = await fetchOrderDetails(orderId);
    if (details?.customerEmail) {
        await sendCancellationNotification(details.customerEmail, details, `Order rejected: ${rejectReason}`).catch(() => {});
    }
    return { orderId, status: 'REJECTED', refunded: false, reason: rejectReason };
};

/**
 * Admin/kitchen status update with enforced workflow:
 * PAID/CONFIRMED -> ACCEPTED (kitchen accepts) -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
 * REJECTED/CANCELLED via dedicated actions.
 */
export const adminUpdateOrderStatus = async (orderId: number, status: string, reason?: string) => {
    const normalized = String(status || '').toUpperCase();
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error(`Order #${orderId} not found.`);

    if (normalized === 'REJECTED') return rejectOrder(orderId, reason);
    if (normalized === 'CANCELLED' || normalized === 'REFUNDED') return cancelOrder(orderId, reason, 'admin');

    const transitions: Record<string, string[]> = {
        PENDING: [],
        PAID: ['ACCEPTED', 'CONFIRMED'],
        CONFIRMED: ['ACCEPTED'],
        ACCEPTED: ['PREPARING'],
        PREPARING: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
        REJECTED: [],
        REFUNDED: [],
        FAILED: []
    };

    const allowed = transitions[order.status] || [];
    // allow ACCEPTED from CONFIRMED for backward compat, and CONFIRMED->ACCEPTED normalization
    const effectiveNext = normalized === 'CONFIRMED' && (order.status === 'PAID') ? 'ACCEPTED' : normalized;
    const allowedEffective = transitions[order.status] || [];
    if (!allowedEffective.includes(effectiveNext) && !(order.status === 'CONFIRMED' && effectiveNext === 'ACCEPTED')) {
        throw new Error(`Cannot move order #${orderId} from ${order.status} to ${normalized}.`);
    }

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status: effectiveNext } });
    return { orderId: updated.id, status: updated.status };
};
