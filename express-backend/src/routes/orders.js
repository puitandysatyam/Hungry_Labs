"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/config', orderController_1.getConfig);
router.post('/', orderController_1.placeOrder);
// Protected routes
router.use(auth_1.requireAuth);
router.post('/applycoupon', orderController_1.applyCoupon);
router.get('/user/:userId', orderController_1.getUserOrders);
exports.default = router;
//# sourceMappingURL=orders.js.map