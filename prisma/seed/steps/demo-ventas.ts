import {
  VENTAS_SAMPLE_BUYER_CLIENTS,
  VENTAS_SAMPLE_EXTERNAL_AGENT,
  VENTAS_SAMPLE_PROPERTIES,
  VENTAS_SAMPLE_PROPERTY_OWNERS,
} from '../data/sample-ventas';
import { SAMPLE_DISTRICT_ID_LIMA } from '../data/sample-demo';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-ventas');

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Demo: agentes y clientes (leads/compradores) para la aplicación Ventas.
 */
export async function seedDemoVentas(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const ventasAppId = appIdBySlug['ventas'];
  if (!ventasAppId) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  Ventas app not found in appIdBySlug — skipping demo-ventas',
    );
    return;
  }

  const dniType = await prisma.documentType.findUnique({
    where: { code: 'DNI' },
  });
  if (!dniType) throw new Error('DocumentType DNI not found');

  logger.info(
    { event: 'seed.progress' },
    '\n🤝 Creating Ventas sample agents...',
  );
  let internalVentasAgent = await prisma.agent.findFirst({
    where: {
      applicationId: ventasAppId,
      type: 'INTERNAL',
      userId: adminUser.id,
    },
  });
  if (!internalVentasAgent) {
    internalVentasAgent = await prisma.agent.create({
      data: {
        applicationId: ventasAppId,
        type: 'INTERNAL',
        userId: adminUser.id,
        fullName: `${adminUser.firstName} ${adminUser.lastName} (Ventas)`,
        email: adminUser.email,
        isActive: true,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Ventas internal agent (admin) created',
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Ventas internal agent already exists',
    );
  }

  const rucType = await prisma.documentType.findUnique({
    where: { code: 'RUC' },
  });
  let externalVentasAgent = await prisma.agent.findFirst({
    where: {
      applicationId: ventasAppId,
      type: 'EXTERNAL',
      documentNumber: VENTAS_SAMPLE_EXTERNAL_AGENT.documentNumber,
    },
  });
  if (!externalVentasAgent) {
    externalVentasAgent = await prisma.agent.create({
      data: {
        applicationId: ventasAppId,
        type: 'EXTERNAL',
        fullName: VENTAS_SAMPLE_EXTERNAL_AGENT.fullName,
        email: VENTAS_SAMPLE_EXTERNAL_AGENT.email,
        phone: VENTAS_SAMPLE_EXTERNAL_AGENT.phone,
        ...(rucType && {
          documentTypeId: rucType.id,
          documentNumber: VENTAS_SAMPLE_EXTERNAL_AGENT.documentNumber,
        }),
        isActive: true,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Ventas external agent "${VENTAS_SAMPLE_EXTERNAL_AGENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Ventas external agent already exists',
    );
  }

  logger.info(
    { event: 'seed.progress' },
    '\n👥 Creating Ventas sample clients (BUYER / CRM)...',
  );
  for (const sample of VENTAS_SAMPLE_BUYER_CLIENTS) {
    const existing = await prisma.client.findFirst({
      where: {
        applicationId: ventasAppId,
        clientType: 'BUYER',
        documentNumber: sample.documentNumber,
        deletedAt: null,
      },
    });
    if (existing) {
      logger.info(
        { event: 'seed.progress' },
        `   ✓ Buyer client "${sample.fullName}" already exists`,
      );
      continue;
    }

    let assignedAgentId: string | null = null;
    if (sample.assignedAgent === 'internal')
      assignedAgentId = internalVentasAgent.id;
    if (sample.assignedAgent === 'external')
      assignedAgentId = externalVentasAgent.id;

    await prisma.client.create({
      data: {
        applicationId: ventasAppId,
        clientType: 'BUYER',
        documentTypeId: dniType.id,
        documentNumber: sample.documentNumber,
        fullName: sample.fullName,
        primaryPhone: sample.primaryPhone,
        primaryEmail: sample.primaryEmail,
        salesStatus: sample.salesStatus,
        leadOrigin: sample.leadOrigin,
        assignedAgentId,
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Buyer client "${sample.fullName}" (${sample.salesStatus}) created`,
    );
  }

  logger.info(
    { event: 'seed.progress' },
    '\n👤 Creating Ventas property owners (OWNER) for inventory...',
  );
  const ownerIdByDocument = new Map<string, string>();
  for (const o of VENTAS_SAMPLE_PROPERTY_OWNERS) {
    const existingOwner = await prisma.client.findFirst({
      where: {
        applicationId: ventasAppId,
        clientType: 'OWNER',
        documentNumber: o.documentNumber,
        deletedAt: null,
      },
    });
    if (existingOwner) {
      ownerIdByDocument.set(o.documentNumber, existingOwner.id);
      logger.info(
        { event: 'seed.progress' },
        `   ✓ Owner "${o.fullName}" already exists`,
      );
      continue;
    }
    const createdOwner = await prisma.client.create({
      data: {
        applicationId: ventasAppId,
        clientType: 'OWNER',
        documentTypeId: dniType.id,
        documentNumber: o.documentNumber,
        fullName: o.fullName,
        primaryPhone: o.primaryPhone,
        primaryEmail: o.primaryEmail,
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    ownerIdByDocument.set(o.documentNumber, createdOwner.id);
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Owner "${o.fullName}" created`,
    );
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🏠 Creating Ventas sample properties (inventory)...',
  );
  const districtLima = await prisma.district.findUnique({
    where: { id: SAMPLE_DISTRICT_ID_LIMA },
  });
  if (!districtLima) {
    logger.info(
      { event: 'seed.progress' },
      '   ⚠️  District SAMPLE not found — skipping Ventas properties',
    );
  } else {
    for (const p of VENTAS_SAMPLE_PROPERTIES) {
      const existsProp = await prisma.property.findFirst({
        where: { applicationId: ventasAppId, code: p.code, deletedAt: null },
      });
      if (existsProp) {
        logger.info(
          { event: 'seed.progress' },
          `   ✓ Property "${p.code}" already exists`,
        );
        continue;
      }
      const pt = await prisma.propertyType.findUnique({
        where: { code: p.propertyTypeCode },
      });
      if (!pt) {
        logger.info(
          { event: 'seed.progress' },
          `   ⚠️  PropertyType ${p.propertyTypeCode} not found — skip ${p.code}`,
        );
        continue;
      }
      const ownerId = ownerIdByDocument.get(p.ownerDocumentNumber);
      if (!ownerId) {
        logger.info(
          { event: 'seed.progress' },
          `   ⚠️  Owner doc ${p.ownerDocumentNumber} not found — skip ${p.code}`,
        );
        continue;
      }
      await prisma.property.create({
        data: {
          applicationId: ventasAppId,
          code: p.code,
          addressLine: p.addressLine,
          districtId: districtLima.id,
          propertyTypeId: pt.id,
          description: p.description,
          area: p.area,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          ownerId,
          salePrice: p.salePrice,
          projectName: p.projectName,
          listingStatus: p.listingStatus,
          ...(p.mediaItems.length > 0 ? { mediaItems: p.mediaItems } : {}),
          createdBy: adminUser.id,
        },
      });
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Property "${p.code}" (${p.listingStatus}) created`,
      );
    }
  }
}
