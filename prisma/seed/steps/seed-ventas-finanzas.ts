import type { SeedDb } from '../types';

/**
 * Finanzas Ventas: perfil de comisión del asesor, cuotas demo, costos de documentación.
 * Idempotente: no duplica si ya hay pagos o costos en el cierre demo.
 */
export async function seedVentasFinanzas(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const ventasAppId = appIdBySlug['ventas'];
  if (!ventasAppId) {
    console.log('\n⚠️  Ventas app not found — skipping seed-ventas-finanzas');
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
  const prop = await prisma.property.findFirst({
    where: { applicationId: ventasAppId, code: 'VNT-SEED-001', deletedAt: null },
  });
  const agent = await prisma.agent.findFirst({
    where: { applicationId: ventasAppId, deletedAt: null, isActive: true },
  });

  if (!buyer || !prop || !agent) {
    console.log(
      '\n⚠️  seed-ventas-finanzas: falta buyer 40123456, VNT-SEED-001 o agente — omitiendo',
    );
    return;
  }

  const closing = await prisma.saleClosing.findFirst({
    where: {
      applicationId: ventasAppId,
      buyerClientId: buyer.id,
      propertyId: prop.id,
    },
  });

  if (!closing) {
    console.log('\n⚠️  seed-ventas-finanzas: no hay cierre demo — ejecute seed-ventas-sales antes');
    return;
  }

  await prisma.ventasAgentCommissionProfile.upsert({
    where: {
      applicationId_agentId: { applicationId: ventasAppId, agentId: agent.id },
    },
    create: {
      applicationId: ventasAppId,
      agentId: agent.id,
      commissionPercent: 3.5,
    },
    update: { commissionPercent: 3.5 },
  });
  console.log('\n   ✓ Perfil de comisión demo (3.5 %) para primer agente activo');

  const existingPayments = await prisma.saleBuyerPayment.count({
    where: { saleClosingId: closing.id },
  });
  if (existingPayments === 0) {
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 10);
    const future = new Date();
    future.setDate(future.getDate() + 30);

    await prisma.saleBuyerPayment.createMany({
      data: [
        {
          saleClosingId: closing.id,
          kind: 'DOWN_PAYMENT',
          amount: 38000,
          currency: 'PEN',
          dueDate: pastDue,
          status: 'PAID',
          paidAt: new Date(),
          notes: 'Inicial (seed)',
        },
        {
          saleClosingId: closing.id,
          kind: 'INSTALLMENT',
          amount: 15000,
          currency: 'PEN',
          dueDate: pastDue,
          status: 'PENDING',
          notes: 'Cuota vencida demo',
        },
        {
          saleClosingId: closing.id,
          kind: 'INSTALLMENT',
          amount: 15000,
          currency: 'PEN',
          dueDate: future,
          status: 'PENDING',
          notes: 'Cuota próxima',
        },
      ],
    });
    console.log('   ✓ Pagos comprador demo (inicial pagada + cuota atrasada + pendiente)');
  } else {
    console.log('   ✓ Pagos comprador ya existen — skip');
  }

  const existingCosts = await prisma.saleDocumentationCost.count({
    where: { saleClosingId: closing.id },
  });
  if (existingCosts === 0) {
    await prisma.saleDocumentationCost.createMany({
      data: [
        {
          applicationId: ventasAppId,
          saleClosingId: closing.id,
          costType: 'NOTARY',
          description: 'Escritura pública (seed)',
          amount: 4200,
          currency: 'PEN',
          expenseDate: new Date(),
        },
        {
          applicationId: ventasAppId,
          saleClosingId: closing.id,
          costType: 'REGISTRY',
          description: 'Inscripción registral (seed)',
          amount: 2800,
          currency: 'PEN',
          expenseDate: new Date(),
        },
      ],
    });
    console.log('   ✓ Costos documentación demo (notaría + registros)');
  } else {
    console.log('   ✓ Costos documentación ya existen — skip');
  }
}
