import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// Ensure pool is instantiated for edge/serverless compatibility
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Pass adapter to PrismaClient for Prisma v7 spec
const prisma = new PrismaClient({ adapter });

export default prisma;
