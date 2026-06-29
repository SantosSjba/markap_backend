import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

const STAGES = [
  { stageKey: 'planificacion', label: 'Planificación', sortOrder: 0 },
  { stageKey: 'corte', label: 'Corte', sortOrder: 1 },
  { stageKey: 'ensamble', label: 'Ensamble', sortOrder: 2 },
  { stageKey: 'acabados', label: 'Acabados', sortOrder: 3 },
];

/**
 * Órdenes de trabajo demo en distintos estados.
 */
export async function seedProduccionWorkOrders(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  produccion app not found — skipping work orders seed');
    return;
  }

  const count = await prisma.produccionWorkOrder.count({ where: { applicationId: appId } });
  if (count > 0) {
    console.log('\n🔧 OT producción ya sembradas — omitiendo');
    return;
  }

  const mesa = await prisma.produccionFurniture.findFirst({
    where: { applicationId: appId, code: 'MUE-COM-001' },
  });
  const escritorio = await prisma.produccionFurniture.findFirst({
    where: { applicationId: appId, code: 'MUE-ESC-001' },
  });
  if (!mesa) {
    console.log('\n⚠️  Sin muebles demo — omitiendo seed OT');
    return;
  }

  const client = await prisma.client.findFirst({
    where: { applicationId: appId, clientType: 'RESIDENTIAL' },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n🔧 Creando órdenes de trabajo demo…');

  const year = new Date().getFullYear();

  // OT pendiente
  await prisma.produccionWorkOrder.create({
    data: {
      applicationId: appId,
      code: `OT-${year}-0001`,
      clientId: client?.id ?? null,
      status: 'PENDING',
      priority: 'NORMAL',
      currentStageKey: 'planificacion',
      progressPercent: new Prisma.Decimal(0),
      assignedTo: seedPrueba('Juan Pérez'),
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Mesa comedor para cliente residencial',
      lines: {
        create: [{ furnitureId: mesa.id, quantity: new Prisma.Decimal(1) }],
      },
      stages: {
        create: STAGES.map((s) => ({
          stageKey: s.stageKey,
          label: s.label,
          sortOrder: s.sortOrder,
          status: 'PENDING',
        })),
      },
    },
  });

  // OT en proceso (corte)
  const wo2 = await prisma.produccionWorkOrder.create({
    data: {
      applicationId: appId,
      code: `OT-${year}-0002`,
      clientId: client?.id ?? null,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      currentStageKey: 'corte',
      progressPercent: new Prisma.Decimal(25),
      assignedTo: seedPrueba('María López'),
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Producción urgente',
      lines: {
        create: [
          {
            furnitureId: mesa.id,
            quantity: new Prisma.Decimal(2),
          },
        ],
      },
      stages: {
        create: STAGES.map((s, i) => ({
          stageKey: s.stageKey,
          label: s.label,
          sortOrder: s.sortOrder,
          status: i === 0 ? 'DONE' : i === 1 ? 'IN_PROGRESS' : 'PENDING',
          startedAt: i <= 1 ? new Date(Date.now() - (2 - i) * 24 * 60 * 60 * 1000) : null,
          completedAt: i === 0 ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
          assignee: i === 1 ? seedPrueba('Operario corte') : null,
        })),
      },
    },
  });

  // OT completada
  if (escritorio) {
    await prisma.produccionWorkOrder.create({
      data: {
        applicationId: appId,
        code: `OT-${year}-0003`,
        status: 'COMPLETED',
        priority: 'NORMAL',
        currentStageKey: 'acabados',
        progressPercent: new Prisma.Decimal(100),
        assignedTo: seedPrueba('Equipo acabados'),
        startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lines: {
          create: [{ furnitureId: escritorio.id, quantity: new Prisma.Decimal(1) }],
        },
        stages: {
          create: STAGES.map((s) => ({
            stageKey: s.stageKey,
            label: s.label,
            sortOrder: s.sortOrder,
            status: 'DONE',
            startedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          })),
        },
      },
    });
  }

  console.log(`   ✅ 3 OT demo (pendiente, en proceso ${wo2.code}, terminada)`);
}
