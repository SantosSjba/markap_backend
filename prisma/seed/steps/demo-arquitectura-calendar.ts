import { ARQUITECTURA_APPLICATION_SLUG, ARQUITECTURA_DEMO_PROJECT_CODES, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Eventos de agenda demo (reuniones, visitas, obra).
 */
export async function seedArquitecturaCalendar(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    console.log('\n⚠️  arquitectura app not found — skipping calendar seed');
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
    console.log('\n⚠️  Proyecto demo no encontrado — omitiendo calendario arquitectura');
    return;
  }

  const n = await prisma.arquitecturaCalendarEvent.count({
    where: { applicationId: arquitecturaAppId },
  });
  if (n > 0) {
    console.log('\n📅 Calendario arquitectura demo ya tiene eventos — omitiendo');
    return;
  }

  console.log('\n📅 Sembrando eventos de calendario arquitectura…');

  const designer = proj.designerAgentId
    ? await prisma.agent.findFirst({ where: { id: proj.designerAgentId }, select: { id: true } })
    : null;

  await prisma.arquitecturaCalendarEvent.createMany({
    data: [
      {
        applicationId: arquitecturaAppId,
        projectId: proj.id,
        eventType: 'MEETING',
        title: seedPrueba('Reunión cliente — avance estructura'),
        description: seedPrueba('Presencial en obra + revisión planos'),
        location: 'Obra La Molina',
        startsAt: new Date('2026-05-14T15:00:00.000Z'),
        endsAt: new Date('2026-05-14T16:30:00.000Z'),
        allDay: false,
        assignedAgentId: designer?.id ?? null,
      },
      {
        applicationId: arquitecturaAppId,
        projectId: proj.id,
        eventType: 'VISIT',
        title: seedPrueba('Visita proveedor — acero estructural'),
        location: 'Almacén proveedor',
        startsAt: new Date('2026-05-20T14:00:00.000Z'),
        endsAt: new Date('2026-05-20T15:00:00.000Z'),
        allDay: false,
        assignedAgentId: proj.supervisorAgentId ?? null,
      },
      {
        applicationId: arquitecturaAppId,
        projectId: proj.id,
        eventType: 'INSTALLATION',
        title: seedPrueba('Vaciado losa segundo piso'),
        startsAt: new Date('2026-06-05T12:00:00.000Z'),
        endsAt: new Date('2026-06-05T18:00:00.000Z'),
        allDay: false,
        assignedAgentId: proj.supervisorAgentId ?? null,
      },
      {
        applicationId: arquitecturaAppId,
        projectId: null,
        eventType: 'TEAM_BLOCK',
        title: seedPrueba('Bloque equipo — planificación semanal arquitectura'),
        description: seedPrueba('Coordinación interna sin proyecto asignado'),
        startsAt: new Date('2026-05-09T13:00:00.000Z'),
        endsAt: new Date('2026-05-09T14:00:00.000Z'),
        allDay: false,
        assignedAgentId: null,
      },
      {
        applicationId: arquitecturaAppId,
        projectId: proj.id,
        eventType: 'DEADLINE',
        title: seedPrueba('Entrega planos estructurales definitivos'),
        startsAt: new Date('2026-05-28T23:59:00.000Z'),
        allDay: true,
        assignedAgentId: designer?.id ?? null,
      },
    ],
  });

  console.log('   ✅ Calendario arquitectura demo listo');
}
