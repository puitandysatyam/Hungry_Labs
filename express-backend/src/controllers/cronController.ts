import { Request, Response } from 'express';
import { cleanupStalePendingOrders } from '../services/orderService';
import { runDatabaseBackup } from '../services/backupService';

const isAuthorizedCron = (req: Request): boolean => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;

    const authHeader = req.headers.authorization || '';
    if (authHeader === `Bearer ${cronSecret}`) return true;

    // Vercel Cron also sends this header on cron invocations
    if (req.headers['x-vercel-cron'] && authHeader === `Bearer ${cronSecret}`) return true;

    return false;
};

/**
 * Combined maintenance endpoint for Vercel Hobby (daily cron).
 * GET/POST /api/cron/maintenance
 * Auth: Authorization: Bearer <CRON_SECRET>
 * Runs: stale pending order cleanup + database backup.
 */
export const runMaintenance = async (req: Request, res: Response) => {
    if (!isAuthorizedCron(req)) {
        return res.status(401).json({ error: 'Unauthorized: invalid cron secret' });
    }

    const results: any = { success: true, tasks: {} };

    try {
        const cleanup = await cleanupStalePendingOrders();
        results.tasks.cleanup = cleanup;
    } catch (e: any) {
        results.success = false;
        results.tasks.cleanup = { error: e.message };
    }

    try {
        const backup = await runDatabaseBackup();
        results.tasks.backup = backup;
    } catch (e: any) {
        results.success = false;
        results.tasks.backup = { error: e.message };
    }

    return res.status(results.success ? 200 : 207).json(results);
};

export default { runMaintenance };
