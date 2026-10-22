import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { optimizeCloudinaryUrl } from './cloudinary';

export const s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || ''
    }
});

export const getBucketName = () => {
    return process.env.B2_BUCKET_NAME || process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles';
};

export const generatePresignedUrl = async (objectKey: string | null) => {
    if (!objectKey) return null;

    // High-speed CDN URLs (Cloudinary) - deliver instantly with next-gen auto optimization
    if (objectKey.includes('res.cloudinary.com')) {
        return optimizeCloudinaryUrl(objectKey);
    }

    // Static assets or external URLs
    if (objectKey.startsWith('http') || objectKey.startsWith('data:') || objectKey.startsWith('/')) {
        return objectKey;
    }

    // Legacy Backblaze B2 S3 storage fallback
    try {
        const decodedKey = decodeURIComponent(objectKey); 
        const command = new GetObjectCommand({
            Bucket: getBucketName(),
            Key: decodedKey
        });
        return await getSignedUrl(s3Client, command, { expiresIn: 7200 });
    } catch (e) {
        console.error("Presign error:", e);
        return null;
    }
};
