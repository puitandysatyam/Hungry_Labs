import { Request, Response } from 'express';
import prisma from '../config/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || ''
    }
});

export const createBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;

        // Security: Always require CRON_SECRET for database backups
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            res.status(401).json({ error: 'Unauthorized request: Valid CRON_SECRET required.' });
            return;
        }

        console.log("Starting DB Backup...");

        // Fetch all tables (explicitly omit password hashes from user export for safety)
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
            prisma.user.findMany({
                select: { id: true, name: true, email: true, phone: true, role: true }
            }),
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
            Bucket: process.env.B2_BUCKET_NAME || process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
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
