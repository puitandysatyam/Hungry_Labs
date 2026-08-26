"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
router.post('/webhook', paymentController_1.handleWebhook);
exports.default = router;
//# sourceMappingURL=payment.js.map