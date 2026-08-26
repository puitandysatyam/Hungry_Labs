import { Router } from 'express';
import { 
    getAllOrders, getActiveOrders, updateOrderStatus,
    getAddons, createAddon, updateAddon,
    createMenuItem, updateMenuItem,
    getUploadUrl,
    createCoupon
} from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

// Orders
router.get('/orders', getAllOrders);
router.get('/orders/active', getActiveOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Addons
router.get('/addons', getAddons);
router.post('/addons', createAddon);
router.put('/addons/:id', updateAddon);

// Menu
router.post('/menu', createMenuItem);
router.put('/menu/:id', updateMenuItem);

// Storage
router.get('/upload-url', getUploadUrl);

// Coupons
router.post('/coupons', createCoupon);

export default router;