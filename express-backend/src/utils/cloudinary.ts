import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const isCloudinaryConfigured = (): boolean => {
    return Boolean(
        process.env.CLOUDINARY_URL || (
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        )
    );
};

/**
 * Ensures a Cloudinary URL automatically delivers optimal format (AVIF/WebP) and quality
 */
export const optimizeCloudinaryUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (!url.includes('res.cloudinary.com')) return url;
    if (url.includes('/f_auto') || url.includes('/q_auto')) return url;

    // Inject transformation: f_auto,q_auto
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
};

/**
 * Generates signed parameters so the frontend browser can upload directly
 * to Cloudinary's nearest edge server with zero load on the backend.
 */
export const generateCloudinarySignature = (folder: string = 'hungry-lab/menu') => {
    const apiSecret = process.env.CLOUDINARY_API_SECRET || cloudinary.config().api_secret;
    const apiKey = process.env.CLOUDINARY_API_KEY || cloudinary.config().api_key;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || cloudinary.config().cloud_name;

    if (!apiSecret || !apiKey || !cloudName) {
        throw new Error('Cloudinary credentials are not properly configured.');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
        folder,
        timestamp
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        apiSecret
    );

    return {
        signature,
        timestamp,
        folder,
        cloudName,
        apiKey,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    };
};

/**
 * Server-side upload to Cloudinary (from base64 or buffer)
 */
export const uploadToCloudinary = async (
    fileDataUri: string,
    folder: string = 'hungry-lab/menu'
): Promise<string> => {
    const result = await cloudinary.uploader.upload(fileDataUri, {
        folder,
        resource_type: 'image'
    });
    return optimizeCloudinaryUrl(result.secure_url) || result.secure_url;
};

export default cloudinary;
