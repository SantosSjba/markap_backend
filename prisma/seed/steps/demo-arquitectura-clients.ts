import {
  ARQUITECTURA_APPLICATION_SLUG,
  SAMPLE_ARQUITECTURA_CORPORATE_CLIENT,
  SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT,
} from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-arquitectura-clients');

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Clientes demo para Arquitectura (RESIDENTIAL / CORPORATE).
 */
export async function seedArquitecturaClients(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  arquitectura app not found — skipping seed arquitectura clients',
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
      '\n⚠️  DNI/RUC document types not found — skipping seed arquitectura clients',
    );
    return;
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🏛️  Creating Arquitectura sample clients...',
  );

  let residential = await prisma.client.findFirst({
    where: {
      applicationId: arquitecturaAppId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT.documentNumber,
    },
  });
  if (!residential) {
    residential = await prisma.client.create({
      data: {
        applicationId: arquitecturaAppId,
        clientType: 'RESIDENTIAL',
        documentTypeId: dniType.id,
        ...SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Residencial "${SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Residencial seed already exists',
    );
  }

  let corporate = await prisma.client.findFirst({
    where: {
      applicationId: arquitecturaAppId,
      clientType: 'CORPORATE',
      documentNumber: SAMPLE_ARQUITECTURA_CORPORATE_CLIENT.documentNumber,
    },
  });
  if (!corporate) {
    corporate = await prisma.client.create({
      data: {
        applicationId: arquitecturaAppId,
        clientType: 'CORPORATE',
        documentTypeId: rucType.id,
        ...SAMPLE_ARQUITECTURA_CORPORATE_CLIENT,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Corporativo "${SAMPLE_ARQUITECTURA_CORPORATE_CLIENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Corporativo seed already exists',
    );
  }
}
