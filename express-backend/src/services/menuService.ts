import prisma from '../config/db';
import redis from '../config/redis';
import { generatePresignedUrl } from '../utils/s3';

// Per-key rebuild locks to prevent cache stampede (thundering herd)
const rebuildLocks = new Set<string>();

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
    const client = redis;

    if (client) {
        try {
            const cachedMenu = await client.get(CACHE_KEY) as string | null;
            if (cachedMenu) return JSON.parse(cachedMenu);
        } catch (error) { console.error("Redis Cache Error:", error); }
    }

    // Cache stampede guard: only one request rebuilds, others wait briefly
    if (rebuildLocks.has(CACHE_KEY)) {
        await new Promise(resolve => setTimeout(resolve, 200));
        try {
            if (client) {
                const cachedMenu = await client.get(CACHE_KEY) as string | null;
                if (cachedMenu) return JSON.parse(cachedMenu);
            }
        } catch (error) { console.error("Redis Cache Retry Error:", error); }
    }

    rebuildLocks.add(CACHE_KEY);
    try {
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

        if (client) {
            try {
                await client.set(CACHE_KEY, JSON.stringify(formattedMenu), { ex: 3600 });
            } catch (error) { console.error("Redis Write Error:", error); }
        }

        return formattedMenu;
    } finally {
        rebuildLocks.delete(CACHE_KEY);
    }
};

export const getCarousel = async () => {
    const CACHE_KEY = "menuCache::carouselOptions";
    const client = redis;

    if (client) {
        try {
            const cachedCarousel = await client.get(CACHE_KEY) as string | null;
            if (cachedCarousel) return JSON.parse(cachedCarousel);
        } catch (error) { console.error("Redis Cache Error:", error); }
    }

    // Cache stampede guard
    if (rebuildLocks.has(CACHE_KEY)) {
        await new Promise(resolve => setTimeout(resolve, 200));
        try {
            if (client) {
                const cachedCarousel = await client.get(CACHE_KEY) as string | null;
                if (cachedCarousel) return JSON.parse(cachedCarousel);
            }
        } catch (error) { console.error("Redis Cache Retry Error:", error); }
    }

    rebuildLocks.add(CACHE_KEY);
    try {
        const slides = await prisma.carouselImage.findMany({ 
            where: { active: true },
            orderBy: { order: 'asc' } 
        });

        const formattedSlides = await Promise.all(slides.map(async (slide) => ({
            id: slide.id,
            imageUrl: await generatePresignedUrl(slide.imageUrl),
            order: slide.order
        })));

        if (client) {
            try {
                await client.set(CACHE_KEY, JSON.stringify(formattedSlides), { ex: 3600 });
            } catch (error) { console.error("Redis Write Error:", error); }
        }

        return formattedSlides;
    } finally {
        rebuildLocks.delete(CACHE_KEY);
    }
};
