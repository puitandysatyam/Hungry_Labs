"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCarousel = exports.getMenu = void 0;
const db_1 = __importDefault(require("../config/db"));
const redis_1 = __importDefault(require("../config/redis"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Client = new client_s3_1.S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: "us-east-005",
    credentials: {
        accessKeyId: process.env.B2_KEY_ID || '',
        secretAccessKey: process.env.B2_APP_KEY || ''
    }
});
const generatePresignedUrl = async (objectKey) => {
    if (!objectKey)
        return null;
    if (objectKey.startsWith('http') || objectKey.startsWith('data:') || objectKey.startsWith('/'))
        return objectKey;
    try {
        const decodedKey = decodeURIComponent(objectKey);
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
            Key: decodedKey
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 7200 });
    }
    catch (e) {
        console.error("Presign error:", e);
        return null;
    }
};
const getMenu = async () => {
    const CACHE_KEY = "menuCache::allMenuItems";
    if (redis_1.default) {
        try {
            const cachedMenu = await redis_1.default.get(CACHE_KEY);
            if (cachedMenu)
                return cachedMenu;
        }
        catch (error) {
            console.error("Redis Cache Error:", error);
        }
    }
    const items = await db_1.default.menuItem.findMany({ include: { addons: true } });
    const formattedMenu = await Promise.all(items.map(async (item) => ({
        id: item.id,
        category: item.category,
        name: item.name,
        desc: item.desc,
        price: item.price,
        veg: item.veg,
        imageUrl: await generatePresignedUrl(item.imageUrl),
        addonList: item.addons.map(a => ({ id: a.id, name: a.name, price: a.price }))
    })));
    if (redis_1.default) {
        try {
            await redis_1.default.set(CACHE_KEY, JSON.stringify(formattedMenu), { ex: 3600 });
        }
        catch (error) {
            console.error("Redis Write Error:", error);
        }
    }
    return formattedMenu;
};
exports.getMenu = getMenu;
const getCarousel = async () => {
    const CACHE_KEY = "menuCache::carouselOptions";
    if (redis_1.default) {
        try {
            const cachedCarousel = await redis_1.default.get(CACHE_KEY);
            if (cachedCarousel)
                return cachedCarousel;
        }
        catch (error) {
            console.error("Redis Cache Error:", error);
        }
    }
    const slides = await db_1.default.carouselImage.findMany({
        where: { active: true },
        orderBy: { order: 'asc' }
    });
    const formattedSlides = await Promise.all(slides.map(async (slide) => ({
        id: slide.id,
        imageUrl: await generatePresignedUrl(slide.imageUrl), // Works with both B2 uploads and local /assets/
        order: slide.order
    })));
    // Fallback if empty to ensure the UI looks good
    if (formattedSlides.length === 0) {
        formattedSlides.push({ id: -1, imageUrl: '/assets/Menu 1.png', order: 0 });
        formattedSlides.push({ id: -2, imageUrl: '/assets/Menu 2.png', order: 1 });
        formattedSlides.push({ id: -3, imageUrl: '/assets/Menu 3.png', order: 2 });
    }
    if (redis_1.default) {
        try {
            await redis_1.default.set(CACHE_KEY, JSON.stringify(formattedSlides), { ex: 3600 });
        }
        catch (error) { }
    }
    return formattedSlides;
};
exports.getCarousel = getCarousel;
//# sourceMappingURL=menuService.js.map