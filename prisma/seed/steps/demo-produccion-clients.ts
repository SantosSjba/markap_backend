import {
  PRODUCCION_APPLICATION_SLUG,
  SAMPLE_PRODUCCION_CORPORATE_CLIENT,
  SAMPLE_PRODUCCION_RESIDENTIAL_CLIENT,
} from '../data';
import type { SeedDb } from '../types';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

/**
 * Clientes demo para Producción (RESIDENTIAL / CORPORATE).
 */
export async function seedProduccionClients(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  produccion app not found — skipping seed produccion clients');
    return;
  }

  const dniType = await prisma.documentType.findUnique({ where: { code: 'DNI' } });
  const rucType = await prisma.documentType.findUnique({ where: { code: 'RUC' } });
  if (!dniType || !rucType) {
    console.log('\n⚠️  DNI/RUC document types not found — skipping seed produccion clients');
    return;
  }

  console.log('\n🪑 Creating Producción sample clients...');

  const residentialExists = await prisma.client.findFirst({
    where: {
      applicationId: appId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_PRODUCCION_RESIDENTIAL_CLIENT.documentNumber,
    },
  });
  if (!residentialExists) {
    await prisma.client.create({
      data: {
        applicationId: appId,
        clientType: 'RESIDENTIAL',
        documentTypeId: dniType.id,
        ...SAMPLE_PRODUCCION_RESIDENTIAL_CLIENT,
        createdBy: adminUser.id,
      },
    });
    console.log(`   ✅ Residencial "${SAMPLE_PRODUCCION_RESIDENTIAL_CLIENT.fullName}" created`);
  }

  const corporateExists = await prisma.client.findFirst({
    where: {
      applicationId: appId,
      clientType: 'CORPORATE',
      documentNumber: SAMPLE_PRODUCCION_CORPORATE_CLIENT.documentNumber,
    },
  });
  if (!corporateExists) {
    await prisma.client.create({
      data: {
        applicationId: appId,
        clientType: 'CORPORATE',
        documentTypeId: rucType.id,
        ...SAMPLE_PRODUCCION_CORPORATE_CLIENT,
        createdBy: adminUser.id,
      },
    });
    console.log(`   ✅ Corporativo "${SAMPLE_PRODUCCION_CORPORATE_CLIENT.fullName}" created`);
  }
}
