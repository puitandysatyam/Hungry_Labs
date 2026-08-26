import prisma from '../config/db';

export const getMenu = async () => {
    const items = await prisma.menuItem.findMany({
        include: {
            addons: true
        }
    });

    // Map to Java's MenuItemResponseDto
    return items.map(item => ({
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        Veg: item.veg,
        imageUrl: item.imageUrl,
        addOns: item.addons.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price
        }))
    }));
};
