import { seedInteriorBudget } from './interiorismo-budget-seed.helper';
import { seedPrueba } from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger(
  'Script:demo-interiorismo-project-budget-seed',
);

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
        description:
          'Mobiliario melamina: Módulos inferiores y superiores alto brillo',
        budgetedCost: 14 * 385,
        hasIgv: true,
      },
      {
        sortOrder: 1,
        description:
          'Mobiliario melamina: Cubiertas cuarzo sintético instaladas',
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

function seedProjectSections(
  prisma: SeedDb,
  projectId: string,
  sections: DemoSection[],
) {
  return seedInteriorBudget(
    prisma,
    projectId,
    sections.map((section) => ({
      name: seedPrueba(section.name),
      items: section.lineItems.map((item) => ({
        description: seedPrueba(item.description),
        directCost: item.budgetedCost,
        hasIgv: item.hasIgv ?? true,
      })),
    })),
  );
}

export async function seedInteriorismoDemoProjectBudgets(
  prisma: SeedDb,
  remodelProjectId: string,
  corpProjectId: string,
): Promise<void> {
  await seedProjectSections(prisma, remodelProjectId, REMODEL_SECTIONS);
  await seedProjectSections(prisma, corpProjectId, CORP_SECTIONS);
  logger.info(
    { event: 'seed.progress' },
    '   ✅ Presupuestos por proyecto demo interiorismo',
  );
}
