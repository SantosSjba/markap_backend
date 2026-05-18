import { Prisma } from '@prisma/client';
import { computeInteriorBudgetLine } from '../../../src/domain/interior-budget/interior-budget-calculations';
import { seedPrueba } from '../data';
import type { SeedDb } from '../types';
import type { InteriorBudgetLevelInput } from '../../../src/domain/repositories/interior-budget.repository';

interface BudgetSpec {
  code: string;
  version?: number;
  title: string | null;
  status: string;
  defaultIgvPct?: number;
  levels: InteriorBudgetLevelInput[];
}

function levelsToNestedCreate(levels: InteriorBudgetLevelInput[], defaultIgvPct: number): {
  create: Prisma.InteriorBudgetLevelCreateWithoutBudgetInput[];
  taxableTotal: Prisma.Decimal;
  igvTotal: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
} {
  let taxableTotal = new Prisma.Decimal(0);
  let igvTotal = new Prisma.Decimal(0);
  let grandTotal = new Prisma.Decimal(0);

  const create = levels.map((lvl) => ({
    sortOrder: lvl.sortOrder,
    name: lvl.name.trim(),
    environments: {
      create: lvl.environments.map((env) => ({
        sortOrder: env.sortOrder,
        name: env.name.trim(),
        categories: {
          create: env.categories.map((cat) => ({
            sortOrder: cat.sortOrder,
            name: cat.name.trim(),
            items: {
              create: cat.items.map((it) => {
                const igvPct = it.igvPct ?? defaultIgvPct;
                const z = computeInteriorBudgetLine(
                  it.quantity,
                  it.unitPrice,
                  it.utilityPct,
                  igvPct,
                );
                taxableTotal = taxableTotal.add(z.amountBeforeIgv);
                igvTotal = igvTotal.add(z.igvAmount);
                grandTotal = grandTotal.add(z.lineTotal);
                return {
                  sortOrder: it.sortOrder,
                  description: it.description.trim(),
                  unit: it.unit.trim(),
                  quantity: z.quantity,
                  unitPrice: z.unitPrice,
                  utilityPct: new Prisma.Decimal(it.utilityPct),
                  igvPct: new Prisma.Decimal(igvPct),
                  baseAmount: z.baseAmount,
                  utilityAmount: z.utilityAmount,
                  amountBeforeIgv: z.amountBeforeIgv,
                  igvAmount: z.igvAmount,
                  lineTotal: z.lineTotal,
                };
              }),
            },
          })),
        },
      })),
    },
  }));

  return { create, taxableTotal, igvTotal, grandTotal };
}

async function upsertBudget(prisma: SeedDb, projectId: string, spec: BudgetSpec): Promise<void> {
  const version = spec.version ?? 1;
  const exists = await prisma.interiorBudget.findFirst({
    where: { projectId, code: spec.code, version },
  });
  if (exists) return;

  const defaultIgv = spec.defaultIgvPct ?? 18;
  const built = levelsToNestedCreate(spec.levels, defaultIgv);

  await prisma.interiorBudget.create({
    data: {
      projectId,
      code: spec.code.trim(),
      version,
      status: spec.status,
      title: spec.title,
      defaultIgvPct: new Prisma.Decimal(defaultIgv),
      taxableTotal: built.taxableTotal,
      igvTotal: built.igvTotal,
      grandTotal: built.grandTotal,
      history: {
        create: {
          eventType: 'CREATED',
          summary: `Presupuesto ${spec.code.trim()} v${version}`,
        },
      },
      levels: { create: built.create },
    },
  });
}

const REMODEL_PRE001_LEVELS: InteriorBudgetLevelInput[] = [
  {
    sortOrder: 0,
    name: 'Primer piso',
    environments: [
      {
        sortOrder: 0,
        name: 'Cocina integrada',
        categories: [
          {
            sortOrder: 0,
            name: 'Mobiliario melamina',
            items: [
              {
                sortOrder: 0,
                description: 'Módulos inferiores y superiores alto brillo',
                unit: 'und',
                quantity: 14,
                unitPrice: 385,
                utilityPct: 10,
                igvPct: 18,
              },
              {
                sortOrder: 1,
                description: 'Cubiertas cuarzo sintético instaladas',
                unit: 'ml',
                quantity: 6.2,
                unitPrice: 420,
                utilityPct: 12,
                igvPct: 18,
              },
            ],
          },
        ],
      },
      {
        sortOrder: 1,
        name: 'Living',
        categories: [
          {
            sortOrder: 0,
            name: 'Iluminación',
            items: [
              {
                sortOrder: 0,
                description: 'Riel magneto LED empotrado',
                unit: 'ml',
                quantity: 11,
                unitPrice: 165,
                utilityPct: 15,
                igvPct: 18,
              },
            ],
          },
        ],
      },
    ],
  },
];

const REMODEL_PRE002_LEVELS: InteriorBudgetLevelInput[] = [
  {
    sortOrder: 0,
    name: 'Único nivel',
    environments: [
      {
        sortOrder: 0,
        name: 'Baño social',
        categories: [
          {
            sortOrder: 0,
            name: 'Acabados',
            items: [
              {
                sortOrder: 0,
                description: 'Porcelanato formato grande muros',
                unit: 'm²',
                quantity: 22,
                unitPrice: 95,
                utilityPct: 8,
                igvPct: 18,
              },
            ],
          },
        ],
      },
    ],
  },
];

const CORP_PRE_LEVELS: InteriorBudgetLevelInput[] = [
  {
    sortOrder: 0,
    name: 'Piso 12',
    environments: [
      {
        sortOrder: 0,
        name: 'Open office',
        categories: [
          {
            sortOrder: 0,
            name: 'Workstations',
            items: [
              {
                sortOrder: 0,
                description: 'Estaciones ergonómicas dobles con pantalla',
                unit: 'puesto',
                quantity: 40,
                unitPrice: 1850,
                utilityPct: 11,
                igvPct: 18,
              },
              {
                sortOrder: 1,
                description: 'Casilleros personales melamina',
                unit: 'und',
                quantity: 40,
                unitPrice: 280,
                utilityPct: 9,
                igvPct: 18,
              },
            ],
          },
        ],
      },
    ],
  },
];

export async function seedInteriorismoDemoBudgets(
  prisma: SeedDb,
  remodelProjectId: string,
  corpProjectId: string,
): Promise<void> {
  await upsertBudget(prisma, remodelProjectId, {
    code: 'PRE-001',
    title: seedPrueba('Mobiliario fijo cocina y closets'),
    status: 'APPROVED',
    defaultIgvPct: 18,
    levels: REMODEL_PRE001_LEVELS,
  });

  await upsertBudget(prisma, remodelProjectId, {
    code: 'PRE-002',
    title: seedPrueba('Iluminación y acabados'),
    status: 'SENT',
    defaultIgvPct: 18,
    levels: REMODEL_PRE002_LEVELS,
  });

  await upsertBudget(prisma, corpProjectId, {
    code: 'PRE-C01',
    title: seedPrueba('Propuesta mobiliario workstations'),
    status: 'DRAFT',
    defaultIgvPct: 18,
    levels: CORP_PRE_LEVELS,
  });

  console.log('   ✅ Presupuestos jerárquicos demo interiorismo');
}
