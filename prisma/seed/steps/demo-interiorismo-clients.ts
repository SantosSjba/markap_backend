import {
  INTERIORISMO_APPLICATION_SLUG,
  SAMPLE_INTERIOR_CORPORATE_CLIENT,
  SAMPLE_INTERIOR_RESIDENTIAL_CLIENT,
} from '../data';
import type { SeedDb } from '../types';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

/**
 * Clientes demo para Interiorismo (RESIDENTIAL / CORPORATE), ligados a applicationId interiorismo.
 */
export async function seedInteriorismoClients(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    console.log('\n⚠️  interiorismo app not found — skipping seed interiorismo clients');
    return;
  }

  const dniType = await prisma.documentType.findUnique({ where: { code: 'DNI' } });
  const rucType = await prisma.documentType.findUnique({ where: { code: 'RUC' } });
  if (!dniType || !rucType) {
    console.log('\n⚠️  DNI/RUC document types not found — skipping seed interiorismo clients');
    return;
  }

  console.log('\n🎨 Creating Interiorismo sample clients...');

  let residential = await prisma.client.findFirst({
    where: {
      applicationId: interiorAppId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_INTERIOR_RESIDENTIAL_CLIENT.documentNumber,
    },
  });
  if (!residential) {
    residential = await prisma.client.create({
      data: {
        applicationId: interiorAppId,
        clientType: 'RESIDENTIAL',
        documentTypeId: dniType.id,
        ...SAMPLE_INTERIOR_RESIDENTIAL_CLIENT,
        createdBy: adminUser.id,
      },
    });
    console.log(`   ✅ Residencial "${SAMPLE_INTERIOR_RESIDENTIAL_CLIENT.fullName}" created`);
  } else {
    console.log('   ✓ Residencial seed already exists');
  }

  let corporate = await prisma.client.findFirst({
    where: {
      applicationId: interiorAppId,
      clientType: 'CORPORATE',
      documentNumber: SAMPLE_INTERIOR_CORPORATE_CLIENT.documentNumber,
    },
  });
  if (!corporate) {
    corporate = await prisma.client.create({
      data: {
        applicationId: interiorAppId,
        clientType: 'CORPORATE',
        documentTypeId: rucType.id,
        ...SAMPLE_INTERIOR_CORPORATE_CLIENT,
        createdBy: adminUser.id,
      },
    });
    console.log(`   ✅ Corporativo "${SAMPLE_INTERIOR_CORPORATE_CLIENT.fullName}" created`);
  } else {
    console.log('   ✓ Corporativo seed already exists');
  }
}
