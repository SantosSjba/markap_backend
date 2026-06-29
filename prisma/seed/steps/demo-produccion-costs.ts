import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Tarifas MO, catálogo de gastos y costos demo en muebles existentes.
 */
export async function seedProduccionCosts(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  produccion app not found — skipping costs seed');
    return;
  }

  const laborCount = await prisma.produccionLaborRate.count({ where: { applicationId: appId } });
  if (laborCount === 0) {
    console.log('\n💰 Creando tarifas de mano de obra demo…');
    const rates = [
      { name: seedPrueba('Operario corte'), stage: 'Corte', hourlyRate: '28' },
      { name: seedPrueba('Ensamblador'), stage: 'Ensamble', hourlyRate: '32' },
      { name: seedPrueba('Acabados y barnizado'), stage: 'Acabados', hourlyRate: '35' },
      { name: seedPrueba('Supervisor taller'), stage: 'General', hourlyRate: '45' },
    ];
    for (const r of rates) {
      await prisma.produccionLaborRate.create({
        data: {
          applicationId: appId,
          name: r.name,
          stage: r.stage,
          hourlyRate: new Prisma.Decimal(r.hourlyRate),
          isActive: true,
        },
      });
    }
    console.log(`   ✅ ${rates.length} tarifas MO demo`);
  }

  const extraCount = await prisma.produccionExtraCostCatalog.count({
    where: { applicationId: appId },
  });
  if (extraCount === 0) {
    console.log('\n💰 Creando catálogo de gastos adicionales demo…');
    const extras = [
      { name: seedPrueba('Transporte local'), defaultAmount: '120', description: 'Entrega en Lima metropolitana' },
      { name: seedPrueba('Embalaje y protección'), defaultAmount: '85', description: 'Film, cartón y esquineros' },
      { name: seedPrueba('Instalación en sitio'), defaultAmount: '250', description: 'Mano de obra en domicilio del cliente' },
    ];
    for (const e of extras) {
      await prisma.produccionExtraCostCatalog.create({
        data: {
          applicationId: appId,
          name: e.name,
          defaultAmount: new Prisma.Decimal(e.defaultAmount),
          description: e.description,
          isActive: true,
        },
      });
    }
    console.log(`   ✅ ${extras.length} tipos de gasto demo`);
  }

  const mesa = await prisma.produccionFurniture.findFirst({
    where: { applicationId: appId, code: 'MUE-COM-001' },
    include: { bomLines: true, laborEntries: true, extraExpenses: true },
  });
  if (mesa && mesa.bomLines.length > 0) {
    const unitCosts = ['320', '95', '45'];
    for (let i = 0; i < mesa.bomLines.length && i < unitCosts.length; i++) {
      await prisma.produccionFurnitureBomLine.update({
        where: { id: mesa.bomLines[i].id },
        data: { unitCost: new Prisma.Decimal(unitCosts[i]) },
      });
    }
  }

  if (mesa && mesa.laborEntries.length === 0) {
    const ensamble = await prisma.produccionLaborRate.findFirst({
      where: { applicationId: appId, stage: 'Ensamble' },
    });
    if (ensamble) {
      await prisma.produccionFurnitureLaborEntry.create({
        data: {
          furnitureId: mesa.id,
          laborRateId: ensamble.id,
          description: ensamble.name,
          hours: new Prisma.Decimal('12'),
          hourlyRate: ensamble.hourlyRate,
          sortOrder: 0,
        },
      });
    }

    const transporte = await prisma.produccionExtraCostCatalog.findFirst({
      where: { applicationId: appId, name: { contains: 'Transporte', mode: 'insensitive' } },
    });
    if (transporte) {
      await prisma.produccionFurnitureExtraExpense.create({
        data: {
          furnitureId: mesa.id,
          catalogItemId: transporte.id,
          description: transporte.name,
          amount: transporte.defaultAmount,
          sortOrder: 0,
        },
      });
    }
    console.log('   ✅ Costeo demo aplicado a MUE-COM-001');
  }
}
