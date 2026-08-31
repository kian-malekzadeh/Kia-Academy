import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (supported since Prisma 6.16, required in 7+).
 *
 * The datasource URL lives here instead of `schema.prisma` so the schema stays
 * compatible with Prisma 7 CLIs (which no longer accept `url` in schema files)
 * while remaining fully supported by the pinned Prisma 6 CLI.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
