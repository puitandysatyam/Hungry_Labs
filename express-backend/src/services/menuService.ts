import prisma from '../config/db';
import redis from '../config/redis';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APP_KEY || ''
    }
});

const generatePresignedUrl = async (objectKey: string | null) => {
    if (!objectKey) return null;
    
    // If it's already an absolute URL (like a placeholder) or base64, return it natively
    if (objectKey.startsWith('http') || objectKey.startsWith('data:')) return objectKey;

    try {
        const decodedKey = decodeURIComponent(objectKey); // Important B2 fix!
        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
            Key: decodedKey
        });
        
        // Match Java format: 2 hour expiration
        return await getSignedUrl(s3Client, command, { expiresIn: 7200 });
    } catch (e) {
        console.error("Presign error:", e);
        return null;
    }
}

export const getMenu = async () => {
    const CACHE_KEY = "menuCache::allMenuItems";

    if (redis) {
        try {
            const cachedMenu = await redis.get(CACHE_KEY);
            if (cachedMenu) {
                console.log("[Upstash Redis] CACHE HIT! Serving menu from memory.");
                return cachedMenu;
            }
            console.log("[Upstash Redis] CACHE MISS. Fetching from database...");
        } catch (error) {
            console.error("Redis Cache Error:", error);
        }
    }

    const items = await prisma.menuItem.findMany({
        include: { addons: true }
    });
    
    // Use Promise.all to map async presigned URLs cleanly
    const formattedMenu = await Promise.all(items.map(async (item) => ({
        id: item.id,
        category: item.category,
        name: item.name,
        desc: item.desc, 
        price: item.price,
        veg: item.veg,
        imageUrl: await generatePresignedUrl(item.imageUrl),
        addonList: item.addons.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price
        }))
    })));

    if (redis) {
        try {
            await redis.set(CACHE_KEY, JSON.stringify(formattedMenu), { ex: 3600 });
            console.log("[Upstash Redis] Database payload cached successfully.");
        } catch (error) {
            console.error("Redis Write Error:", error);
        }
    }

    return formattedMenu;
};