import { defineConfig, env } from '@prisma/config';
import 'dotenv/config'; // Load .env automatically

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
