"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_1 = require("../controllers/menuController");
const router = (0, express_1.Router)();
router.get('/', menuController_1.getMenu);
router.get('/carousel', menuController_1.getCarousel);
exports.default = router;
//# sourceMappingURL=menu.js.map