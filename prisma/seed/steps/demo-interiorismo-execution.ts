import { Prisma } from '@prisma/client';
import { INTERIORISMO_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-interiorismo-execution');

const DEMO_PROJECT_CODE = 'INT-REM-LIM-001';

/**
 * Tareas Kanban, evidencias, incidencias y costos reales demo (proyecto remodelación).
 */
export async function seedInteriorismoExecution(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  interiorismo app not found — skipping execution seed',
    );
    return;
  }

  const proj = await prisma.interiorProject.findFirst({
    where: {
      applicationId: interiorAppId,
      OR: [{ code: DEMO_PROJECT_CODE }, { legacyCode: DEMO_PROJECT_CODE }],
      deletedAt: null,
    },
  });
  if (!proj) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  Proyecto demo INT-REM-LIM-001 no encontrado — omitiendo ejecución',
    );
    return;
  }

  const nTasks = await prisma.interiorExecutionTask.count({
    where: { projectId: proj.id },
  });
  if (nTasks > 0) {
    logger.info(
      { event: 'seed.progress' },
      '\n🔧 Ejecución demo ya existe — omitiendo',
    );
    return;
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🔧 Sembrando datos de ejecución (tareas, evidencias, incidencias, costos)…',
  );

  const mat = await prisma.interiorCatalogMaterial.findFirst({
    where: { applicationId: interiorAppId, code: 'MAT-PISO-001' },
    select: { id: true },
  });

  await prisma.interiorExecutionTask.createMany({
    data: [
      {
        projectId: proj.id,
        phase: 'DESIGN',
        title: seedPrueba('Entrega planimetría mobiliario cocina'),
        description: 'DWG + renders finales para fabricación',
        kanbanStatus: 'DONE',
        sortOrder: 0,
        plannedStart: new Date('2026-03-01'),
        plannedEnd: new Date('2026-03-20'),
        progressPct: new Prisma.Decimal(100),
      },
      {
        projectId: proj.id,
        phase: 'DESIGN',
        title: seedPrueba('Selección de textil y luminarias dormitorio'),
        kanbanStatus: 'IN_PROGRESS',
        sortOrder: 1,
        plannedStart: new Date('2026-04-01'),
        plannedEnd: new Date('2026-04-25'),
        progressPct: new Prisma.Decimal(55),
      },
      {
        projectId: proj.id,
        phase: 'PURCHASES',
        title: seedPrueba('OC melamina y herrajes'),
        kanbanStatus: 'IN_PROGRESS',
        sortOrder: 0,
        plannedStart: new Date('2026-04-05'),
        plannedEnd: new Date('2026-04-18'),
        progressPct: new Prisma.Decimal(40),
      },
      {
        projectId: proj.id,
        phase: 'PRODUCTION',
        title: seedPrueba('Fabricación muebles cocina — taller'),
        kanbanStatus: 'BACKLOG',
        sortOrder: 0,
        plannedStart: new Date('2026-05-01'),
        plannedEnd: new Date('2026-06-15'),
        progressPct: new Prisma.Decimal(0),
      },
      {
        projectId: proj.id,
        phase: 'INSTALLATION',
        title: seedPrueba('Montaje en obra — semana 1'),
        kanbanStatus: 'BACKLOG',
        sortOrder: 0,
        plannedStart: new Date('2026-06-20'),
        plannedEnd: new Date('2026-07-05'),
        progressPct: new Prisma.Decimal(0),
      },
    ],
  });

  const tasks = await prisma.interiorExecutionTask.findMany({
    where: { projectId: proj.id },
    select: { id: true, title: true },
    take: 2,
  });
  const taskForPhoto = tasks[0]?.id ?? null;

  await prisma.interiorExecutionEvidence.createMany({
    data: [
      {
        projectId: proj.id,
        taskId: taskForPhoto,
        kind: 'PHOTO',
        title: seedPrueba('Avance diseño — vista living'),
        fileUrl: 'https://picsum.photos/seed/markap-exec-living/960/540',
        capturedAt: new Date('2026-04-02T16:00:00.000Z'),
      },
      {
        projectId: proj.id,
        taskId: null,
        kind: 'DOCUMENT',
        title: seedPrueba('Acta reunión cliente — cambios cocina'),
        fileUrl: 'https://example.com/docs/acta-cocina-demo.pdf',
        capturedAt: new Date('2026-03-28T10:30:00.000Z'),
      },
    ],
  });

  await prisma.interiorExecutionIncident.createMany({
    data: [
      {
        projectId: proj.id,
        severity: 'MEDIUM',
        title: seedPrueba('Demora en muestra de mesón'),
        description: seedPrueba('Proveedor reprogramó visita a taller'),
        status: 'OPEN',
        reportedAt: new Date('2026-04-08T09:00:00.000Z'),
      },
      {
        projectId: proj.id,
        severity: 'LOW',
        title: seedPrueba('Ajuste tonalidad pintura dormitorio'),
        description: seedPrueba('Cliente solicitó muestra adicional'),
        status: 'CLOSED',
        reportedAt: new Date('2026-03-22T14:00:00.000Z'),
        closedAt: new Date('2026-03-25T11:00:00.000Z'),
      },
    ],
  });

  await prisma.interiorExecutionActualCost.createMany({
    data: [
      {
        projectId: proj.id,
        costCategory: 'LABOR',
        concept: seedPrueba('Maestro carpintero — instalación parcial'),
        amount: new Prisma.Decimal('4200'),
        occurredAt: new Date('2026-04-01'),
        catalogMaterialId: null,
      },
      {
        projectId: proj.id,
        costCategory: 'MATERIAL',
        concept: seedPrueba(
          mat
            ? 'Compra porcelanato referencia catálogo'
            : 'Compra porcelanato obra',
        ),
        amount: new Prisma.Decimal('3850.5'),
        occurredAt: new Date('2026-04-03'),
        catalogMaterialId: mat?.id ?? null,
      },
      {
        projectId: proj.id,
        costCategory: 'TRANSPORT',
        concept: seedPrueba('Transporte y estiba materiales'),
        amount: new Prisma.Decimal('680'),
        occurredAt: new Date('2026-04-04'),
        catalogMaterialId: null,
      },
    ],
  });

  logger.info({ event: 'seed.progress' }, '   ✅ Ejecución demo lista');
}
