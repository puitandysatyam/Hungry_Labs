import { Router } from 'express';
import { 
    getAllOrders, getActiveOrders, updateOrderStatus,
    getAddons, createAddon, updateAddon, deleteAddon,
    createMenuItem, updateMenuItem, deleteMenuItem,
    getCarouselImages, createCarouselImage, updateCarouselImage, deleteCarouselImage,
    getUploadUrl,
    createCoupon
} from '../controllers/adminController';
import { createBackup } from '../controllers/backupController';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

// Cron jobs / Server-to-server endpoints (No user auth needed, uses CRON_SECRET)
router.get('/backup', createBackup);

router.use(requireAuth, requireAdmin);

// Orders
router.get('/orders', getAllOrders);
router.get('/orders/active', getActiveOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Addons
router.get('/addons', getAddons);
router.post('/addons', createAddon);
router.put('/addons/:id', updateAddon);
router.delete('/addons/:id', deleteAddon);

// Menu
router.post('/menu', createMenuItem);
router.put('/menu/:id', updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

// Carousel / Offers
router.get('/carousel', getCarouselImages);
router.post('/carousel', createCarouselImage);
router.put('/carousel/:id', updateCarouselImage);
router.delete('/carousel/:id', deleteCarouselImage);

// Storage
router.get('/upload-url', getUploadUrl);

// Coupons
router.post('/coupons', createCoupon);

export default router;