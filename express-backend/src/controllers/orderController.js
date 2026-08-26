"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserOrders = exports.applyCoupon = exports.placeOrder = exports.getConfig = void 0;
const express_1 = require("express");
const orderService = __importStar(require("../services/orderService"));
const db_1 = __importDefault(require("../config/db"));
const getConfig = (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
};
exports.getConfig = getConfig;
const placeOrder = async (req, res) => {
    try {
        const result = await orderService.placeOrder(req.body);
        res.json(result);
    }
    catch (e) {
        res.status(400).send("Failed to process order: " + e.message);
    }
};
exports.placeOrder = placeOrder;
const applyCoupon = async (req, res) => {
    try {
        const result = await orderService.applyCoupon(req.body.couponCode);
        res.json(result);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.applyCoupon = applyCoupon;
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const requestingUser = req.user;
        const user = await db_1.default.user.findUnique({ where: { email: requestingUser.email } });
        if (!user || user.id.toString() !== userId) {
            return res.status(403).json(null);
        }
        const orders = await db_1.default.order.findMany({
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
    }
    catch (e) {
        res.status(403).json(null);
    }
};
exports.getUserOrders = getUserOrders;
//# sourceMappingURL=orderController.js.map