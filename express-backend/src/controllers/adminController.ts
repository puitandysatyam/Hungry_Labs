import { Request, Response } from 'express';
import prisma from '../config/db';
import redis from '../config/redis';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, generatePresignedUrl, getBucketName } from '../utils/s3';
import { isCloudinaryConfigured, generateCloudinarySignature, uploadToCloudinary } from '../utils/cloudinary';
import { initiateRefund } from '../services/paymentService';
import { sendRefundNotification } from '../services/emailService';
import { getInvoicePdfBuffer } from '../services/invoiceService';
import { cleanupStalePendingOrders, adminUpdateOrderStatus as adminUpdateOrderStatusService } from '../services/orderService';

const invalidateMenuCache = async () => {
    if (redis) {
        try {
            await redis.del("menuCache::allMenuItems");
            console.log("[Upstash] Admin changed Menu/Addon. Cache cleared!");
        } catch (e) {
            console.error("Failed to clear Upstash cache", e);
        }
    }
};

const invalidateCarouselCache = async () => {
    if (redis) {
        try {
            await redis.del("menuCache::carouselOptions");
            console.log("[Upstash] Admin changed Carousel. Cache cleared!");
        } catch(e) {}
    }
}

// -- ORDERS --
const formatOrder = (order: any) => ({
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    payment: order.payment ? {
        id: order.payment.id,
        status: order.payment.status,
        amount: order.payment.amount,
        razorpayOrderId: order.payment.razorpayOrderId,
        razorpayPaymentId: order.payment.razorpayPaymentId,
        refunded: order.payment.refunded,
        refundId: order.payment.refundId
    } : null,
    orderItemList: (order.orderItems || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        menuItem: item.menuItem,
        addonList: item.addons || []
    }))
});

export const getActiveOrders = async (req: Request, res: Response) => {
    try {
        const activeOrders = await prisma.order.findMany({
            where: { status: { in: ["PENDING", "PAID", "CONFIRMED", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY"] } },
            include: { user: true, payment: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activeOrders.map(formatOrder));
    } catch (e: any) { res.status(500).json(e.message); }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { user: true, payment: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders.map(formatOrder));
    } catch (e: any) { res.status(500).json(e.message); }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const status = String(req.query.status || req.body?.status || '').toUpperCase();
        const reason = req.body?.reason ? String(req.body.reason) : undefined;
        const result = await adminUpdateOrderStatusService(Number(id), status, reason);
        res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message || 'Failed to update status' }); }
};

// -- ADDONS --
export const getAddons = async (req: Request, res: Response) => {
    try {
        const addons = await prisma.addon.findMany();
        res.json(addons);
    } catch (e: any) { res.status(500).json(e.message); }
};

export const createAddon = async (req: Request, res: Response) => {
    try {
        const { name, price, calories, protein } = req.body;
        const addon = await prisma.addon.create({
            data: {
                name,
                price: Number(price),
                calories: calories !== undefined && calories !== null && calories !== '' ? Number(calories) : 0,
                protein: protein !== undefined && protein !== null && protein !== '' ? Number(protein) : 0
            }
        });
        await invalidateMenuCache();
        res.json(addon);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const updateAddon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, price, calories, protein } = req.body;
        const addon = await prisma.addon.update({
            where: { id: Number(id) },
            data: {
                name,
                price: Number(price),
                calories: calories !== undefined && calories !== null && calories !== '' ? Number(calories) : 0,
                protein: protein !== undefined && protein !== null && protein !== '' ? Number(protein) : 0
            }
        });
        await invalidateMenuCache();
        res.json(addon);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const deleteAddon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.addon.delete({
            where: { id: Number(id) }
        });
        await invalidateMenuCache();
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: "Cannot delete addon currently in use by an order." });
    }
};

// -- MENU ITEMS --
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const { category, name, desc, price, isVeg, imageUrl, addonList, calories, protein } = req.body;
        const menuItem = await prisma.menuItem.create({
            data: {
                category,
                name,
                desc,
                price: Number(price),
                veg: Boolean(isVeg),
                imageUrl,
                calories: calories !== undefined && calories !== null && calories !== '' ? Number(calories) : 0,
                protein: protein !== undefined && protein !== null && protein !== '' ? Number(protein) : 0,
                addons: { connect: addonList ? addonList.map((addon: any) => ({ id: addon.id })) : [] }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { category, name, desc, price, isVeg, imageUrl, addonList, calories, protein } = req.body;
        const menuItem = await prisma.menuItem.update({
            where: { id: Number(id) },
            data: {
                category,
                name,
                desc,
                price: Number(price),
                veg: Boolean(isVeg),
                imageUrl,
                calories: calories !== undefined && calories !== null && calories !== '' ? Number(calories) : 0,
                protein: protein !== undefined && protein !== null && protein !== '' ? Number(protein) : 0,
                addons: { set: addonList ? addonList.map((addon: any) => ({ id: addon.id })) : [] }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.menuItem.delete({
            where: { id: Number(id) }
        });
        await invalidateMenuCache();
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: "Cannot delete menu item currently attached to an order." });
    }
};

// -- CAROUSEL OPTIONS --
export const getCarouselImages = async (req: Request, res: Response) => {
    try {
        const images = await prisma.carouselImage.findMany({ orderBy: { order: 'asc' } });
        const formattedImages = await Promise.all(images.map(async (slide) => ({
            ...slide,
            imageUrl: await generatePresignedUrl(slide.imageUrl)
        })));
        res.json(formattedImages);
    } catch (e: any) { res.status(500).json(e.message); }
};

export const createCarouselImage = async (req: Request, res: Response) => {
    try {
        const { imageUrl, active, order } = req.body;
        const image = await prisma.carouselImage.create({
            data: { imageUrl, active: Boolean(active), order: Number(order || 0) }
        });
        await invalidateCarouselCache();
        res.json(image);
    } catch (e: any) { 
        console.error("FATAL CREATE CAROUSEL:", e);
        res.status(400).json({ error: e.message || String(e) }); 
    }
};

export const updateCarouselImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl, active, order } = req.body;
        const image = await prisma.carouselImage.update({
            where: { id: Number(id) },
            data: { imageUrl, active: Boolean(active), order: Number(order || 0) }
        });
        await invalidateCarouselCache();
        res.json(image);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const deleteCarouselImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.carouselImage.delete({ where: { id: Number(id) } });
        await invalidateCarouselCache();
        res.json({ success: true });
    } catch (e: any) { res.status(400).json(e.message); }
};

// -- CLOUD STORAGE UPLOAD (CLOUDINARY / B2) --
export const getUploadUrl = async (req: Request, res: Response) => {
    try {
        const { filename, contentType, folder = 'hungry-lab/menu' } = req.query;

        // Preferred: Cloudinary Edge CDN direct signed upload
        if (isCloudinaryConfigured()) {
            const cloudinaryData = generateCloudinarySignature(String(folder));
            return res.json({
                provider: 'cloudinary',
                ...cloudinaryData
            });
        }

        // Fallback: Legacy B2 S3 storage
        if (!filename) return res.status(400).json({ error: "Filename required" });

        const objectKey = `menu-images/${crypto.randomUUID()}-${filename}`;
        
        const command = new PutObjectCommand({
            Bucket: getBucketName(),
            Key: objectKey,
            ContentType: String(contentType || 'image/png')
        });
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        res.json({ provider: 'b2', uploadUrl: presignedUrl, finalUrl: objectKey });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const uploadDirectToCloudinary = async (req: Request, res: Response) => {
    try {
        const { image, folder = 'hungry-lab/menu' } = req.body;
        if (!image) {
            return res.status(400).json({ error: "Image data is required." });
        }
        const finalUrl = await uploadToCloudinary(image, String(folder));
        res.json({ success: true, url: finalUrl });
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Cloudinary upload failed." });
    }
};

// -- COUPONS --
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await prisma.coupon.create({ data: req.body });
        res.json(coupon);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await prisma.coupon.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(coupon);
    } catch (e: any) { res.status(400).json(e.message); }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.coupon.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: "Cannot delete coupon." }); }
};

// -- ADMIN REFUND --
/**
 * Admin-initiated refund for a paid order.
 * POST /api/admin/payment/refund/:orderId
 * Body: { amount? (paise), reason? }
 * No refund allowed once order is OUT_FOR_DELIVERY or DELIVERED.
 */
export const adminRefund = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { amount, reason } = req.body;

        const id = Number(orderId);
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Valid order ID is required." });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { payment: true, orderItems: { include: { menuItem: true, addons: true } } }
        });
        if (!order) return res.status(404).json({ error: "Order not found." });
        if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
            return res.status(400).json({ error: "Refund not allowed once the order is out for delivery or delivered." });
        }
        if (!order.payment || order.payment.status !== 'SUCCESS') {
            return res.status(400).json({ error: "Only successfully paid orders can be refunded." });
        }
        if (order.payment.refunded || order.status === 'REFUNDED') {
            return res.status(400).json({ error: "This order is already refunded." });
        }

        const refundReason = reason || "Admin-initiated refund";
        const result = await initiateRefund({ orderId: id, amount, reason: refundReason });

        const items = (order.orderItems || []).map((item: any) => {
            const unitPrice = item.menuItem?.price ?? 0;
            const addons = (item.addons || []).map((a: any) => ({ name: a.name, price: a.price }));
            const addonTotal = addons.reduce((s: number, a: any) => s + a.price, 0);
            return { name: item.menuItem?.name || 'Item', quantity: item.quantity, unitPrice, addons, lineTotal: (unitPrice + addonTotal) * item.quantity };
        });
        const subtotal = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
        const details = {
            orderId: order.id,
            customerName: order.customerName || 'Food Lover',
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone || '',
            deliveryAddress: order.deliveryAddress || '',
            items,
            subtotal,
            totalAmount: order.totalAmount,
            status: 'REFUNDED',
            paymentId: order.payment.razorpayPaymentId || 'N/A',
            refundId: result.refundId
        };

        if (order.customerEmail) {
            const inv = await getInvoicePdfBuffer(id).catch(() => null);
            await sendRefundNotification(
                order.customerEmail,
                details,
                result.refundId,
                refundReason,
                inv ? [{ filename: `invoice-${inv.invoiceNumber}.pdf`, content: inv.buffer, contentType: 'application/pdf' }] : []
            ).catch(err => console.error("[AdminRefund] Refund email failed:", err));
        }

        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message || "Refund failed." });
    }
};

// -- STALE ORDER CLEANUP --
const CLEANUP_THROTTLE_KEY = "cron::cleanup-pending-last-run";
const CLEANUP_MIN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
let lastCleanupRunAt = 0;

/**
 * Cleanup stale PENDING orders older than 30 minutes.
 * POST /api/admin/orders/cleanup-pending (can be triggered by Vercel cron or admin)
 * Throttled to run at most once every 30 minutes.
 */
export const cleanupPendingOrders = async (req: Request, res: Response) => {
    try {
        const now = Date.now();
        let lastRun = lastCleanupRunAt;

        if (redis) {
            try {
                const stored = await redis.get<number | string>(CLEANUP_THROTTLE_KEY);
                if (stored) lastRun = Number(stored);
            } catch {}
        }

        if (now - lastRun < CLEANUP_MIN_INTERVAL_MS) {
            const nextEligibleInMs = CLEANUP_MIN_INTERVAL_MS - (now - lastRun);
            return res.status(200).json({
                success: true,
                skipped: true,
                message: `Cleanup throttled. Next eligible in ${Math.ceil(nextEligibleInMs / 60000)} minutes.`,
                lastRunAt: lastRun ? new Date(lastRun).toISOString() : null
            });
        }

        const result = await cleanupStalePendingOrders();

        lastCleanupRunAt = now;
        if (redis) {
            try {
                await redis.set(CLEANUP_THROTTLE_KEY, String(now), { ex: 3600 });
            } catch {}
        }

        res.json({
            success: true,
            skipped: false,
            message: `Processed ${result.total} stale orders: ${result.refunded} refunded, ${result.cancelled} cancelled`,
            ...result
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Cleanup failed." });
    }
};

// -- PAYMENT RECONCILIATION REPORT --
/**
 * Reconcile local payment records with Razorpay state.
 * GET /api/admin/payments/reconcile
 * Flags orders where payment status doesn't match order status.
 */
export const reconcilePayments = async (req: Request, res: Response) => {
    try {
        // Get all orders with payments
        const orders = await prisma.order.findMany({
            include: {
                payment: true,
                orderItems: { include: { menuItem: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mismatches = orders.map(order => {
            const payment = order.payment;
            let issue: string | null = null;
            let severity: 'info' | 'warning' | 'error' = 'info';

                if (!payment) {
                    issue = "No payment record exists for this order";
                    severity = ['CONFIRMED', 'PAID', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) ? 'error' : 'warning';
                } else if (payment.status === 'SUCCESS' && !['CONFIRMED', 'PAID', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUNDED'].includes(order.status)) {
                    issue = "Payment is SUCCESS but order status does not reflect a paid/active state";
                    severity = 'error';
                } else if (payment.status === 'FAILED' && ['CONFIRMED', 'PAID', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
                    issue = "Payment is FAILED but order is in an active/confirmed state";
                    severity = 'error';
            } else if (order.status === 'PENDING' && payment && payment.status === 'CREATED') {
                // Check if order is older than 30 min
                const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                if (ageMinutes > 30) {
                    issue = "Payment CREATED but order stuck in PENDING for >30 min";
                    severity = 'warning';
                }
            } else if (payment && payment.refunded && order.status !== 'REFUNDED') {
                issue = "Payment marked refunded but order status not updated";
                severity = 'warning';
            }

            return issue ? {
                orderId: order.id,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                orderStatus: order.status,
                paymentStatus: payment?.status || 'NONE',
                amount: order.totalAmount,
                razorpayOrderId: payment?.razorpayOrderId || null,
                razorpayPaymentId: payment?.razorpayPaymentId || null,
                refunded: payment?.refunded || false,
                issue,
                severity,
                createdAt: order.createdAt
            } : null;
        }).filter(Boolean);

        res.json({
            totalOrders: orders.length,
            mismatchesCount: mismatches.length,
            mismatches: mismatches as any[]
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Reconciliation failed." });
    }
};
