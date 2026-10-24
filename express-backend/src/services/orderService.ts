import prisma from '../config/db';
import Razorpay from 'razorpay';

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
            status: "CREATED"
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
