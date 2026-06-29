import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  seedAdminUser,
  seedAlquileresMenus,
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
  seedVentasMenus,
  seedInteriorismoMenus,
  seedArquitecturaMenus,
  seedProduccionMenus,
  seedProduccionFurniture,
  seedProduccionCosts,
  seedProduccionInventory,
  seedContabilidadMenus,
  seedVentasSales,
  seedVentasFinanzas,
  seedVentasConfig,
} from './seed/steps';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('🌱 Starting seed...\n');

  const { adminRoleId, appIdBySlug } = await seedRolesAndApplications(prisma);
  await seedAlquileresMenus(prisma);
  await seedVentasMenus(prisma);
  await seedInteriorismoMenus(prisma);
  await seedArquitecturaMenus(prisma);
  await seedProduccionMenus(prisma);
  await seedContabilidadMenus(prisma);
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
  await seedProduccionFurniture(prisma, appIdBySlug);
  await seedProduccionCosts(prisma, appIdBySlug);
  await seedProduccionInventory(prisma, appIdBySlug);
  await seedDemoVentas(prisma, appIdBySlug, adminUser);
  await seedVentasSales(prisma, appIdBySlug);
  await seedVentasFinanzas(prisma, appIdBySlug);
  await seedVentasConfig(prisma, appIdBySlug);

  console.log('\n✨ Seed completed successfully!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
