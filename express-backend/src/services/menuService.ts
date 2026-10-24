import prisma from '../config/db';
import redis from '../config/redis';
import { generatePresignedUrl } from '../utils/s3';

// Nutrition estimation helper
export const getEstimatedCalories = (name: string, category: string, veg: boolean): number => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('burger')) return veg ? 480 : 620;
    if (cat.includes('sandwich')) return veg ? 380 : 490;
    if (cat.includes('fries') || name.toLowerCase().includes('fries')) return veg ? 340 : 510;
    if (cat.includes('beverage') || cat.includes('drink')) return 150;
    return veg ? 390 : 530;
};

export const getEstimatedProtein = (name: string, category: string, veg: boolean): number => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('burger')) return veg ? 17 : 34;
    if (cat.includes('sandwich')) return veg ? 15 : 29;
    if (cat.includes('fries') || name.toLowerCase().includes('fries')) return veg ? 5 : 14;
    if (cat.includes('beverage') || cat.includes('drink')) return 2;
    return veg ? 14 : 28;
};

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
        calories: ((item as any).calories !== null && (item as any).calories !== undefined && (item as any).calories > 0)
            ? (item as any).calories
            : getEstimatedCalories(item.name, item.category, item.veg),
        protein: ((item as any).protein !== null && (item as any).protein !== undefined && (item as any).protein > 0)
            ? (item as any).protein
            : getEstimatedProtein(item.name, item.category, item.veg),
        imageUrl: await generatePresignedUrl(item.imageUrl),
        addonList: item.addons.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
            calories: (a as any).calories || 0,
            protein: (a as any).protein || 0
        }))
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
        imageUrl: await generatePresignedUrl(slide.imageUrl),
        order: slide.order
    })));

    if (redis) {
        try {
            await redis.set(CACHE_KEY, JSON.stringify(formattedSlides), { ex: 3600 });
        } catch (error) {}
    }

    return formattedSlides;
};
