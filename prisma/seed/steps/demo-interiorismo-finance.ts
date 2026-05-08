import { Prisma } from '@prisma/client';
import { INTERIORISMO_APPLICATION_SLUG } from '../data';
import type { SeedDb } from '../types';

const DEMO_PROJECT_CODE = 'INT-REM-LIM-001';

/**
 * Programación de cobranzas y pagos demo (proyecto remodelación).
 */
export async function seedInteriorismoFinance(prisma: SeedDb, appIdBySlug: Record<string, string>): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    console.log('\n⚠️  interiorismo app not found — skipping finance seed');
    return;
  }

  const proj = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: DEMO_PROJECT_CODE, deletedAt: null },
  });
  if (!proj) {
    console.log('\n⚠️  Proyecto demo INT-REM-LIM-001 no encontrado — omitiendo finanzas');
    return;
  }

  const nSch = await prisma.interiorFinanceIncomeSchedule.count({ where: { projectId: proj.id } });
  if (nSch > 0) {
    console.log('\n💰 Finanzas demo ya existe — omitiendo');
    return;
  }

  console.log('\n💰 Sembrando finanzas (adelantos, cuotas, pagos)…');

  const adv = await prisma.interiorFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'ADVANCE',
      dueDate: new Date('2026-03-10'),
      amount: new Prisma.Decimal('12000'),
      concept: 'Adelanto 30% — firma de contrato',
      sortOrder: 0,
      status: 'PENDING',
    },
  });

  const q1 = await prisma.interiorFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'INSTALLMENT',
      dueDate: new Date('2026-04-15'),
      amount: new Prisma.Decimal('15000'),
      concept: 'Cuota 1 — inicio de compras',
      sortOrder: 1,
      status: 'PENDING',
    },
  });

  await prisma.interiorFinanceIncomeSchedule.create({
    data: {
      projectId: proj.id,
      kind: 'INSTALLMENT',
      dueDate: new Date('2026-06-01'),
      amount: new Prisma.Decimal('18000'),
      concept: 'Cuota 2 — avance de obra',
      sortOrder: 2,
      status: 'PENDING',
    },
  });

  await prisma.interiorProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-03-12T11:00:00.000Z'),
      amount: new Prisma.Decimal('12000'),
      concept: 'Transferencia — adelanto 30%',
      status: 'PAID',
      scheduleItemId: adv.id,
    },
  });

  await prisma.interiorFinanceIncomeSchedule.update({
    where: { id: adv.id },
    data: { status: 'PAID' },
  });

  await prisma.interiorProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-04-16T09:30:00.000Z'),
      amount: new Prisma.Decimal('8000'),
      concept: 'Transferencia parcial — cuota 1',
      status: 'PAID',
      scheduleItemId: q1.id,
    },
  });

  await prisma.interiorFinanceIncomeSchedule.update({
    where: { id: q1.id },
    data: { status: 'PARTIAL' },
  });

  await prisma.interiorProjectPayment.create({
    data: {
      projectId: proj.id,
      paidAt: new Date('2026-05-02T14:00:00.000Z'),
      amount: new Prisma.Decimal('3500'),
      concept: 'Factura extra — variación luminarias',
      status: 'PAID',
      scheduleItemId: null,
    },
  });

  console.log('   ✅ Finanzas demo lista');
}
