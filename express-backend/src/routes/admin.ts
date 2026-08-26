import { Router } from 'express';
import { getOrders, updateOrderStatus } from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
