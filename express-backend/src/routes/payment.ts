import { Router } from 'express';
import { 
    handleWebhook, 
    verifyPayment, 
    createRazorpayOrder, 
    verifyPaymentSignatureDirect 
} from '../controllers/paymentController';

const router = Router();

// Standard Razorpay Endpoints
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPaymentSignatureDirect);

// Application-specific routes
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

export default router;
