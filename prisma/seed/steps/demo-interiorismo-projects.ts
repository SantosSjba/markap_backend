import {
  INTERIORISMO_APPLICATION_SLUG,
  SAMPLE_INTERIOR_CORPORATE_CLIENT,
  SAMPLE_INTERIOR_RESIDENTIAL_CLIENT,
  seedPrueba,
} from '../data';
import type { SeedDb } from '../types';
import { seedInteriorismoDemoBudgets } from './demo-interiorismo-budget-seed';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

/**
 * Proyectos demo Interiorismo con presupuestos, materiales, cronograma, documentos, pagos y actividad.
 */
export async function seedInteriorismoProjects(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    console.log('\n⚠️  interiorismo app not found — skipping seed interiorismo projects');
    return;
  }

  const residential = await prisma.client.findFirst({
    where: {
      applicationId: interiorAppId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_INTERIOR_RESIDENTIAL_CLIENT.documentNumber,
      deletedAt: null,
    },
  });
  const corporate = await prisma.client.findFirst({
    where: {
      applicationId: interiorAppId,
      clientType: 'CORPORATE',
      documentNumber: SAMPLE_INTERIOR_CORPORATE_CLIENT.documentNumber,
      deletedAt: null,
    },
  });

  if (!residential || !corporate) {
    console.log('\n⚠️  Interiorismo clients missing — run seed interiorismo clients first');
    return;
  }

  console.log('\n📐 Creating Interiorismo sample agents & projects...');

  let internalAgent = await prisma.agent.findFirst({
    where: { applicationId: interiorAppId, type: 'INTERNAL', userId: adminUser.id },
  });
  if (!internalAgent) {
    internalAgent = await prisma.agent.create({
      data: {
        applicationId: interiorAppId,
        type: 'INTERNAL',
        userId: adminUser.id,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        isActive: true,
      },
    });
    console.log('   ✅ Agente interno interiorismo');
  }

  const designerName = seedPrueba('Elena Rivas Prieto');
  let designer = await prisma.agent.findFirst({
    where: {
      applicationId: interiorAppId,
      type: 'EXTERNAL',
      fullName: designerName,
    },
  });
  if (!designer) {
    designer = await prisma.agent.create({
      data: {
        applicationId: interiorAppId,
        type: 'EXTERNAL',
        fullName: designerName,
        email: 'elena.rivas@studio-diseno.ejemplo.com',
        phone: '987223344',
        isActive: true,
      },
    });
    console.log('   ✅ Diseñadora exterior');
  }

  const architectName = seedPrueba('Marco Luna Quispe');
  let architect = await prisma.agent.findFirst({
    where: {
      applicationId: interiorAppId,
      type: 'EXTERNAL',
      fullName: architectName,
    },
  });
  if (!architect) {
    architect = await prisma.agent.create({
      data: {
        applicationId: interiorAppId,
        type: 'EXTERNAL',
        fullName: architectName,
        email: 'marco.luna@arq-demo.ejemplo.com',
        phone: '987445566',
        isActive: true,
      },
    });
    console.log('   ✅ Arquitecto exterior');
  }

  const supervisorName = seedPrueba('Juliana Costa Vega');
  let supervisor = await prisma.agent.findFirst({
    where: {
      applicationId: interiorAppId,
      type: 'EXTERNAL',
      fullName: supervisorName,
    },
  });
  if (!supervisor) {
    supervisor = await prisma.agent.create({
      data: {
        applicationId: interiorAppId,
        type: 'EXTERNAL',
        fullName: supervisorName,
        email: 'juliana.costa@obra-demo.ejemplo.com',
        phone: '987778899',
        isActive: true,
      },
    });
    console.log('   ✅ Supervisora exterior');
  }

  const commercialName = seedPrueba('Pedro Salinas Méndez');
  let commercial = await prisma.agent.findFirst({
    where: {
      applicationId: interiorAppId,
      type: 'EXTERNAL',
      fullName: commercialName,
    },
  });
  if (!commercial) {
    commercial = await prisma.agent.create({
      data: {
        applicationId: interiorAppId,
        type: 'EXTERNAL',
        fullName: commercialName,
        email: 'pedro.salinas@comercial-demo.ejemplo.com',
        phone: '987990011',
        isActive: true,
      },
    });
    console.log('   ✅ Asesor comercial exterior');
  }

  const codeRemodel = 'INT-REM-LIM-001';
  let projRemodel = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: codeRemodel, deletedAt: null },
  });

  if (!projRemodel) {
    projRemodel = await prisma.interiorProject.create({
      data: {
        applicationId: interiorAppId,
        code: codeRemodel,
        name: seedPrueba('Remodelación integral — Miraflores'),
        clientId: residential.id,
        projectType: 'REMODELING',
        status: 'IN_PROGRESS',
        addressLine: 'Av. Larco 1450, Dpto 402',
        areaSqm: 118,
        levelsCount: 1,
        environmentsNote: 'Living-comedor, cocina abierta, dormitorio principal y baño social.',
        startDate: new Date('2026-03-01'),
        estimatedEndDate: new Date('2026-08-30'),
        designerAgentId: designer.id,
        architectAgentId: architect.id,
        supervisorAgentId: supervisor.id,
        commercialAgentId: commercial.id,
        estimatedBudget: 92000,
        projectedCost: 78500,
        expectedMargin: 14.7,
        progressPct: 42,
        materials: {
          create: [
            {
              name: seedPrueba('Melamina blanca alto brillo'),
              quantity: 42,
              unit: 'm²',
              estimatedCost: 8900,
            },
            {
              name: seedPrueba('Porcelanato 60×120 sala'),
              quantity: 48,
              unit: 'm²',
              estimatedCost: 6200,
            },
          ],
        },
        documents: {
          create: [
            {
              docType: 'PLANO',
              title: seedPrueba('Planta arquitectónica — revisión B'),
              fileUrl: null,
            },
            {
              docType: 'RENDER',
              title: seedPrueba('Render living vista ventanal'),
              fileUrl: null,
            },
          ],
        },
        payments: {
          create: [
            {
              paidAt: new Date('2026-03-05'),
              amount: 15000,
              concept: seedPrueba('Anticipo diseño y supervisión'),
              status: 'PAID',
            },
            {
              paidAt: new Date('2026-04-12'),
              amount: 22000,
              concept: seedPrueba('Segunda cuota mobiliario'),
              status: 'PAID',
            },
          ],
        },
        activities: {
          create: [
            {
              activityType: 'NOTE',
              title: seedPrueba('Kick-off con cliente'),
              description: seedPrueba('Definidos materiales preferentes y ventanas de obra.'),
              occurredAt: new Date('2026-03-02T10:00:00Z'),
            },
            {
              activityType: 'STATUS_CHANGE',
              title: seedPrueba('Estado: Diseño → En ejecución'),
              description: seedPrueba('Planos aprobados por condominio.'),
              occurredAt: new Date('2026-05-18T15:30:00Z'),
            },
          ],
        },
        milestones: {
          create: [
            {
              title: seedPrueba('Demoliciones livianas'),
              plannedDate: new Date('2026-04-01'),
              completedAt: new Date('2026-04-03'),
            },
            {
              title: seedPrueba('Instalación mobiliario cocina'),
              plannedDate: new Date('2026-07-15'),
              completedAt: null,
            },
          ],
        },
      },
    });
    console.log(`   ✅ Proyecto "${projRemodel.name}"`);
  } else {
    console.log('   ✓ Proyecto remodelación demo ya existe');
  }

  const codeCorp = 'INT-DIS-LIM-002';
  let projCorp = await prisma.interiorProject.findFirst({
    where: { applicationId: interiorAppId, code: codeCorp, deletedAt: null },
  });

  if (!projCorp) {
    projCorp = await prisma.interiorProject.create({
      data: {
        applicationId: interiorAppId,
        code: codeCorp,
        name: seedPrueba('Diseño de oficinas corporativas — Sur'),
        clientId: corporate.id,
        projectType: 'INTERIOR_DESIGN',
        status: 'QUOTE',
        addressLine: 'Av. Javier Prado Este 4200, piso 12',
        areaSqm: 340,
        levelsCount: 2,
        environmentsNote: 'Recepción, sala reuniones A/B, open office 40 puestos, café ejecutivo.',
        startDate: new Date('2026-06-01'),
        estimatedEndDate: new Date('2026-11-15'),
        designerAgentId: designer.id,
        architectAgentId: architect.id,
        supervisorAgentId: internalAgent.id,
        commercialAgentId: commercial.id,
        estimatedBudget: 185000,
        projectedCost: 156000,
        expectedMargin: 15.7,
        progressPct: 18,
        materials: {
          create: [
            {
              name: seedPrueba('Piso vinílico instalación flotante'),
              quantity: 280,
              unit: 'm²',
              estimatedCost: 22400,
            },
          ],
        },
        documents: {
          create: [
            {
              docType: 'CONTRATO',
              title: seedPrueba('Borrador contrato marco servicios'),
              fileUrl: null,
            },
          ],
        },
        payments: {
          create: [
            {
              paidAt: new Date('2026-05-28'),
              amount: 28000,
              concept: seedPrueba('Honorarios conceptuales fase 1'),
              status: 'PAID',
            },
          ],
        },
        activities: {
          create: [
            {
              activityType: 'MEETING',
              title: seedPrueba('Presentación moodboard gerencia'),
              description: seedPrueba('Lineamiento materiales nobles y paleta institucional.'),
              occurredAt: new Date('2026-05-22T14:00:00Z'),
            },
          ],
        },
        milestones: {
          create: [
            {
              title: seedPrueba('Entrega anteproyecto revisión RRHH'),
              plannedDate: new Date('2026-06-20'),
              completedAt: null,
            },
          ],
        },
      },
    });
    console.log(`   ✅ Proyecto "${projCorp.name}"`);
  } else {
    console.log('   ✓ Proyecto corporativo demo ya existe');
  }

  await seedInteriorismoDemoBudgets(prisma, projRemodel!.id, projCorp!.id);
}
