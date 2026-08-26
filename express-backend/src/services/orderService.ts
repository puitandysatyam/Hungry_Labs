import prisma from '../config/db';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export const applyCoupon = async (code: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
        return { valid: false, message: "Invalid coupon", discountType: null, discountValue: null, minOrderValue: null };
    }
    
    // Prisma Date/Boolean fixes
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

export const placeOrder = async (data: any) => {
    // 1. Calculate actual price (Preventing frontend manipulation)
    let calculatedTotal = 0;

    for (let item of data.items) {
        const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
        if (!menuItem) throw new Error("Menu item not found");
        
        let itemTotal = menuItem.price;
        
        // Add addons prices
        if (item.selectedAddOnIds && item.selectedAddOnIds.length > 0) {
            const addons = await prisma.addon.findMany({ where: { id: { in: item.selectedAddOnIds } } });
            addons.forEach(a => itemTotal += a.price);
        }
        
        calculatedTotal += (itemTotal * item.quantity);
    }

    // 2. Apply coupon logic (if passed)
    if (data.couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
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

    // 3. Create DB Order (in a transaction to ensure rollback on failure)
    const orderData = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
            data: {
                customerId: data.userId || null, 
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                deliveryAddress: data.deliveryAddress,
                totalAmount: calculatedTotal,
                status: "PENDING"
            }
        });

        // Create Order items and link addons
        for (let item of data.items) {
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    addons: {
                        connect: (item.selectedAddOnIds || []).map((id: number) => ({ id }))
                    }
                }
            });
        }
        
        return order;
    });

    // 4. Razorpay Integration (Math.round protection against floating points)
    const rzpOrder = await razorpay.orders.create({
        amount: Math.round(calculatedTotal * 100), // PAISE
        currency: "INR",
        receipt: `receipt_order_${orderData.id}`
    });

    // 5. Create Payment record mapping Razorpay Order to Local Order
    await prisma.payment.create({
        data: {
            orderId: orderData.id,
            razorpayOrderId: rzpOrder.id,
            status: "CREATED"
        }
    });

    // Return exact mapping to OrderResponseDto
    return {
        orderId: orderData.id,
        status: orderData.status,
        etaMinutes: 30,
        razorpayOrderId: rzpOrder.id
    };
};