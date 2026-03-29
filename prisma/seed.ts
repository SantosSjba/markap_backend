import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  seedAdminUser,
  seedAlquileresMenus,
  seedDemoAlquileres,
  seedDocumentTypes,
  seedPropertyTypes,
  seedRolesAndApplications,
  seedUbigeo,
  seedVentasMenus,
} from './seed/steps';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  console.log('🌱 Starting seed...\n');

  const { adminRoleId, appIdBySlug } = await seedRolesAndApplications(prisma);
  await seedAlquileresMenus(prisma);
  await seedVentasMenus(prisma);
  const { adminUser } = await seedAdminUser(prisma, adminRoleId);
  await seedDocumentTypes(prisma);
  await seedUbigeo(prisma);
  await seedPropertyTypes(prisma);
  await seedDemoAlquileres(prisma, appIdBySlug, adminUser);

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
