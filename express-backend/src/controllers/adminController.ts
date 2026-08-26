import { Request, Response } from 'express';
import prisma from '../config/db';
import redis from '../config/redis';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APP_KEY || ''
    }
});

// Helper for resetting Menu cache
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

// -- ORDERS --
export const getActiveOrders = async (req: Request, res: Response) => {
    try {
        const activeOrders = await prisma.order.findMany({
            where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } },
            include: { user: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activeOrders);
    } catch (e: any) { res.status(500).json(e.message); }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { user: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (e: any) { res.status(500).json(e.message); }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.query;
        const order = await prisma.order.update({
            where: { id: Number(id) },
            data: { status: String(status) }
        });
        res.json(order);
    } catch (e: any) { res.status(400).json(e.message); }
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
        const { name, price } = req.body;
        const addon = await prisma.addon.create({ data: { name, price: Number(price) } });
        await invalidateMenuCache();
        res.json(addon);
    } catch (e: any) { console.log(e); res.status(400).json(e.message); }
};

export const updateAddon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;
        const addon = await prisma.addon.update({
            where: { id: Number(id) },
            data: { name, price: Number(price) }
        });
        await invalidateMenuCache();
        res.json(addon);
    } catch (e: any) { console.log(e); res.status(400).json(e.message); }
};


// -- MENU ITEMS --
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        // Vue frontend sends `isVeg`, `addonList` (array of full addon objects, not just IDs)
        const { category, name, desc, price, isVeg, imageUrl, addonList } = req.body;
        
        const menuItem = await prisma.menuItem.create({
            data: {
                category, 
                name, 
                desc, 
                price: Number(price), 
                veg: Boolean(isVeg), 
                imageUrl,
                addons: { 
                    connect: addonList ? addonList.map((addon: any) => ({ id: addon.id })) : [] 
                }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    } catch (e: any) { 
        console.log("Menu Create Error:", e);
        res.status(400).json(e.message); 
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { category, name, desc, price, isVeg, imageUrl, addonList } = req.body;
        
        const menuItem = await prisma.menuItem.update({
            where: { id: Number(id) },
            data: {
                category, 
                name, 
                desc, 
                price: Number(price), 
                veg: Boolean(isVeg), 
                imageUrl,
                addons: { 
                    set: addonList ? addonList.map((addon: any) => ({ id: addon.id })) : [] 
                }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    } catch (e: any) { 
        console.log("Menu Update Error:", e);
        res.status(400).json(e.message); 
    }
};


// -- B2 UPLOAD (PRESIGNED URL) --
export const getUploadUrl = async (req: Request, res: Response) => {
    try {
        const { filename, contentType } = req.query;
        if (!filename) return res.status(400).json({ error: "Filename required" });

        const objectKey = `menu-images/${crypto.randomUUID()}-${filename}`;
        
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
            Key: objectKey,
            ContentType: String(contentType || 'image/png')
        });

        // Expires in 5 minutes (user must upload immediately)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        
        // Return both uploadUrl and finalUrl so frontend can save it
        res.json({ uploadUrl: presignedUrl, finalUrl: objectKey });
    } catch (e: any) { 
        res.status(500).json({ error: e.message }); 
    }
};

// -- COUPONS --
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await prisma.coupon.create({ data: req.body });
        res.json(coupon);
    } catch (e: any) { res.status(400).json(e.message); }
};
