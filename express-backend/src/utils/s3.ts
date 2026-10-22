import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    if (objectKey.startsWith('http') || objectKey.startsWith('data:') || objectKey.startsWith('/')) return objectKey;

    try {
        const decodedKey = decodeURIComponent(objectKey); 
        const command = new GetObjectCommand({
            Bucket: getBucketName(),
            Key: decodedKey
        });
        // 2 hours expiration for cached media
        return await getSignedUrl(s3Client, command, { expiresIn: 7200 });
    } catch (e) {
        console.error("Presign error:", e);
        return null;
    }
};
