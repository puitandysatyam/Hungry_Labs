import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import prisma from '../config/db';

export const getConfig = (req: Request, res: Response) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
};

export const placeOrder = async (req: Request, res: Response) => {
    try {
        const result = await orderService.placeOrder(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(400).send("Failed to process order: " + e.message);
    }
};

export const applyCoupon = async (req: Request, res: Response) => {
    try {
        const result = await orderService.applyCoupon(req.body.couponCode);
        res.json(result);
    } catch (e: any) {
        res.status(400).json(e.message);
    }
};

export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const requestingUser = (req as any).user;
        
        const user = await prisma.user.findUnique({ where: { email: requestingUser.email } });
        
        if (!user || user.id.toString() !== userId) {
            return res.status(403).json(null);
        }

        const orders = await prisma.order.findMany({ 
            where: { customerId: Number(userId) },
            include: { 
                orderItems: { include: { menuItem: true, addons: true } }
            } 
        });

        // Map Prisma DB schema back perfectly into the Vue Frontend's expected Order DTO
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
        res.status(403).json(null);
    }
};