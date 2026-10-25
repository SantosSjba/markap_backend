import {
  INTERIORISMO_APPLICATION_SLUG,
  SAMPLE_INTERIOR_CORPORATE_CLIENT,
  SAMPLE_INTERIOR_RESIDENTIAL_CLIENT,
} from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-interiorismo-clients');

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

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
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  interiorismo app not found — skipping seed interiorismo clients',
    );
    return;
  }

  const dniType = await prisma.documentType.findUnique({
    where: { code: 'DNI' },
  });
  const rucType = await prisma.documentType.findUnique({
    where: { code: 'RUC' },
  });
  if (!dniType || !rucType) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  DNI/RUC document types not found — skipping seed interiorismo clients',
    );
    return;
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🎨 Creating Interiorismo sample clients...',
  );

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
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Residencial "${SAMPLE_INTERIOR_RESIDENTIAL_CLIENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Residencial seed already exists',
    );
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
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Corporativo "${SAMPLE_INTERIOR_CORPORATE_CLIENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Corporativo seed already exists',
    );
  }
}
