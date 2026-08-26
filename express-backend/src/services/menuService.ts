import prisma from '../config/db';
import redis from '../config/redis';
import { generatePresignedUrl } from '../utils/s3';

export const getMenu = async () => {
    const CACHE_KEY = "menuCache::allMenuItems";

    if (redis) {
        try {
            const cachedMenu = await redis.get(CACHE_KEY);
            if (cachedMenu) return cachedMenu;
        } catch (error) { console.error("Redis Cache Error:", error); }
    }

    const items = await prisma.menuItem.findMany({ include: { addons: true } });
    
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

    if (redis) {
        try {
            await redis.set(CACHE_KEY, JSON.stringify(formattedMenu), { ex: 3600 });
        } catch (error) { console.error("Redis Write Error:", error); }
    }

    return formattedMenu;
};

export const getCarousel = async () => {
    const CACHE_KEY = "menuCache::carouselOptions";

    if (redis) {
        try {
            const cachedCarousel = await redis.get(CACHE_KEY);
            if (cachedCarousel) return cachedCarousel;
        } catch (error) { console.error("Redis Cache Error:", error); }
    }
    
    const slides = await prisma.carouselImage.findMany({ 
        where: { active: true },
        orderBy: { order: 'asc' } 
    });

    const formattedSlides = await Promise.all(slides.map(async (slide) => ({
        id: slide.id,
        imageUrl: await generatePresignedUrl(slide.imageUrl), // Works with both B2 uploads and local /assets/
        order: slide.order
    })));

    // Fallback logic removed as per request

    if (redis) {
        try {
            await redis.set(CACHE_KEY, JSON.stringify(formattedSlides), { ex: 3600 });
        } catch (error) {}
    }

    return formattedSlides;
}