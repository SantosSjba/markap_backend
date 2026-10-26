import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  seedAdminUser,
  seedDemoAlquileres,
  seedInteriorismoClients,
  seedInteriorismoProjects,
  seedInteriorismoHortensiasProject,
  seedHortensiasSupplierPayments,
  seedInteriorismoMaterials,
  seedInteriorismoExecution,
  seedInteriorismoFinance,
  seedInteriorismoCalendar,
  seedDemoVentas,
  seedDocumentTypes,
  seedCurrencies,
  seedSaleFinancingChannels,
  seedPropertyTypes,
  seedRolesAndApplications,
  seedUbigeo,
  seedDemoArquitectura,
  seedDemoProduccion,
  seedVentasSales,
  seedVentasFinanzas,
  seedVentasConfig,
} from './seed/steps';
import {
  AuditContext,
  SYSTEM_CONTEXT,
} from '../src/shared/infrastructure/audit/audit-context';
import { createScriptLogger } from '../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:seed');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  logger.info({ event: 'seed.progress' }, '🌱 Starting seed...\n');

  const { adminRoleId, appIdBySlug } = await seedRolesAndApplications(prisma);
  const { adminUser } = await seedAdminUser(prisma, adminRoleId);
  await seedDocumentTypes(prisma);
  await seedCurrencies(prisma);
  await seedSaleFinancingChannels(prisma);
  await seedUbigeo(prisma);
  await seedPropertyTypes(prisma);
  await seedDemoAlquileres(prisma, appIdBySlug, adminUser);
  await seedInteriorismoClients(prisma, appIdBySlug, adminUser);
  await seedInteriorismoProjects(prisma, appIdBySlug, adminUser);
  await seedInteriorismoHortensiasProject(prisma, appIdBySlug);
  await seedHortensiasSupplierPayments(prisma, appIdBySlug);
  await seedInteriorismoMaterials(prisma, appIdBySlug);
  await seedInteriorismoExecution(prisma, appIdBySlug);
  await seedInteriorismoFinance(prisma, appIdBySlug);
  await seedInteriorismoCalendar(prisma, appIdBySlug);
  await seedDemoArquitectura(prisma, appIdBySlug, adminUser);
  await seedDemoProduccion(prisma, appIdBySlug, adminUser);
  await seedDemoVentas(prisma, appIdBySlug, adminUser);
  await seedVentasSales(prisma, appIdBySlug);
  await seedVentasFinanzas(prisma, appIdBySlug);
  await seedVentasConfig(prisma, appIdBySlug);

  logger.info(
    { event: 'seed.progress' },
    '\n✨ Seed completed successfully!\n',
  );
}

AuditContext.run({ ...SYSTEM_CONTEXT, source: 'SEED' }, () => main())
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error({ event: 'seed.failed', err: e }, '❌ Seed failed:');
    await prisma.$disconnect();
    process.exit(1);
  });
