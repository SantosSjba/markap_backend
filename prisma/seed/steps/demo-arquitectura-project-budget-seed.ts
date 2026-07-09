import { Prisma } from '@prisma/client';
import { seedPrueba } from '../data';
import type { SeedDb } from '../types';

type DemoLineItem = {
  sortOrder: number;
  description: string;
  budgetedCost: number;
  hasIgv?: boolean;
};

type DemoSection = {
  sortOrder: number;
  name: string;
  lineItems: DemoLineItem[];
};

const RESIDENTIAL_SECTIONS: DemoSection[] = [
  {
    sortOrder: 0,
    name: 'Estructura y cimentación',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Excavación, zapatas y sobrecimiento — vivienda 2 niveles',
        budgetedCost: 1 * 28500,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description: 'Columnas y vigas de concreto armado — planta baja',
        budgetedCost: 1 * 34200,
        hasIgv: true,
      },
    ],
  },
  {
    sortOrder: 1,
    name: 'Albañilería y cubiertas',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Muros confinados ladrillo King Kong 18',
        budgetedCost: 420 * 38,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description: 'Cubierta plana impermeabilizada + parapetos',
        budgetedCost: 1 * 12800,
        hasIgv: true,
      },
    ],
  },
  {
    sortOrder: 2,
    name: 'Instalaciones',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Instalación eléctrica BT — tablero y circuitos',
        budgetedCost: 1 * 15600,
        hasIgv: true,
      },
    ],
  },
];

const COMMERCIAL_SECTIONS: DemoSection[] = [
  {
    sortOrder: 0,
    name: 'Ampliación ambulatorio',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Mampostería y tabiquería drywall — 6 consultorios',
        budgetedCost: 280 * 95,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description: 'Pisos vinílico sanitario — área atención',
        budgetedCost: 185 * 72,
        hasIgv: true,
      },
    ],
  },
];

async function seedProjectSections(
  prisma: SeedDb,
  projectId: string,
  sections: DemoSection[],
): Promise<void> {
  const existing = await prisma.arquitecturaProjectSection.count({ where: { projectId } });
  if (existing > 0) return;

  for (const section of sections) {
    const created = await prisma.arquitecturaProjectSection.create({
      data: {
        projectId,
        name: seedPrueba(section.name),
        sortOrder: section.sortOrder,
      },
    });
    for (const item of section.lineItems) {
      await prisma.arquitecturaProjectLineItem.create({
        data: {
          sectionId: created.id,
          sortOrder: item.sortOrder,
          description: seedPrueba(item.description),
          budgetedCost: new Prisma.Decimal(item.budgetedCost),
          hasIgv: item.hasIgv ?? true,
        },
      });
    }
  }
}

export async function seedArquitecturaDemoProjectBudgets(
  prisma: SeedDb,
  residentialProjectId: string,
  commercialProjectId: string,
): Promise<void> {
  await seedProjectSections(prisma, residentialProjectId, RESIDENTIAL_SECTIONS);
  await seedProjectSections(prisma, commercialProjectId, COMMERCIAL_SECTIONS);
  console.log('   ✅ Presupuestos por proyecto demo arquitectura');
}
