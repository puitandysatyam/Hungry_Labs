"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
// Orders
router.get('/orders', adminController_1.getAllOrders);
router.get('/orders/active', adminController_1.getActiveOrders);
router.put('/orders/:id/status', adminController_1.updateOrderStatus);
// Addons
router.get('/addons', adminController_1.getAddons);
router.post('/addons', adminController_1.createAddon);
router.put('/addons/:id', adminController_1.updateAddon);
router.delete('/addons/:id', adminController_1.deleteAddon);
// Menu
router.post('/menu', adminController_1.createMenuItem);
router.put('/menu/:id', adminController_1.updateMenuItem);
router.delete('/menu/:id', adminController_1.deleteMenuItem);
// Carousel / Offers
router.get('/carousel', adminController_1.getCarouselImages);
router.post('/carousel', adminController_1.createCarouselImage);
router.put('/carousel/:id', adminController_1.updateCarouselImage);
router.delete('/carousel/:id', adminController_1.deleteCarouselImage);
// Storage
router.get('/upload-url', adminController_1.getUploadUrl);
// Coupons
router.post('/coupons', adminController_1.createCoupon);
exports.default = router;
//# sourceMappingURL=admin.js.map