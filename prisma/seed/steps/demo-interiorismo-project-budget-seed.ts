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

const REMODEL_SECTIONS: DemoSection[] = [
  {
    sortOrder: 0,
    name: 'Cocina integrada',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Mobiliario melamina: Módulos inferiores y superiores alto brillo',
        budgetedCost: 14 * 385,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description: 'Mobiliario melamina: Cubiertas cuarzo sintético instaladas',
        budgetedCost: 6.2 * 420,
        hasIgv: true,
      },
    ],
  },
  {
    sortOrder: 1,
    name: 'Living',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Iluminación: Riel magneto LED empotrado',
        budgetedCost: 11 * 165,
        hasIgv: true,
      },
    ],
  },
  {
    sortOrder: 2,
    name: 'Baño social',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Acabados: Porcelanato formato grande muros',
        budgetedCost: 22 * 95,
        hasIgv: true,
      },
    ],
  },
];

const CORP_SECTIONS: DemoSection[] = [
  {
    sortOrder: 0,
    name: 'Open office',
    lineItems: [
      {
        sortOrder: 0,
        description: 'Workstations: Estaciones ergonómicas dobles con pantalla',
        budgetedCost: 40 * 1850,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description: 'Workstations: Casilleros personales melamina',
        budgetedCost: 40 * 280,
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
  const existing = await prisma.interiorProjectSection.count({ where: { projectId } });
  if (existing > 0) return;

  for (const section of sections) {
    const created = await prisma.interiorProjectSection.create({
      data: {
        projectId,
        name: seedPrueba(section.name),
        sortOrder: section.sortOrder,
      },
    });
    for (const item of section.lineItems) {
      await prisma.interiorProjectLineItem.create({
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

export async function seedInteriorismoDemoProjectBudgets(
  prisma: SeedDb,
  remodelProjectId: string,
  corpProjectId: string,
): Promise<void> {
  await seedProjectSections(prisma, remodelProjectId, REMODEL_SECTIONS);
  await seedProjectSections(prisma, corpProjectId, CORP_SECTIONS);
  console.log('   ✅ Presupuestos por proyecto demo interiorismo');
}
