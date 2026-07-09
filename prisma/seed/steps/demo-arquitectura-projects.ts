import {
  ARQUITECTURA_APPLICATION_SLUG,
  ARQUITECTURA_DEMO_PROJECT_CODES,
  SAMPLE_ARQUITECTURA_CORPORATE_CLIENT,
  SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT,
  seedPrueba,
} from '../data';
import type { SeedDb } from '../types';
import { seedArquitecturaDemoProjectBudgets } from './demo-arquitectura-project-budget-seed';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

/**
 * Proyectos demo Arquitectura con documentos, pagos, hitos y presupuestos por sección.
 */
export async function seedArquitecturaProjects(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    console.log('\n⚠️  arquitectura app not found — skipping seed arquitectura projects');
    return;
  }

  const residential = await prisma.client.findFirst({
    where: {
      applicationId: arquitecturaAppId,
      clientType: 'RESIDENTIAL',
      documentNumber: SAMPLE_ARQUITECTURA_RESIDENTIAL_CLIENT.documentNumber,
      deletedAt: null,
    },
  });
  const corporate = await prisma.client.findFirst({
    where: {
      applicationId: arquitecturaAppId,
      clientType: 'CORPORATE',
      documentNumber: SAMPLE_ARQUITECTURA_CORPORATE_CLIENT.documentNumber,
      deletedAt: null,
    },
  });

  if (!residential || !corporate) {
    console.log('\n⚠️  Arquitectura clients missing — run seed arquitectura clients first');
    return;
  }

  console.log('\n📐 Creating Arquitectura sample agents & projects...');

  let internalAgent = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'INTERNAL', userId: adminUser.id },
  });
  if (!internalAgent) {
    internalAgent = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'INTERNAL',
        userId: adminUser.id,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        isActive: true,
      },
    });
    console.log('   ✅ Agente interno arquitectura');
  }

  const designerName = seedPrueba('Valeria Soto Paredes');
  let designer = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'EXTERNAL', fullName: designerName },
  });
  if (!designer) {
    designer = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'EXTERNAL',
        fullName: designerName,
        email: 'valeria.soto@estudio-arq-demo.ejemplo.com',
        phone: '987223311',
        isActive: true,
      },
    });
    console.log('   ✅ Diseñadora exterior');
  }

  const architectJrName = seedPrueba('Diego Ríos Montalvo');
  let architectJr = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'EXTERNAL', fullName: architectJrName },
  });
  if (!architectJr) {
    architectJr = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'EXTERNAL',
        fullName: architectJrName,
        email: 'diego.rios@arq-jr-demo.ejemplo.com',
        phone: '987334422',
        isActive: true,
      },
    });
    console.log('   ✅ Arquitecto Jr exterior');
  }

  const architectSrName = seedPrueba('Elena Vargas Quispe');
  let architectSr = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'EXTERNAL', fullName: architectSrName },
  });
  if (!architectSr) {
    architectSr = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'EXTERNAL',
        fullName: architectSrName,
        email: 'elena.vargas@arq-sr-demo.ejemplo.com',
        phone: '987445533',
        isActive: true,
      },
    });
    console.log('   ✅ Arquitecto Sr exterior');
  }

  const supervisorName = seedPrueba('Miguel Ángel Cruz Vega');
  let supervisor = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'EXTERNAL', fullName: supervisorName },
  });
  if (!supervisor) {
    supervisor = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'EXTERNAL',
        fullName: supervisorName,
        email: 'miguel.cruz@obra-demo.ejemplo.com',
        phone: '987556644',
        isActive: true,
      },
    });
    console.log('   ✅ Supervisor de obra exterior');
  }

  const commercialName = seedPrueba('Andrea Flores Méndez');
  let commercial = await prisma.agent.findFirst({
    where: { applicationId: arquitecturaAppId, type: 'EXTERNAL', fullName: commercialName },
  });
  if (!commercial) {
    commercial = await prisma.agent.create({
      data: {
        applicationId: arquitecturaAppId,
        type: 'EXTERNAL',
        fullName: commercialName,
        email: 'andrea.flores@comercial-arq-demo.ejemplo.com',
        phone: '987667755',
        isActive: true,
      },
    });
    console.log('   ✅ Asesora comercial exterior');
  }

  const codeResidential = ARQUITECTURA_DEMO_PROJECT_CODES.residential;
  let projResidential = await prisma.arquitecturaProject.findFirst({
    where: { applicationId: arquitecturaAppId, code: codeResidential, deletedAt: null },
  });

  if (!projResidential) {
    projResidential = await prisma.arquitecturaProject.create({
      data: {
        applicationId: arquitecturaAppId,
        code: codeResidential,
        name: seedPrueba('Vivienda unifamiliar — La Molina'),
        clientId: residential.id,
        projectType: 'RESIDENTIAL',
        status: 'IN_PROGRESS',
        addressLine: 'Calle Los Sauces 245, Urb. La Molina Vieja',
        city: 'Lima',
        interventionLevel: 'II',
        executionTimeNote: '120 DÍAS HÁBILES',
        areaSqm: 220,
        levelsCount: 2,
        environmentsNote: 'Sala, comedor, cocina, 3 dormitorios, 2.5 baños, terraza y cochera.',
        startDate: new Date('2026-02-15'),
        estimatedEndDate: new Date('2026-10-30'),
        designerAgentId: designer.id,
        architectJrAgentId: architectJr.id,
        architectSrAgentId: architectSr.id,
        supervisorAgentId: supervisor.id,
        commercialAgentId: commercial.id,
        estimatedBudget: 385000,
        projectedCost: 328000,
        expectedMargin: 14.8,
        progressPct: 38,
        documents: {
          create: [
            {
              docType: 'PLANO',
              title: seedPrueba('Planta arquitectónica — revisión C'),
              fileUrl: null,
            },
            {
              docType: 'MEMORIA',
              title: seedPrueba('Memoria descriptiva estructural'),
              fileUrl: null,
            },
          ],
        },
        payments: {
          create: [
            {
              paidAt: new Date('2026-02-20'),
              amount: 45000,
              concept: seedPrueba('Anticipo anteproyecto y expediente'),
              paymentType: 'ABONO',
              status: 'PAID',
            },
            {
              paidAt: new Date('2026-04-10'),
              amount: 62000,
              concept: seedPrueba('Cuota inicio de obra'),
              paymentType: 'ABONO',
              status: 'PAID',
            },
          ],
        },
        milestones: {
          create: [
            {
              title: seedPrueba('Excavación y cimentación'),
              plannedDate: new Date('2026-03-15'),
              completedAt: new Date('2026-03-18'),
            },
            {
              title: seedPrueba('Estructura primer nivel'),
              plannedDate: new Date('2026-06-01'),
              completedAt: null,
            },
          ],
        },
      },
    });
    console.log(`   ✅ Proyecto "${projResidential.name}"`);
  } else {
    console.log('   ✓ Proyecto residencial demo ya existe');
  }

  const codeCommercial = ARQUITECTURA_DEMO_PROJECT_CODES.commercial;
  let projCommercial = await prisma.arquitecturaProject.findFirst({
    where: { applicationId: arquitecturaAppId, code: codeCommercial, deletedAt: null },
  });

  if (!projCommercial) {
    projCommercial = await prisma.arquitecturaProject.create({
      data: {
        applicationId: arquitecturaAppId,
        code: codeCommercial,
        name: seedPrueba('Ampliación ambulatorio — San Isidro'),
        clientId: corporate.id,
        projectType: 'INSTITUTIONAL',
        status: 'QUOTE',
        addressLine: 'Av. República de Panamá 3520',
        city: 'Lima',
        interventionLevel: 'I',
        areaSqm: 480,
        levelsCount: 1,
        environmentsNote: '6 consultorios, sala de espera, recepción y baños accesibles.',
        startDate: new Date('2026-07-01'),
        estimatedEndDate: new Date('2026-12-15'),
        designerAgentId: designer.id,
        architectJrAgentId: architectJr.id,
        architectSrAgentId: architectSr.id,
        supervisorAgentId: internalAgent.id,
        commercialAgentId: commercial.id,
        estimatedBudget: 520000,
        projectedCost: 445000,
        expectedMargin: 14.4,
        progressPct: 12,
        documents: {
          create: [
            {
              docType: 'CONTRATO',
              title: seedPrueba('Borrador contrato de servicios profesionales'),
              fileUrl: null,
            },
          ],
        },
        payments: {
          create: [
            {
              paidAt: new Date('2026-06-05'),
              amount: 35000,
              concept: seedPrueba('Honorarios fase anteproyecto'),
              paymentType: 'ABONO',
              status: 'PAID',
            },
          ],
        },
        milestones: {
          create: [
            {
              title: seedPrueba('Entrega cotización definitiva'),
              plannedDate: new Date('2026-07-10'),
              completedAt: null,
            },
          ],
        },
      },
    });
    console.log(`   ✅ Proyecto "${projCommercial.name}"`);
  } else {
    console.log('   ✓ Proyecto institucional demo ya existe');
  }

  await seedArquitecturaDemoProjectBudgets(prisma, projResidential!.id, projCommercial!.id);

  const projectCount = await prisma.arquitecturaProject.count({ where: { applicationId: arquitecturaAppId } });
  await prisma.arquitecturaNumberingSeries.updateMany({
    where: { applicationId: arquitecturaAppId, seriesKey: 'ARQUITECTURA_PROJECT' },
    data: { lastNumber: projectCount },
  });
}
