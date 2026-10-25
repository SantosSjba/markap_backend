import {
  SAMPLE_DISTRICT_ID_LIMA,
  SAMPLE_EXTERNAL_AGENT,
  SAMPLE_NOTIFICATION,
  SAMPLE_OWNER_ADDRESS,
  SAMPLE_OWNER_CLIENT,
  SAMPLE_PROPERTY,
  SAMPLE_RENTAL,
  SAMPLE_RENTAL_ATTACHMENT,
  SAMPLE_RENTAL_FINANCIAL,
  SAMPLE_TENANT_CLIENT,
  SEED_PRIMARY_APPLICATION_SLUG,
} from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-alquileres');

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function seedDemoAlquileres(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  logger.info({ event: 'seed.progress' }, '\n👥 Creating sample clients...');
  const alquileresAppId = appIdBySlug[SEED_PRIMARY_APPLICATION_SLUG];
  const dniType = await prisma.documentType.findUnique({
    where: { code: 'DNI' },
  });
  if (!dniType) throw new Error('DocumentType DNI not found');

  let ownerClient = await prisma.client.findFirst({
    where: { applicationId: alquileresAppId, clientType: 'OWNER' },
  });
  if (!ownerClient) {
    ownerClient = await prisma.client.create({
      data: {
        applicationId: alquileresAppId,
        clientType: 'OWNER',
        documentTypeId: dniType.id,
        ...SAMPLE_OWNER_CLIENT,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Owner client "${SAMPLE_OWNER_CLIENT.fullName}" created`,
    );
  } else {
    logger.info({ event: 'seed.progress' }, '   ✓ Owner client already exists');
  }

  let tenantClient = await prisma.client.findFirst({
    where: { applicationId: alquileresAppId, clientType: 'TENANT' },
  });
  if (!tenantClient) {
    tenantClient = await prisma.client.create({
      data: {
        applicationId: alquileresAppId,
        clientType: 'TENANT',
        documentTypeId: dniType.id,
        ...SAMPLE_TENANT_CLIENT,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Tenant client "${SAMPLE_TENANT_CLIENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Tenant client already exists',
    );
  }

  logger.info({ event: 'seed.progress' }, '\n📍 Creating sample address...');
  const districtLima = await prisma.district.findUnique({
    where: { id: SAMPLE_DISTRICT_ID_LIMA },
  });
  if (districtLima) {
    const existingAddress = await prisma.address.findFirst({
      where: { clientId: ownerClient.id },
    });
    if (!existingAddress) {
      await prisma.address.create({
        data: {
          clientId: ownerClient.id,
          ...SAMPLE_OWNER_ADDRESS,
          districtId: districtLima.id,
        },
      });
      logger.info(
        { event: 'seed.progress' },
        '   ✅ Address for owner created',
      );
    } else {
      logger.info(
        { event: 'seed.progress' },
        '   ✓ Address for owner already exists',
      );
    }
  }

  logger.info({ event: 'seed.progress' }, '\n🏡 Creating sample property...');
  const depType = await prisma.propertyType.findUnique({
    where: { code: 'DEP' },
  });
  if (!depType) throw new Error('PropertyType DEP not found');

  let sampleProperty = await prisma.property.findFirst({
    where: { applicationId: alquileresAppId, code: SAMPLE_PROPERTY.code },
  });
  if (!sampleProperty && districtLima) {
    sampleProperty = await prisma.property.create({
      data: {
        applicationId: alquileresAppId,
        propertyTypeId: depType.id,
        districtId: districtLima.id,
        ...SAMPLE_PROPERTY,
        ownerId: ownerClient.id,
        createdBy: adminUser.id,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ Property "${SAMPLE_PROPERTY.code}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Sample property already exists',
    );
  }

  logger.info({ event: 'seed.progress' }, '\n📋 Creating sample rental...');
  let sampleRental: { id: string } | null = null;
  if (sampleProperty) {
    sampleRental = await prisma.rental.findFirst({
      where: { propertyId: sampleProperty.id },
      select: { id: true },
    });
    if (!sampleRental) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      sampleRental = await prisma.rental.create({
        data: {
          applicationId: alquileresAppId,
          propertyId: sampleProperty.id,
          tenantId: tenantClient.id,
          startDate,
          endDate,
          ...SAMPLE_RENTAL,
          createdBy: adminUser.id,
        },
        select: { id: true },
      });
      logger.info(
        { event: 'seed.progress' },
        '   ✅ Sample rental (contract) created',
      );
    } else {
      logger.info(
        { event: 'seed.progress' },
        '   ✓ Sample rental already exists',
      );
    }
  }

  logger.info({ event: 'seed.progress' }, '\n🤝 Creating sample agents...');
  let internalAgent = await prisma.agent.findFirst({
    where: { applicationId: alquileresAppId, type: 'INTERNAL' },
  });
  if (!internalAgent) {
    internalAgent = await prisma.agent.create({
      data: {
        applicationId: alquileresAppId,
        type: 'INTERNAL',
        userId: adminUser.id,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        isActive: true,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Internal agent (admin user) created',
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Internal agent already exists',
    );
  }

  const rucType = await prisma.documentType.findUnique({
    where: { code: 'RUC' },
  });
  let externalAgent = await prisma.agent.findFirst({
    where: { applicationId: alquileresAppId, type: 'EXTERNAL' },
  });
  if (!externalAgent) {
    externalAgent = await prisma.agent.create({
      data: {
        applicationId: alquileresAppId,
        type: 'EXTERNAL',
        fullName: SAMPLE_EXTERNAL_AGENT.fullName,
        email: SAMPLE_EXTERNAL_AGENT.email,
        phone: SAMPLE_EXTERNAL_AGENT.phone,
        ...(rucType && {
          documentTypeId: rucType.id,
          documentNumber: SAMPLE_EXTERNAL_AGENT.documentNumber,
        }),
        isActive: true,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      `   ✅ External agent "${SAMPLE_EXTERNAL_AGENT.fullName}" created`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ External agent already exists',
    );
  }

  if (sampleRental) {
    logger.info(
      { event: 'seed.progress' },
      '\n💰 Creating rental financial config...',
    );
    const existingConfig = await prisma.rentalFinancialConfig.findUnique({
      where: { rentalId: sampleRental.id },
    });
    if (!existingConfig) {
      await prisma.rentalFinancialConfig.create({
        data: {
          rentalId: sampleRental.id,
          ...SAMPLE_RENTAL_FINANCIAL,
          externalAgentId: externalAgent.id,
          internalAgentId: internalAgent.id,
        },
      });
      logger.info(
        { event: 'seed.progress' },
        '   ✅ Rental financial config created',
      );
    } else {
      logger.info(
        { event: 'seed.progress' },
        '   ✓ Rental financial config already exists',
      );
    }

    logger.info(
      { event: 'seed.progress' },
      '\n📎 Creating sample rental attachment...',
    );
    const existingAttachment = await prisma.rentalAttachment.findFirst({
      where: { rentalId: sampleRental.id },
    });
    if (!existingAttachment) {
      await prisma.rentalAttachment.create({
        data: {
          rentalId: sampleRental.id,
          ...SAMPLE_RENTAL_ATTACHMENT,
        },
      });
      logger.info(
        { event: 'seed.progress' },
        '   ✅ Sample rental attachment (placeholder) created',
      );
    } else {
      logger.info(
        { event: 'seed.progress' },
        '   ✓ Sample rental attachment already exists',
      );
    }
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🔔 Creating sample notification...',
  );
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: adminUser.id },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        ...SAMPLE_NOTIFICATION,
      },
    });
    logger.info(
      { event: 'seed.progress' },
      '   ✅ Sample notification created',
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✓ Sample notification already exists',
    );
  }
}
