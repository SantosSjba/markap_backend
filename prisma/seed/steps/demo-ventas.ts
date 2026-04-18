import {
  VENTAS_SAMPLE_BUYER_CLIENTS,
  VENTAS_SAMPLE_EXTERNAL_AGENT,
} from '../data/sample-ventas';
import type { SeedDb } from '../types';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

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
    console.log('\n⚠️  Ventas app not found in appIdBySlug — skipping demo-ventas');
    return;
  }

  const dniType = await prisma.documentType.findUnique({ where: { code: 'DNI' } });
  if (!dniType) throw new Error('DocumentType DNI not found');

  console.log('\n🤝 Creating Ventas sample agents...');
  let internalVentasAgent = await prisma.agent.findFirst({
    where: { applicationId: ventasAppId, type: 'INTERNAL', userId: adminUser.id },
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
    console.log('   ✅ Ventas internal agent (admin) created');
  } else {
    console.log('   ✓ Ventas internal agent already exists');
  }

  const rucType = await prisma.documentType.findUnique({ where: { code: 'RUC' } });
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
    console.log(`   ✅ Ventas external agent "${VENTAS_SAMPLE_EXTERNAL_AGENT.fullName}" created`);
  } else {
    console.log('   ✓ Ventas external agent already exists');
  }

  console.log('\n👥 Creating Ventas sample clients (BUYER / CRM)...');
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
      console.log(`   ✓ Buyer client "${sample.fullName}" already exists`);
      continue;
    }

    let assignedAgentId: string | null = null;
    if (sample.assignedAgent === 'internal') assignedAgentId = internalVentasAgent.id;
    if (sample.assignedAgent === 'external') assignedAgentId = externalVentasAgent.id;

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
    console.log(`   ✅ Buyer client "${sample.fullName}" (${sample.salesStatus}) created`);
  }
}
