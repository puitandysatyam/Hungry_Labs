import { Router } from 'express';
import { getConfig, placeOrder, applyCoupon, getUserOrders } from '../controllers/orderController';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();
router.get('/config', getConfig);
router.post('/', optionalAuth, placeOrder);

// Protected routes
router.use(requireAuth);
router.post('/applycoupon', applyCoupon);
router.get('/user/:userId', getUserOrders);

export default router;
