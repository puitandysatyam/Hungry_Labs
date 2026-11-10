import { Router } from 'express';
import { runMaintenance } from '../controllers/cronController';

const router = Router();

// Vercel Cron endpoint (secured via CRON_SECRET bearer token in controller)
router.all('/maintenance', runMaintenance);

export default router;
