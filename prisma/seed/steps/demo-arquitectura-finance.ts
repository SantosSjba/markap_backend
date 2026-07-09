import { Prisma } from '@prisma/client';
import { ARQUITECTURA_APPLICATION_SLUG, ARQUITECTURA_DEMO_PROJECT_CODES, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Programación de cobranzas y pagos demo (proyecto residencial).
 */
export async function seedArquitecturaFinance(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    console.log('\n⚠️  arquitectura app not found — skipping finance seed');
    return;
  }

  const proj = await prisma.arquitecturaProject.findFirst({
    where: {
      applicationId: arquitecturaAppId,
      code: ARQUITECTURA_DEMO_PROJECT_CODES.residential,
      deletedAt: null,
    },
  });
  if (!proj) {
    console.log('\n⚠️  Proyecto demo ARQ-REM-LIM-001 no encontrado — omitiendo finanzas');
    return;
  }

  const nSch = await prisma.arquitecturaFinanceIncomeSchedule.count({ where: { projectId: proj.id } });
  if (nSch > 0) {
    console.log('\n💰 Finanzas arquitectura demo ya existe — omitiendo');
    return;
  }

  console.log('\n💰 Sembrando finanzas arquitectura (adelantos, cuotas, pagos)…');

  const adv = await prisma.arquitecturaFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'ADVANCE',
      dueDate: new Date('2026-02-25'),
      amount: new Prisma.Decimal('45000'),
      concept: seedPrueba('Adelanto 15% — firma de contrato'),
      sortOrder: 0,
      status: 'PENDING',
    },
  });

  const q1 = await prisma.arquitecturaFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'INSTALLMENT',
      dueDate: new Date('2026-04-15'),
      amount: new Prisma.Decimal('62000'),
      concept: seedPrueba('Cuota 1 — inicio de obra'),
      sortOrder: 1,
      status: 'PENDING',
    },
  });

  await prisma.arquitecturaFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'INSTALLMENT',
      dueDate: new Date('2026-06-15'),
      amount: new Prisma.Decimal('75000'),
      concept: seedPrueba('Cuota 2 — estructura primer nivel'),
      sortOrder: 2,
      status: 'PENDING',
    },
  });

  await prisma.arquitecturaProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-02-20T10:00:00.000Z'),
      amount: new Prisma.Decimal('45000'),
      concept: seedPrueba('Transferencia — adelanto 15%'),
      paymentType: 'ABONO',
      status: 'PAID',
      scheduleItemId: adv.id,
    },
  });

  await prisma.arquitecturaFinanceIncomeSchedule.update({
    where: { id: adv.id },
    data: { status: 'PAID' },
  });

  await prisma.arquitecturaProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-04-10T09:30:00.000Z'),
      amount: new Prisma.Decimal('62000'),
      concept: seedPrueba('Transferencia — cuota 1'),
      paymentType: 'ABONO',
      status: 'PAID',
      scheduleItemId: q1.id,
    },
  });

  await prisma.arquitecturaFinanceIncomeSchedule.update({
    where: { id: q1.id },
    data: { status: 'PAID' },
  });

  await prisma.arquitecturaProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-04-28T14:00:00.000Z'),
      amount: new Prisma.Decimal('8500'),
      concept: seedPrueba('Factura extra — variación ventanal'),
      paymentType: 'OTHER',
      status: 'PAID',
      scheduleItemId: null,
    },
  });

  console.log('   ✅ Finanzas arquitectura demo lista');
}
