import { Request, Response } from 'express';
import * as backupService from '../services/backupService';
import { requireAuth, requireAdmin } from '../middlewares/auth';

/**
 * POST /api/admin/backup/run
 * Manually trigger a database backup (admin only).
 */
export const runBackup = async (req: Request, res: Response) => {
    try {
        const result = await backupService.runDatabaseBackup();
        if (result.success) {
            return res.json({
                success: true,
                message: 'Database backup completed successfully',
                objectKey: result.objectKey,
                sizeBytes: result.sizeBytes,
                startedAt: result.startedAt,
                completedAt: result.completedAt
            });
        }
        return res.status(500).json({
            success: false,
            error: result.error || 'Backup failed'
        });
    } catch (e: any) {
        console.error('[BackupController] Error:', e.message);
        return res.status(500).json({ error: e.message || 'Backup failed.' });
    }
};

/**
 * GET /api/admin/backup/jobs
 * List backup jobs (admin only).
 */
export const listBackupJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await (require('../config/db') as any).backupJob.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20
        });
        return res.json({ jobs });
    } catch (e: any) {
        console.error('[BackupController] List error:', e.message);
        return res.status(500).json({ error: e.message || 'Failed to list backup jobs.' });
    }
};

export default {
    runBackup,
    listBackupJobs
};
