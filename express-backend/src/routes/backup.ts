import { Router } from 'express';
import { runBackup, listBackupJobs } from '../controllers/backupController';
import { requireAuth, requireAdmin } from '../middlewares/auth';

const router = Router();

// Admin backup routes
router.post('/backup/run', requireAuth, requireAdmin, runBackup);
router.get('/backup/jobs', requireAuth, requireAdmin, listBackupJobs);

export default router;
