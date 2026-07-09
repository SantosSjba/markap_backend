import { Prisma } from '@prisma/client';
import { ARQUITECTURA_APPLICATION_SLUG, ARQUITECTURA_DEMO_PROJECT_CODES, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Tareas Kanban, evidencias, incidencias y costos reales demo (proyecto residencial).
 */
export async function seedArquitecturaExecution(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    console.log('\n⚠️  arquitectura app not found — skipping execution seed');
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
    console.log('\n⚠️  Proyecto demo ARQ-REM-LIM-001 no encontrado — omitiendo ejecución');
    return;
  }

  const nTasks = await prisma.arquitecturaExecutionTask.count({ where: { projectId: proj.id } });
  if (nTasks > 0) {
    console.log('\n🔧 Ejecución arquitectura demo ya existe — omitiendo');
    return;
  }

  console.log('\n🔧 Sembrando ejecución arquitectura (tareas, evidencias, incidencias, costos)…');

  const mat = await prisma.arquitecturaCatalogMaterial.findFirst({
    where: { applicationId: arquitecturaAppId, code: 'ARQ-CEM-001' },
    select: { id: true },
  });

  await prisma.arquitecturaExecutionTask.createMany({
    data: [
      {
        projectId: proj.id,
        phase: 'DESIGN',
        title: seedPrueba('Entrega planos arquitectónicos definitivos'),
        description: 'DWG + PDF para licencia de obra',
        kanbanStatus: 'DONE',
        sortOrder: 0,
        plannedStart: new Date('2026-01-15'),
        plannedEnd: new Date('2026-02-10'),
        progressPct: new Prisma.Decimal(100),
      },
      {
        projectId: proj.id,
        phase: 'DESIGN',
        title: seedPrueba('Coordinación estructural — vigas segundo nivel'),
        kanbanStatus: 'IN_PROGRESS',
        sortOrder: 1,
        plannedStart: new Date('2026-04-01'),
        plannedEnd: new Date('2026-04-25'),
        progressPct: new Prisma.Decimal(60),
      },
      {
        projectId: proj.id,
        phase: 'PURCHASES',
        title: seedPrueba('OC cemento y acero — primera etapa'),
        kanbanStatus: 'IN_PROGRESS',
        sortOrder: 0,
        plannedStart: new Date('2026-03-01'),
        plannedEnd: new Date('2026-03-20'),
        progressPct: new Prisma.Decimal(75),
      },
      {
        projectId: proj.id,
        phase: 'PRODUCTION',
        title: seedPrueba('Encofrado y vaciado losa segundo piso'),
        kanbanStatus: 'BACKLOG',
        sortOrder: 0,
        plannedStart: new Date('2026-05-15'),
        plannedEnd: new Date('2026-06-10'),
        progressPct: new Prisma.Decimal(0),
      },
      {
        projectId: proj.id,
        phase: 'INSTALLATION',
        title: seedPrueba('Instalaciones sanitarias — planta baja'),
        kanbanStatus: 'BACKLOG',
        sortOrder: 0,
        plannedStart: new Date('2026-07-01'),
        plannedEnd: new Date('2026-07-25'),
        progressPct: new Prisma.Decimal(0),
      },
    ],
  });

  const tasks = await prisma.arquitecturaExecutionTask.findMany({
    where: { projectId: proj.id },
    select: { id: true, title: true },
    take: 2,
  });
  const taskForPhoto = tasks[0]?.id ?? null;

  await prisma.arquitecturaExecutionEvidence.createMany({
    data: [
      {
        projectId: proj.id,
        taskId: taskForPhoto,
        kind: 'PHOTO',
        title: seedPrueba('Avance cimentación — vista general'),
        fileUrl: 'https://picsum.photos/seed/markap-arq-obra/960/540',
        capturedAt: new Date('2026-03-18T11:00:00.000Z'),
      },
      {
        projectId: proj.id,
        taskId: null,
        kind: 'DOCUMENT',
        title: seedPrueba('Acta de inicio de obra firmada'),
        fileUrl: 'https://example.com/docs/acta-inicio-arq-demo.pdf',
        capturedAt: new Date('2026-02-22T09:30:00.000Z'),
      },
    ],
  });

  await prisma.arquitecturaExecutionIncident.createMany({
    data: [
      {
        projectId: proj.id,
        severity: 'MEDIUM',
        title: seedPrueba('Retraso entrega acero corrugado'),
        description: seedPrueba('Proveedor reprogramó despacho 3 días'),
        status: 'OPEN',
        reportedAt: new Date('2026-03-20T08:00:00.000Z'),
      },
      {
        projectId: proj.id,
        severity: 'LOW',
        title: seedPrueba('Ajuste trazo muro perimetral'),
        description: seedPrueba('Cliente solicitó ampliar ventanal sala'),
        status: 'CLOSED',
        reportedAt: new Date('2026-02-28T14:00:00.000Z'),
        closedAt: new Date('2026-03-05T10:00:00.000Z'),
      },
    ],
  });

  await prisma.arquitecturaExecutionActualCost.createMany({
    data: [
      {
        projectId: proj.id,
        costCategory: 'LABOR',
        concept: seedPrueba('Cuadrilla albañilería — cimentación'),
        amount: new Prisma.Decimal('18500'),
        occurredAt: new Date('2026-03-15'),
        catalogMaterialId: null,
      },
      {
        projectId: proj.id,
        costCategory: 'MATERIAL',
        concept: seedPrueba(mat ? 'Compra cemento referencia catálogo' : 'Compra cemento obra'),
        amount: new Prisma.Decimal('8480'),
        occurredAt: new Date('2026-03-10'),
        catalogMaterialId: mat?.id ?? null,
      },
      {
        projectId: proj.id,
        costCategory: 'TRANSPORT',
        concept: seedPrueba('Transporte materiales estructura'),
        amount: new Prisma.Decimal('580'),
        occurredAt: new Date('2026-04-02'),
        catalogMaterialId: null,
      },
    ],
  });

  console.log('   ✅ Ejecución arquitectura demo lista');
}
