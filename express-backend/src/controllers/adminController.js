"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCoupon = exports.getUploadUrl = exports.deleteCarouselImage = exports.updateCarouselImage = exports.createCarouselImage = exports.getCarouselImages = exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.deleteAddon = exports.updateAddon = exports.createAddon = exports.getAddons = exports.updateOrderStatus = exports.getAllOrders = exports.getActiveOrders = void 0;
const express_1 = require("express");
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
const invalidateMenuCache = async () => {
    if (redis_1.default) {
        try {
            await redis_1.default.del("menuCache::allMenuItems");
            console.log("[Upstash] Admin changed Menu/Addon. Cache cleared!");
        }
        catch (e) {
            console.error("Failed to clear Upstash cache", e);
        }
    }
};
const invalidateCarouselCache = async () => {
    if (redis_1.default) {
        try {
            await redis_1.default.del("menuCache::carouselOptions");
            console.log("[Upstash] Admin changed Carousel. Cache cleared!");
        }
        catch (e) { }
    }
};
// -- ORDERS --
const getActiveOrders = async (req, res) => {
    try {
        const activeOrders = await db_1.default.order.findMany({
            where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } },
            include: { user: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(activeOrders);
    }
    catch (e) {
        res.status(500).json(e.message);
    }
};
exports.getActiveOrders = getActiveOrders;
const getAllOrders = async (req, res) => {
    try {
        const orders = await db_1.default.order.findMany({
            include: { user: true, orderItems: { include: { menuItem: true, addons: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (e) {
        res.status(500).json(e.message);
    }
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;
        const order = await db_1.default.order.update({
            where: { id: Number(id) },
            data: { status: String(status) }
        });
        res.json(order);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.updateOrderStatus = updateOrderStatus;
// -- ADDONS --
const getAddons = async (req, res) => {
    try {
        const addons = await db_1.default.addon.findMany();
        res.json(addons);
    }
    catch (e) {
        res.status(500).json(e.message);
    }
};
exports.getAddons = getAddons;
const createAddon = async (req, res) => {
    try {
        const { name, price } = req.body;
        const addon = await db_1.default.addon.create({ data: { name, price: Number(price) } });
        await invalidateMenuCache();
        res.json(addon);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.createAddon = createAddon;
const updateAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;
        const addon = await db_1.default.addon.update({
            where: { id: Number(id) },
            data: { name, price: Number(price) }
        });
        await invalidateMenuCache();
        res.json(addon);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.updateAddon = updateAddon;
const deleteAddon = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.addon.delete({
            where: { id: Number(id) }
        });
        await invalidateMenuCache();
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: "Cannot delete addon currently in use by an order." });
    }
};
exports.deleteAddon = deleteAddon;
// -- MENU ITEMS --
const createMenuItem = async (req, res) => {
    try {
        const { category, name, desc, price, isVeg, imageUrl, addonList } = req.body;
        const menuItem = await db_1.default.menuItem.create({
            data: {
                category, name, desc, price: Number(price), veg: Boolean(isVeg), imageUrl,
                addons: { connect: addonList ? addonList.map((addon) => ({ id: addon.id })) : [] }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.createMenuItem = createMenuItem;
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, name, desc, price, isVeg, imageUrl, addonList } = req.body;
        const menuItem = await db_1.default.menuItem.update({
            where: { id: Number(id) },
            data: {
                category, name, desc, price: Number(price), veg: Boolean(isVeg), imageUrl,
                addons: { set: addonList ? addonList.map((addon) => ({ id: addon.id })) : [] }
            }
        });
        await invalidateMenuCache();
        res.json(menuItem);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.menuItem.delete({
            where: { id: Number(id) }
        });
        await invalidateMenuCache();
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: "Cannot delete menu item currently attached to an order." });
    }
};
exports.deleteMenuItem = deleteMenuItem;
// -- CAROUSEL OPTIONS --
const getCarouselImages = async (req, res) => {
    try {
        const images = await db_1.default.carouselImage.findMany({ orderBy: { order: 'asc' } });
        res.json(images);
    }
    catch (e) {
        res.status(500).json(e.message);
    }
};
exports.getCarouselImages = getCarouselImages;
const createCarouselImage = async (req, res) => {
    try {
        const { imageUrl, active, order } = req.body;
        const image = await db_1.default.carouselImage.create({
            data: { imageUrl, active: Boolean(active), order: Number(order || 0) }
        });
        await invalidateCarouselCache();
        res.json(image);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.createCarouselImage = createCarouselImage;
const updateCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, active, order } = req.body;
        const image = await db_1.default.carouselImage.update({
            where: { id: Number(id) },
            data: { imageUrl, active: Boolean(active), order: Number(order || 0) }
        });
        await invalidateCarouselCache();
        res.json(image);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.updateCarouselImage = updateCarouselImage;
const deleteCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.carouselImage.delete({ where: { id: Number(id) } });
        await invalidateCarouselCache();
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.deleteCarouselImage = deleteCarouselImage;
// -- B2 UPLOAD (PRESIGNED URL) --
const getUploadUrl = async (req, res) => {
    try {
        const { filename, contentType } = req.query;
        if (!filename)
            return res.status(400).json({ error: "Filename required" });
        const objectKey = `menu-images/${crypto.randomUUID()}-${filename}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.BUCKET_NAME || 'HungryLab-WebsiteFiles',
            Key: objectKey,
            ContentType: String(contentType || 'image/png')
        });
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 300 });
        res.json({ uploadUrl: presignedUrl, finalUrl: objectKey });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.getUploadUrl = getUploadUrl;
// -- COUPONS --
const createCoupon = async (req, res) => {
    try {
        const coupon = await db_1.default.coupon.create({ data: req.body });
        res.json(coupon);
    }
    catch (e) {
        res.status(400).json(e.message);
    }
};
exports.createCoupon = createCoupon;
//# sourceMappingURL=adminController.js.map