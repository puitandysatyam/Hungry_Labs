import prisma from '../config/db';
import Razorpay from 'razorpay';
import { initiateRefund } from './paymentService';
import { sendRefundNotification } from './emailService';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Helper to resolve coupon from DB or standard promo offers
const resolveCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    let coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (!coupon) {
        if (cleanCode === 'HUNGRY10') {
            coupon = { id: 0, code: 'HUNGRY10', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 100, active: true };
        } else if (cleanCode === 'WELCOME50') {
            coupon = { id: 0, code: 'WELCOME50', discountType: 'FLAT', discountValue: 50, minOrderValue: 200, active: true };
        }
    }
    return coupon;
};

export const applyCoupon = async (code: string) => {
    const coupon = await resolveCoupon(code);
    if (!coupon) {
        return { valid: false, message: "Invalid coupon", discountType: null, discountValue: null, minOrderValue: null };
    }
    
    if (!coupon.active) {
        return { valid: false, message: "Coupon is no longer active", discountType: null, discountValue: null, minOrderValue: null };
    }

    return {
        valid: true,
        message: "Coupon applied!",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue
    };
};

export const placeOrder = async (data: any, authenticatedUserId?: number) => {
    // 1. Rigorous Input Validation
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("Order must contain at least one item.");
    }

    const customerName = (data.customerName || '').trim();
    const customerEmail = (data.customerEmail || '').trim();
    const customerPhone = (data.customerPhone || '').trim();
    const deliveryAddress = (data.deliveryAddress || '').trim();

    if (!customerName || customerName.length > 100) {
        throw new Error("Valid customer name is required (max 100 characters).");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
        throw new Error("A valid email address is required for order confirmation.");
    }

    const phoneRegex = /^[0-9+ -]{10,15}$/;
    if (!customerPhone || !phoneRegex.test(customerPhone)) {
        throw new Error("A valid 10-digit mobile number is required for delivery.");
    }

    if (!deliveryAddress || deliveryAddress.length < 5 || deliveryAddress.length > 500) {
        throw new Error("A valid delivery address is required (5 to 500 characters).");
    }

    // 2. Calculate actual price strictly on backend (Preventing frontend tampering)
    let calculatedTotal = 0;
    const validatedItems: Array<{
        menuItemId: number;
        quantity: number;
        selectedAddOnIds: number[];
    }> = [];

    for (let item of data.items) {
        const menuItemId = Number(item.menuItemId);
        const quantity = Number(item.quantity);

        if (!menuItemId || isNaN(menuItemId)) {
            throw new Error("Invalid menu item ID.");
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            throw new Error(`Invalid quantity for item: must be an integer between 1 and 50.`);
        }

        const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
        if (!menuItem) {
            throw new Error(`Menu item #${menuItemId} not found.`);
        }
        
        let itemTotal = menuItem.price;
        const validAddOnIds: number[] = [];

        // Validate and sum addons prices
        if (Array.isArray(item.selectedAddOnIds) && item.selectedAddOnIds.length > 0) {
            const cleanAddonIds = item.selectedAddOnIds
                .map((id: any) => Number(id))
                .filter((id: number) => !isNaN(id) && id > 0);

            if (cleanAddonIds.length > 0) {
                const addons = await prisma.addon.findMany({ where: { id: { in: cleanAddonIds } } });
                addons.forEach(a => {
                    itemTotal += a.price;
                    validAddOnIds.push(a.id);
                });
            }
        }
        
        calculatedTotal += (itemTotal * quantity);
        validatedItems.push({
            menuItemId,
            quantity,
            selectedAddOnIds: validAddOnIds
        });
    }

    // 3. Apply coupon logic (if passed)
    if (data.couponCode) {
        const coupon = await resolveCoupon(String(data.couponCode));
        if (coupon && calculatedTotal >= coupon.minOrderValue && coupon.active) {
            if (coupon.discountType === 'FLAT') {
                calculatedTotal -= coupon.discountValue;
            } else if (coupon.discountType === 'PERCENTAGE') {
                calculatedTotal -= (calculatedTotal * (coupon.discountValue / 100));
            }
            // Math.max protection to prevent Razorpay crashing on zero balance
            calculatedTotal = Math.max(1.0, calculatedTotal);
        }
    }

    // 4. Secure customer ID attribution (Prefer verified JWT identity over request body)
    const finalCustomerId = authenticatedUserId ?? (data.userId ? Number(data.userId) : null);

    // 5. Create DB Order & Razorpay Order atomically
    const orderData = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: {
                customerId: finalCustomerId, 
                customerName,
                customerEmail,
                customerPhone,
                deliveryAddress,
                totalAmount: Math.round(calculatedTotal * 100) / 100,
                status: "PENDING"
            }
        });

        for (let item of validatedItems) {
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    addons: {
                        connect: item.selectedAddOnIds.map((id: number) => ({ id }))
                    }
                }
            });
        }
        
        return order;
    });

    // 6. Create Razorpay Order
    let rzpOrder;
    try {
        rzpOrder = await razorpay.orders.create({
            amount: Math.round(calculatedTotal * 100), // PAISE
            currency: "INR",
            receipt: `receipt_order_${orderData.id}`
        });
    } catch (rzpErr: any) {
        // Rollback local order state if Razorpay fails
        await prisma.order.update({
            where: { id: orderData.id },
            data: { status: "FAILED" }
        });
        console.error("[Razorpay API Error]:", rzpErr);
        throw new Error("Unable to initialize payment gateway. Please try again.");
    }

    // 7. Create Payment record mapping Razorpay Order to Local Order
    await prisma.payment.create({
        data: {
            orderId: orderData.id,
            razorpayOrderId: rzpOrder.id,
            status: "CREATED",
            amount: Math.round(calculatedTotal * 100)
        }
    });

    return {
        orderId: orderData.id,
        status: orderData.status,
        etaMinutes: 30,
        razorpayOrderId: rzpOrder.id,
        amount: calculatedTotal
    };
};

/**
 * Cleanup stale PENDING orders older than 30 minutes.
 * - If payment was captured by Razorpay but order never confirmed → auto-refund
 * - If no payment at all → mark order as CANCELLED
 * Returns summary of actions taken.
 */
export const cleanupStalePendingOrders = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const staleOrders = await prisma.order.findMany({
        where: {
            status: "PENDING",
            createdAt: { lt: thirtyMinutesAgo }
        },
        include: {
            payment: true,
            orderItems: { include: { menuItem: true } }
        },
        orderBy: { createdAt: 'asc' }
    });

    const results = {
        total: staleOrders.length,
        refunded: 0,
        cancelled: 0,
        errors: [] as string[]
    };

    for (const order of staleOrders) {
        try {
            const payment = order.payment;

            if (payment && payment.status === 'SUCCESS' && payment.razorpayPaymentId) {
                // Payment was captured but order never confirmed — auto-refund
                await initiateRefund({
                    orderId: order.id,
                    amount: payment.amount,
                    reason: "Auto-refund: Order stuck in PENDING beyond 30-minute window"
                });

                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: "REFUNDED" }
                });

                // Send refund notification email
                if (order.customerEmail) {
                    await sendRefundNotification(
                        order.customerEmail,
                        order.customerName || 'Food Lover',
                        order.id,
                        order.totalAmount,
                        payment.refundId || payment.razorpayPaymentId,
                        "Auto-refund: Order stuck in PENDING beyond 30-minute window"
                    ).catch(err => console.error("[Cleanup] Refund email failed:", err));
                }

                results.refunded++;
            } else {
                // No successful payment — cancel the order
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: "CANCELLED" }
                });

                // Mark payment as failed if exists
                if (payment && payment.status !== 'FAILED') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: "FAILED" }
                    });
                }

                results.cancelled++;
            }
        } catch (err: any) {
            results.errors.push(`Order #${order.id}: ${err.message}`);
            console.error(`[Cleanup] Error processing order #${order.id}:`, err);
        }
    }

    return results;
};

/**
 * Cancel an order. Only allowed while status is CONFIRMED (before kitchen starts preparing).
 * If already paid, triggers a refund.
 */
export const cancelOrder = async (orderId: number, reason?: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true }
    });

    if (!order) {
        throw new Error(`Order #${orderId} not found.`);
    }

    if (order.status === 'CANCELLED') {
        throw new Error(`Order #${orderId} is already cancelled.`);
    }

    if (order.status === 'DELIVERED') {
        throw new Error(`Cannot cancel order #${orderId} — already delivered.`);
    }

    if (order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY') {
        throw new Error(`Cannot cancel order #${orderId} — already being prepared/dispatched.`);
    }

    // If paid and successful, initiate refund
    if (order.payment && order.payment.status === 'SUCCESS' && order.payment.razorpayPaymentId) {
        await initiateRefund({
            orderId: order.id,
            amount: order.payment.amount,
            reason: reason || "Customer cancelled order"
        });

        await sendRefundNotification(
            order.customerEmail || '',
            order.customerName || 'Food Lover',
            order.id,
            order.totalAmount,
            order.payment.refundId || order.payment.razorpayPaymentId,
            reason || "Customer cancelled order"
        ).catch(err => console.error("[CancelOrder] Refund email failed:", err));
    }

    // Mark order as cancelled
    await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
    });

    // Mark payment as failed if not already
    if (order.payment && order.payment.status !== 'FAILED' && order.payment.status !== 'SUCCESS') {
        await prisma.payment.update({
            where: { id: order.payment.id },
            data: { status: "FAILED" }
        });
    }

    return {
        orderId: order.id,
        status: "CANCELLED",
        refunded: order.payment?.status === 'SUCCESS',
        reason: reason || "Customer cancelled order"
    };
};
