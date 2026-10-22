import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import prisma from '../config/db';

export const getConfig = (req: Request, res: Response) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
};

export const placeOrder = async (req: Request, res: Response) => {
    try {
        const authenticatedUserId = (req as any).user?.id;
        const result = await orderService.placeOrder(req.body, authenticatedUserId);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message || "Failed to process order." });
    }
};

export const applyCoupon = async (req: Request, res: Response) => {
    try {
        const { couponCode } = req.body;
        if (!couponCode) {
            return res.status(400).json({ valid: false, message: "Coupon code is required." });
        }
        const result = await orderService.applyCoupon(couponCode);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ valid: false, message: e.message });
    }
};

export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const requestingUser = (req as any).user;
        
        // Authorization check: User can only view their own orders unless ADMIN
        if (requestingUser.role !== 'ADMIN' && String(requestingUser.id) !== String(userId)) {
            return res.status(403).json({ error: "Access denied." });
        }

        const orders = await prisma.order.findMany({ 
            where: { customerId: Number(userId) },
            include: { 
                orderItems: { include: { menuItem: true, addons: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map Prisma DB schema back into the Vue Frontend's expected Order DTO
        const formattedOrders = orders.map(order => ({
            id: order.id,
            customerId: order.customerId,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            deliveryAddress: order.deliveryAddress,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            orderItemList: order.orderItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                menuItem: item.menuItem,
                addonList: item.addons
            }))
        }));

        res.json(formattedOrders);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch orders." });
    }
};
