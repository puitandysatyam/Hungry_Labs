import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { getBucketName } from './s3';

export const b2Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY || ''
    }
});

export const getBucketNameB2 = () => {
    return process.env.B2_BUCKET_NAME || process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles';
};

/**
 * Upload a buffer to B2 with a given object key.
 * Returns the object key and public URL.
 */
export async function uploadBufferToB2(buffer: Buffer, objectKey: string, contentType: string): Promise<{ objectKey: string; bucket: string }> {
    const bucket = getBucketNameB2();
    const upload = new Upload({
        client: b2Client,
        params: {
            Bucket: bucket,
            Key: objectKey,
            Body: buffer,
            ContentType: contentType
        }
    });
    await upload.done();
    return { objectKey, bucket };
}

/**
 * Generate a presigned GET URL for downloading an object from B2.
 * URL expires in the specified seconds (default 300 = 5 min).
 */
export async function getB2DownloadUrl(objectKey: string, expiresIn: number = 300): Promise<string | null> {
    const bucket = getBucketNameB2();
    try {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: objectKey
        });
        return await getSignedUrl(b2Client, command, { expiresIn });
    } catch (e: any) {
        console.error("[B2] Presign download error:", e.message);
        return null;
    }
}

/**
 * Delete an object from B2.
 */
export async function deleteB2Object(objectKey: string): Promise<void> {
    const bucket = getBucketNameB2();
    try {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey
        });
        await b2Client.send(command);
    } catch (e: any) {
        console.error("[B2] Delete error:", e.message);
    }
}

/**
 * Check if an object exists in B2.
 */
export async function b2ObjectExists(objectKey: string): Promise<boolean> {
    const bucket = getBucketNameB2();
    try {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: objectKey
        });
        await getSignedUrl(b2Client, command, { expiresIn: 60 });
        return true;
    } catch {
        return false;
    }
}

export default b2Client;
