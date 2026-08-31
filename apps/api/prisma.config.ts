import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 CLI configuration.
 *
 * In Prisma 7 the datasource `url` is not allowed in `schema.prisma` anymore —
 * it lives here and is used by Migrate (`migrate dev` / `migrate deploy`).
 * The runtime client (`PrismaClient`) connects through the `@prisma/adapter-pg`
 * driver adapter instead (see `src/prisma/prisma.service.ts`).
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
