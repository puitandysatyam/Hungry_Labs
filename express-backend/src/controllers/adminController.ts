import { Request, Response } from 'express';
import prisma from '../config/db';

export const getOrders = async (req: Request, res: Response) => {
    try {
        const activeOrders = await prisma.order.findMany({
            where: {
                status: {
                    in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]
                }
            },
            include: {
                user: true,
                orderItems: { include: { menuItem: true, addons: true } }
            }
        });
        res.json(activeOrders);
    } catch (e: any) {
        res.status(500).json(e.message);
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        const order = await prisma.order.update({
            where: { id: Number(id) },
            data: { status: status as string }
        });
        res.json(order);
    } catch (e: any) {
        res.status(400).json(e.message);
    }
};
