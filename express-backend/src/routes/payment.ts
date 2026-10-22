import { Router } from 'express';
import { handleWebhook, verifyPayment } from '../controllers/paymentController';

const router = Router();
router.post('/webhook', handleWebhook);
router.post('/verify', verifyPayment);

export default router;
