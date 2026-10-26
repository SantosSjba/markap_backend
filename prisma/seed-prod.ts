/**
 * Seed para producción: catálogos + menús + Ventas.
 * NO crea datos demo de Alquileres (contratos, clientes PROP-SEED-001, etc.)
 * ni demos de Interiorismo.
 *
 * Uso (con DATABASE_URL apuntando a producción):
 *   pnpm exec ts-node prisma/seed-prod.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  seedAdminUser,
  seedDocumentTypes,
  seedCurrencies,
  seedSaleFinancingChannels,
  seedPropertyTypes,
  seedRolesAndApplications,
  seedUbigeo,
  seedVentasSales,
  seedVentasFinanzas,
  seedVentasConfig,
} from './seed/steps';
import {
  AuditContext,
  SYSTEM_CONTEXT,
} from '../src/shared/infrastructure/audit/audit-context';
import { createScriptLogger } from '../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:seed-prod');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url) {
    throw new Error('DATABASE_URL no está definida en .env');
  }

  logger.info(
    { event: 'seed.progress' },
    '🌱 Seed PRODUCCIÓN (sin demo Alquileres / Interiorismo)\n',
  );
  logger.info(
    { event: 'seed.database.selected' },
    'Base de datos de destino configurada',
  );

  const { adminRoleId, appIdBySlug } = await seedRolesAndApplications(prisma);
  await seedAdminUser(prisma, adminRoleId);
  await seedDocumentTypes(prisma);
  await seedCurrencies(prisma);
  await seedSaleFinancingChannels(prisma);
  await seedUbigeo(prisma);
  await seedPropertyTypes(prisma);

  await seedVentasSales(prisma, appIdBySlug);
  await seedVentasFinanzas(prisma, appIdBySlug);
  await seedVentasConfig(prisma, appIdBySlug);

  logger.info({ event: 'seed.progress' }, '\n✨ Seed producción completado.');
  logger.info({ event: 'seed.admin.ready' }, 'Usuario administrador preparado');
  logger.info(
    { event: 'seed.progress' },
    '   Omitido: seedDemoAlquileres, interiorismo demo, seedDemoVentas\n',
  );
}

AuditContext.run({ ...SYSTEM_CONTEXT, source: 'SEED' }, () => main())
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error({ event: 'seed.failed', err: e }, '❌ Seed producción falló:');
    await prisma.$disconnect();
    process.exit(1);
  });
