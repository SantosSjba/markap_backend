import { INTERIORISMO_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

const DEMO_PROJECT_CODE = 'INT-REM-LIM-001';

/**
 * Eventos de agenda demo (reuniones, visitas, equipo).
 */
export async function seedInteriorismoCalendar(prisma: SeedDb, appIdBySlug: Record<string, string>): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    console.log('\n⚠️  interiorismo app not found — skipping calendar seed');
    return;
  }

  const proj = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: DEMO_PROJECT_CODE, deletedAt: null },
  });
  if (!proj) {
    console.log('\n⚠️  Proyecto demo no encontrado — omitiendo calendario');
    return;
  }

  const n = await prisma.interiorCalendarEvent.count({
    where: { applicationId: interiorAppId },
  });
  if (n > 0) {
    console.log('\n📅 Calendario demo ya tiene eventos — omitiendo');
    return;
  }

  console.log('\n📅 Sembrando eventos de calendario…');

  const designer = proj.designerAgentId
    ? await prisma.agent.findFirst({ where: { id: proj.designerAgentId }, select: { id: true } })
    : null;

  await prisma.interiorCalendarEvent.createMany({
    data: [
      {
        applicationId: interiorAppId,
        projectId: proj.id,
        eventType: 'MEETING',
        title: seedPrueba('Reunión cliente — avance mobiliario cocina'),
        description: seedPrueba('Presencial + revisión muestras'),
        location: 'Oficina / obra según confirme cliente',
        startsAt: new Date('2026-05-12T16:00:00.000Z'),
        endsAt: new Date('2026-05-12T17:30:00.000Z'),
        allDay: false,
        assignedAgentId: designer?.id ?? null,
      },
      {
        applicationId: interiorAppId,
        projectId: proj.id,
        eventType: 'VISIT',
        title: seedPrueba('Visita taller — estado muebles dormitorio'),
        location: 'Taller proveedor',
        startsAt: new Date('2026-05-18T14:00:00.000Z'),
        endsAt: new Date('2026-05-18T15:30:00.000Z'),
        allDay: false,
        assignedAgentId: designer?.id ?? null,
      },
      {
        applicationId: interiorAppId,
        projectId: proj.id,
        eventType: 'INSTALLATION',
        title: seedPrueba('Instalación luminarias y ripados — primer día'),
        startsAt: new Date('2026-06-03T13:00:00.000Z'),
        endsAt: new Date('2026-06-03T18:00:00.000Z'),
        allDay: false,
        assignedAgentId: proj.supervisorAgentId ?? null,
      },
      {
        applicationId: interiorAppId,
        projectId: null,
        eventType: 'TEAM_BLOCK',
        title: seedPrueba('Bloque equipo — planificación semanal interiorismo'),
        description: seedPrueba('Sin proyecto asignado: coordinación interna'),
        startsAt: new Date('2026-05-09T13:00:00.000Z'),
        endsAt: new Date('2026-05-09T14:00:00.000Z'),
        allDay: false,
        assignedAgentId: null,
      },
      {
        applicationId: interiorAppId,
        projectId: proj.id,
        eventType: 'DEADLINE',
        title: seedPrueba('Entrega renders finales área social'),
        startsAt: new Date('2026-05-25T23:59:00.000Z'),
        allDay: true,
        assignedAgentId: designer?.id ?? null,
      },
    ],
  });

  console.log('   ✅ Calendario demo listo');
}
