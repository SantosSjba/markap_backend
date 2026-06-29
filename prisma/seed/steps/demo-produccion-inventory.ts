import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Materiales de inventario demo y movimientos iniciales de kardex.
 */
export async function seedProduccionInventory(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  produccion app not found — skipping inventory seed');
    return;
  }

  const count = await prisma.produccionMaterial.count({ where: { applicationId: appId } });
  if (count > 0) {
    console.log('\n📦 Inventario producción ya tiene materiales — omitiendo seed');
    return;
  }

  console.log('\n📦 Creando materiales de inventario demo…');

  const materials = [
    {
      code: 'MAT-MEL-18',
      name: seedPrueba('Melamina blanca 18mm'),
      category: 'Tableros',
      unit: 'plancha',
      unitCost: '320',
      minStockQty: '5',
      initialStock: '12',
    },
    {
      code: 'MAT-TIR-96',
      name: seedPrueba('Tirador cromado 96mm'),
      category: 'Herrajes',
      unit: 'und',
      unitCost: '8.5',
      minStockQty: '50',
      initialStock: '120',
    },
    {
      code: 'MAT-COL-PVA',
      name: seedPrueba('Cola blanca PVA 1kg'),
      category: 'Adhesivos',
      unit: 'kg',
      unitCost: '18',
      minStockQty: '10',
      initialStock: '8',
    },
    {
      code: 'MAT-LIJ-120',
      name: seedPrueba('Lija al agua #120'),
      category: 'Acabados',
      unit: 'hoja',
      unitCost: '2.5',
      minStockQty: '30',
      initialStock: '45',
    },
    {
      code: 'MAT-BARN-1L',
      name: seedPrueba('Barniz poliuretano 1L'),
      category: 'Acabados',
      unit: 'lt',
      unitCost: '65',
      minStockQty: '4',
      initialStock: '3',
    },
  ];

  for (const m of materials) {
    const mat = await prisma.produccionMaterial.create({
      data: {
        applicationId: appId,
        code: m.code,
        name: m.name,
        category: m.category,
        unit: m.unit,
        unitCost: new Prisma.Decimal(m.unitCost),
        minStockQty: new Prisma.Decimal(m.minStockQty),
        currentStock: new Prisma.Decimal(m.initialStock),
        isActive: true,
      },
    });

    await prisma.produccionStockMovement.create({
      data: {
        materialId: mat.id,
        movementType: 'IN',
        quantity: new Prisma.Decimal(m.initialStock),
        balanceAfter: new Prisma.Decimal(m.initialStock),
        unitCost: new Prisma.Decimal(m.unitCost),
        reference: 'Stock inicial demo',
        notes: 'Carga inicial de inventario',
      },
    });
  }

  console.log(`   ✅ ${materials.length} materiales demo con movimiento inicial`);
}
