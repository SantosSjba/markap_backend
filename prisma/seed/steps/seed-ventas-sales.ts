import type { SeedDb } from '../types';

const CODE_CRM_ACTIVE = 'VNT-PRC-SEED-CRM';
const CODE_CLOSED_JOURNEY = 'VNT-PRC-SEED-001';

/**
 * Ventas CRM: proceso activo para pipeline + proceso cerrado (separación/cierre/comisión).
 * Idempotente por código de proceso.
 *
 * Nota: el flujo cerrado deja el proceso en WON (no aparece en el Kanban, que filtra ACTIVE).
 * Por eso existe VNT-PRC-SEED-CRM en etapa NEGOTIATION siempre ACTIVE.
 */
export async function seedVentasSales(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const ventasAppId = appIdBySlug['ventas'];
  if (!ventasAppId) {
    console.log('\n⚠️  Ventas app not found — skipping seed-ventas-sales');
    return;
  }

  await seedCrmActiveProcess(prisma, ventasAppId);
  await seedClosedJourneyDemo(prisma, ventasAppId);
}

async function seedCrmActiveProcess(prisma: SeedDb, ventasAppId: string): Promise<void> {
  const existing = await prisma.saleProcess.findFirst({
    where: { applicationId: ventasAppId, code: CODE_CRM_ACTIVE },
  });
  if (existing) {
    console.log(`\n   ✓ Ventas CRM seed (${CODE_CRM_ACTIVE}) already exists`);
    return;
  }

  const buyer = await prisma.client.findFirst({
    where: {
      applicationId: ventasAppId,
      clientType: 'BUYER',
      documentNumber: '40234567',
      deletedAt: null,
    },
  });
  const prop = await prisma.property.findFirst({
    where: { applicationId: ventasAppId, code: 'VNT-SEED-CRM', deletedAt: null },
  });
  const agent = await prisma.agent.findFirst({
    where: { applicationId: ventasAppId, deletedAt: null, isActive: true },
  });

  if (!buyer || !prop || !agent) {
    console.log(
      '\n⚠️  seed-ventas-sales (pipeline ACTIVE): falta comprador DNI 40234567, propiedad VNT-SEED-CRM o agente.',
    );
    console.log(
      '   → Ejecute el seed completo: npm run prisma:seed (asegure demo-ventas + nueva fila VNT-SEED-CRM en sample-ventas).',
    );
    return;
  }

  console.log(`\n📌 Seeding Ventas CRM — proceso ACTIVE para pipeline (${CODE_CRM_ACTIVE})...`);

  await prisma.$transaction(async (tx) => {
    const process = await tx.saleProcess.create({
      data: {
        applicationId: ventasAppId,
        code: CODE_CRM_ACTIVE,
        buyerClientId: buyer.id,
        propertyId: prop.id,
        agentId: agent.id,
        pipelineStage: 'NEGOTIATION',
        status: 'ACTIVE',
        title: 'Demo pipeline — Carmen Vega (negociación)',
      },
    });

    await tx.saleProcessNote.create({
      data: {
        saleProcessId: process.id,
        body: 'Cliente pide descuento por pago al contado. Enviar propuesta antes del viernes.',
      },
    });
    await tx.saleProcessActivity.create({
      data: {
        saleProcessId: process.id,
        activityType: 'CALL',
        title: 'Llamada de seguimiento',
        description: 'Acordó revisar números con el cónyuge.',
      },
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await tx.saleProcessReminder.create({
      data: {
        saleProcessId: process.id,
        title: 'Enviar cotización actualizada',
        dueAt: tomorrow,
      },
    });
  });

  console.log(`   ✅ ${CODE_CRM_ACTIVE} — ACTIVE / NEGOTIATION (visible en pipeline y listado)`);
}

async function seedClosedJourneyDemo(prisma: SeedDb, ventasAppId: string): Promise<void> {
  const existing = await prisma.saleProcess.findFirst({
    where: { applicationId: ventasAppId, code: CODE_CLOSED_JOURNEY },
  });
  if (existing) {
    console.log(`\n   ✓ Ventas CRM seed (${CODE_CLOSED_JOURNEY}) already exists`);
    return;
  }

  const buyer = await prisma.client.findFirst({
    where: {
      applicationId: ventasAppId,
      clientType: 'BUYER',
      documentNumber: '40123456',
      deletedAt: null,
    },
  });
  const propAvailable = await prisma.property.findFirst({
    where: { applicationId: ventasAppId, code: 'VNT-SEED-001', deletedAt: null },
  });
  const agent = await prisma.agent.findFirst({
    where: { applicationId: ventasAppId, deletedAt: null, isActive: true },
  });

  if (!buyer || !propAvailable || !agent) {
    console.log(
      '\n⚠️  seed-ventas-sales (cierre demo): falta buyer DNI 40123456, propiedad VNT-SEED-001 o agente — omitiendo cierre demo',
    );
    return;
  }

  console.log('\n📊 Seeding Ventas CRM (proceso → separación → cierre → WON)...');

  await prisma.$transaction(async (tx) => {
    const process = await tx.saleProcess.create({
      data: {
        applicationId: ventasAppId,
        code: CODE_CLOSED_JOURNEY,
        buyerClientId: buyer.id,
        propertyId: propAvailable.id,
        agentId: agent.id,
        pipelineStage: 'NEGOTIATION',
        status: 'ACTIVE',
        title: 'Lead demo — Torre Vista Mar (cierre seed)',
      },
    });

    await tx.saleProcessNote.create({
      data: {
        saleProcessId: process.id,
        body: 'Cliente interesado en visitar planta 8. Coordinar con portero.',
      },
    });
    await tx.saleProcessActivity.create({
      data: {
        saleProcessId: process.id,
        activityType: 'VISIT',
        title: 'Visita programada',
        description: 'Recorrido con pareja decisora',
        completedAt: new Date(),
      },
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await tx.saleProcessReminder.create({
      data: {
        saleProcessId: process.id,
        title: 'Llamar para feedback post-visita',
        dueAt: tomorrow,
      },
    });

    const sep = await tx.saleSeparation.create({
      data: {
        applicationId: ventasAppId,
        saleProcessId: process.id,
        propertyId: propAvailable.id,
        buyerClientId: buyer.id,
        amount: 5000,
        currency: 'PEN',
        separationDate: new Date(),
        status: 'ACTIVE',
        notes: 'Separación demo (seed)',
      },
    });

    await tx.property.update({
      where: { id: propAvailable.id },
      data: { listingStatus: 'RESERVED' },
    });

    await tx.saleProcess.update({
      where: { id: process.id },
      data: { pipelineStage: 'SEPARATION' },
    });

    const closing = await tx.saleClosing.create({
      data: {
        applicationId: ventasAppId,
        saleProcessId: process.id,
        saleSeparationId: sep.id,
        propertyId: propAvailable.id,
        buyerClientId: buyer.id,
        agentId: agent.id,
        finalPrice: 380000,
        paymentType: 'CREDIT',
        notes: 'Cierre demo — comisión pendiente de pago',
      },
    });

    await tx.saleCommission.create({
      data: {
        applicationId: ventasAppId,
        saleClosingId: closing.id,
        agentId: agent.id,
        amount: 11400,
        percentApplied: 3,
        status: 'PENDING',
      },
    });

    await tx.property.update({
      where: { id: propAvailable.id },
      data: { listingStatus: 'SOLD' },
    });

    await tx.saleSeparation.update({
      where: { id: sep.id },
      data: { status: 'CLOSED' },
    });

    await tx.saleProcess.update({
      where: { id: process.id },
      data: {
        status: 'WON',
        pipelineStage: 'CLOSING',
        closedAt: new Date(),
      },
    });
  });

  console.log(
    `   ✅ ${CODE_CLOSED_JOURNEY} + separación + cierre + comisión (estado WON — no en Kanban ACTIVE)`,
  );
}
