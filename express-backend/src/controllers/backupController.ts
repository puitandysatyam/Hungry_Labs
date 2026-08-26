import { Request, Response } from 'express';
import prisma from '../config/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APP_KEY || ''
    }
});

export const createBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        // Authorize request via Vercel CRON_SECRET or Admin token (if called manually)
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;
        
        // Skip auth check only if CRON_SECRET is missing locally, but enforce it in prod
        if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            res.status(401).json({ error: 'Unauthorized CRON request' });
            return;
        }

        console.log("Starting DB Backup...");

        // Fetch all tables
        const [
            users,
            menuItems,
            addons,
            orders,
            orderItems,
            payments,
            coupons,
            carouselImages
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.menuItem.findMany(),
            prisma.addon.findMany(),
            prisma.order.findMany(),
            prisma.orderItem.findMany(),
            prisma.payment.findMany(),
            prisma.coupon.findMany(),
            prisma.carouselImage.findMany()
        ]);

        const dbDump = {
            timestamp: new Date().toISOString(),
            data: {
                users,
                menuItems,
                addons,
                orders,
                orderItems,
                payments,
                coupons,
                carouselImages
            }
        };

        const jsonString = JSON.stringify(dbDump, null, 2);
        
        // Upload to B2
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `backups/db-backup-${dateStr}-${crypto.randomUUID().slice(0, 8)}.json`;

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
            Key: filename,
            Body: jsonString,
            ContentType: 'application/json'
        });

        await s3Client.send(command);

        console.log(`Backup completed successfully: ${filename}`);
        res.status(200).json({ success: true, filename });
    } catch (error: any) {
        console.error("Backup failed:", error);
        res.status(500).json({ error: error.message });
    }
};

