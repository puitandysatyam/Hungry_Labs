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
        
        // Ensure user is authorized to fetch this id
        // In java: user = userRepository.findByEmail(...) ...
        const user = await prisma.user.findUnique({ where: { email: requestingUser.email } });
        
        if (!user || user.id.toString() !== userId) {
            return res.status(403).json(null);
        }

        const orders = await prisma.order.findMany({ 
            where: { userId: Number(userId) },
            include: { 
                orderItems: { include: { menuItem: true, addons: true } }
            } 
        });

        res.json(orders);
    } catch (e: any) {
        res.status(403).json(null);
    }
};
