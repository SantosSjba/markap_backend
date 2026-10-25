/**
 * Seed solo del módulo Producción (menús en orden de flujo + datos demo).
 *
 * Uso: npm run seed:produccion
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  seedAdminUser,
  seedRolesAndApplications,
  seedProduccionMenus,
  seedDemoProduccion,
} from '../seed/steps';
import { createScriptLogger } from '../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:seed-produccion-demo');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida en .env');
  }

  logger.info(
    { event: 'seed.progress' },
    '🌱 Seed módulo Producción de muebles\n',
  );

  const { adminRoleId, appIdBySlug } = await seedRolesAndApplications(prisma);
  const { adminUser } = await seedAdminUser(prisma, adminRoleId);
  await seedProduccionMenus(prisma);
  await seedDemoProduccion(prisma, appIdBySlug, adminUser);

  logger.info({ event: 'seed.progress' }, '\n✨ Seed Producción completado.\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error({ event: 'seed.failed', err: e }, '❌ Seed Producción falló:');
    await prisma.$disconnect();
    process.exit(1);
  });
