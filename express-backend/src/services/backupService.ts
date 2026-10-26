import cron from 'node-cron';
import { execSync } from 'child_process';
import { gzipSync } from 'zlib';
import prisma from '../config/db';
import { b2Client, getBucketNameB2 } from '../utils/b2';
import { Upload } from '@aws-sdk/lib-storage';

interface BackupResult {
    success: boolean;
    objectKey?: string;
    sizeBytes?: number;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}

/**
 * Run a full NeonDB backup: pg_dump -> gzip -> upload to B2.
 * Records the job in the BackupJob table.
 */
export async function runDatabaseBackup(): Promise<BackupResult> {
    const startedAt = new Date();
    const timestamp = startedAt.toISOString().slice(0, 19).replace(/[:-]/g, '');
    const objectKey = `backups/neondb-${timestamp}.sql.gz`;

    const job = await prisma.backupJob.create({
        data: {
            type: 'DATABASE',
            status: 'PENDING',
            startedAt
        }
    });

    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is not configured');
        }

        // Run pg_dump to get raw SQL
        const dumpBuffer = execSync(`pg_dump "${connectionString}"`, {
            maxBuffer: 100 * 1024 * 1024
        });

        // Gzip compress
        const compressedBuffer = gzipSync(dumpBuffer, { level: 6 });

        // Upload to B2
        const upload = new Upload({
            client: b2Client,
            params: {
                Bucket: getBucketNameB2(),
                Key: objectKey,
                Body: compressedBuffer,
                ContentType: 'application/gzip'
            }
        });
        await upload.done();

        const completedAt = new Date();

        await prisma.backupJob.update({
            where: { id: job.id },
            data: {
                status: 'SUCCESS',
                completedAt,
                objectKey,
                sizeBytes: compressedBuffer.length
            }
        });

        return {
            success: true,
            objectKey,
            sizeBytes: compressedBuffer.length,
            startedAt,
            completedAt
        };
    } catch (e: any) {
        const completedAt = new Date();
        await prisma.backupJob.update({
            where: { id: job.id },
            data: {
                status: 'FAILED',
                completedAt,
                error: e.message
            }
        });
        return {
            success: false,
            error: e.message,
            startedAt,
            completedAt
        };
    }
}

/**
 * Start the scheduled backup cron job.
 * Default: daily at 02:00 UTC.
 */
export function startBackupCron() {
    const schedule = process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *';
    console.log(`[Backup] Scheduling database backup cron: ${schedule}`);

    cron.schedule(schedule, async () => {
        console.log('[Backup] Running scheduled database backup...');
        const result = await runDatabaseBackup();
        if (result.success) {
            console.log(`[Backup] Backup completed: ${result.objectKey} (${result.sizeBytes} bytes)`);
        } else {
            console.error(`[Backup] Backup failed: ${result.error}`);
        }
    });
}

export default {
    runDatabaseBackup,
    startBackupCron
};
