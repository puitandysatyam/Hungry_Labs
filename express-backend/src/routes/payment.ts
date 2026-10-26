import { Router } from 'express';
import { 
    handleWebhook, 
    verifyPayment, 
    createRazorpayOrder, 
    verifyPaymentSignatureDirect,
    getPaymentStatus,
    initiateRefund,
    retryPayment
} from '../controllers/paymentController';

const router = Router();

// Standard Razorpay Endpoints
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPaymentSignatureDirect);

// Application-specific routes
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

// Payment status / refund / retry
router.get('/status/:orderId', getPaymentStatus);
router.post('/refund', initiateRefund);
router.post('/retry', retryPayment);

export default router;
