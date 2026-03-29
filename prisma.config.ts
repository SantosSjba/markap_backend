import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Multi-file schema: prisma/schema.prisma + prisma/models/*.prisma
  schema: 'prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
