/**
 * Migra presupuestos legacy (InteriorBudget 4 niveles) al modelo por proyecto
 * (InteriorProjectSection + InteriorProjectLineItem).
 *
 * Uso: pnpm run prisma:migrate:interior-budgets
 */
import { PrismaClient } from '@prisma/client';
import { computeLineItemPricing } from '../../src/domain/interior-project-budget/interior-project-budget-calculations';
import { getProjectBudgetPriceTotal } from '../../src/infrastructure/database/prisma/helpers/project-budget-query.helper';

const prisma = new PrismaClient();

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sectionName(levelName: string, envName: string, levelCount: number, envCount: number): string {
  if (levelCount === 1 && envCount === 1) return levelName.trim() || envName.trim();
  if (envCount === 1) return levelName.trim();
  if (levelName.trim().toLowerCase() === envName.trim().toLowerCase()) return levelName.trim();
  return `${levelName.trim()} — ${envName.trim()}`;
}

function lineDescription(categoryName: string, itemDescription: string): string {
  const cat = categoryName.trim();
  const desc = itemDescription.trim();
  if (!cat || cat.toLowerCase() === 'general' || cat === desc) return desc;
  return `${cat}: ${desc}`;
}

async function migrateProjectBudgets(projectId: string): Promise<{
  migrated: number;
  skipped: number;
  lineItems: number;
}> {
  const existingSections = await prisma.interiorProjectSection.count({ where: { projectId } });
  if (existingSections > 0) {
    return { migrated: 0, skipped: 1, lineItems: 0 };
  }

  const budgets = await (prisma as any).interiorBudget.findMany({
    where: { projectId },
    orderBy: [{ version: 'desc' }],
    include: {
      levels: {
        orderBy: { sortOrder: 'asc' },
        include: {
          environments: {
            orderBy: { sortOrder: 'asc' },
            include: {
              categories: {
                orderBy: { sortOrder: 'asc' },
                include: { items: { orderBy: { sortOrder: 'asc' } } },
              },
            },
          },
        },
      },
    },
  });

  if (!budgets.length) return { migrated: 0, skipped: 0, lineItems: 0 };

  const approved = budgets.find((b) => b.status === 'APPROVED');
  const selected = approved ?? budgets[0];
  const project = await prisma.interiorProject.findUnique({ where: { id: projectId } });
  if (!project) return { migrated: 0, skipped: 1, lineItems: 0 };

  const utilityPct = num(project.defaultUtilityPct) || 20;
  const igvPct = num(project.defaultIgvPct) || num(selected.defaultIgvPct) || 18;

  let sectionOrder = 0;
  let lineItems = 0;

  for (const budget of budgets) {
    for (const level of budget.levels) {
      const levelCount = budget.levels.length;
      for (const env of level.environments) {
        const section = await prisma.interiorProjectSection.create({
          data: {
            projectId,
            name: sectionName(level.name, env.name, levelCount, level.environments.length),
            sortOrder: sectionOrder++,
          },
        });

        let itemOrder = 0;
        for (const category of env.categories) {
          for (const item of category.items) {
            const budgetedCost = Math.round(num(item.quantity) * num(item.unitPrice) * 100) / 100;
            await prisma.interiorProjectLineItem.create({
              data: {
                sectionId: section.id,
                sortOrder: itemOrder++,
                description: lineDescription(category.name, item.description),
                budgetedCost,
                hasIgv: num(item.igvPct) > 0,
              },
            });
            lineItems++;
          }
        }
      }
    }
  }

  await prisma.interiorProject.update({
    where: { id: projectId },
    data: {
      defaultIgvPct: igvPct,
      defaultUtilityPct: utilityPct,
    },
  });

  return { migrated: 1, skipped: 0, lineItems };
}

async function main() {
  console.log('\n🔄 Migrando InteriorBudget → presupuesto por proyecto...\n');

  const projects = await prisma.interiorProject.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true, defaultUtilityPct: true },
  });

  let migratedProjects = 0;
  let skippedProjects = 0;
  let totalLineItems = 0;
  let legacyGrandBefore = 0;
  let newGrandAfter = 0;

  for (const project of projects) {
    const legacyCount = await (prisma as any).interiorBudget.count({ where: { projectId: project.id } });
    if (!legacyCount) continue;

    const ref = await (prisma as any).interiorBudget.findFirst({
      where: { projectId: project.id, status: 'APPROVED' },
      orderBy: { version: 'desc' },
      select: { grandTotal: true },
    });
    const refFallback = await (prisma as any).interiorBudget.findFirst({
      where: { projectId: project.id },
      orderBy: { version: 'desc' },
      select: { grandTotal: true },
    });
    legacyGrandBefore += num((ref ?? refFallback)?.grandTotal);

    const result = await migrateProjectBudgets(project.id);
    if (result.migrated) {
      migratedProjects++;
      totalLineItems += result.lineItems;
      newGrandAfter += await getProjectBudgetPriceTotal(prisma, project.id);
      console.log(`   ✅ ${project.code} — ${result.lineItems} partidas`);
    } else if (result.skipped) {
      skippedProjects++;
      console.log(`   ⏭️  ${project.code} — ya tiene secciones`);
    }
  }

  console.log('\n📊 Resumen');
  console.log(`   Proyectos migrados: ${migratedProjects}`);
  console.log(`   Proyectos omitidos: ${skippedProjects}`);
  console.log(`   Partidas creadas:   ${totalLineItems}`);
  console.log(`   Total legacy (ref): S/ ${legacyGrandBefore.toFixed(2)}`);
  console.log(`   Total nuevo modelo: S/ ${newGrandAfter.toFixed(2)}`);
  console.log('\n✅ Migración completada.\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
