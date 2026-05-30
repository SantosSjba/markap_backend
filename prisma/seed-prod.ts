/**
 * Seed para producción: catálogos + menús + Ventas.
 * NO crea datos demo de Alquileres (contratos, clientes PROP-SEED-001, etc.)
 * ni demos de Interiorismo.
 *
 * Uso (con DATABASE_URL apuntando a producción):
 *   npx ts-node prisma/seed-prod.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  seedAdminUser,
  seedVentasMenus,
  seedAlquileresMenus,
  seedInteriorismoMenus,
  seedArquitecturaMenus,
  seedProduccionMenus,
  seedContabilidadMenus,
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

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url) {
    throw new Error('DATABASE_URL no está definida en .env');
  }

  console.log('🌱 Seed PRODUCCIÓN (sin demo Alquileres / Interiorismo)\n');
  console.log('   Conexión:', url.replace(/:[^:@/]+@/, ':****@').slice(0, 80) + '...\n');

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

  await seedVentasSales(prisma, appIdBySlug);
  await seedVentasFinanzas(prisma, appIdBySlug);
  await seedVentasConfig(prisma, appIdBySlug);

  console.log('\n✨ Seed producción completado.');
  console.log('   Admin:', adminUser.email);
  console.log('   Omitido: seedDemoAlquileres, interiorismo demo, seedDemoVentas\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed producción falló:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
