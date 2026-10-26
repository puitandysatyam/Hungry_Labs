import { Router } from 'express';
import { generateInvoice, downloadInvoice, resendInvoice } from '../controllers/invoiceController';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

// User routes (authenticated)
router.post('/generate/:orderId', requireAuth, generateInvoice);
router.get('/download/:orderId', requireAuth, downloadInvoice);

// Admin routes
router.post('/admin/resend/:orderId', requireAuth, requireAdmin, resendInvoice);

export default router;
