import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-produccion-purchases');

/**
 * Proveedores demo, vínculos con materiales y una OC de ejemplo.
 */
export async function seedProduccionPurchases(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    logger.info(
      { event: 'seed.progress' },
      '\n⚠️  produccion app not found — skipping purchases seed',
    );
    return;
  }

  const supplierCount = await prisma.produccionSupplier.count({
    where: { applicationId: appId },
  });
  if (supplierCount > 0) {
    logger.info(
      { event: 'seed.progress' },
      '\n🛒 Compras producción ya sembradas — omitiendo',
    );
    return;
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🛒 Creando proveedores y OC demo…',
  );

  const tableros = await prisma.produccionSupplier.create({
    data: {
      applicationId: appId,
      companyName: seedPrueba('Maderas del Norte SAC'),
      ruc: '20123456789',
      contactName: seedPrueba('Luis Mendoza'),
      phone: '999 111 222',
      email: 'ventas@maderasdelnorte.demo',
      isActive: true,
      notes: 'Proveedor principal de tableros',
    },
  });

  const herrajes = await prisma.produccionSupplier.create({
    data: {
      applicationId: appId,
      companyName: seedPrueba('Herrajes Pro Lima EIRL'),
      ruc: '20987654321',
      contactName: seedPrueba('Ana Torres'),
      phone: '988 333 444',
      email: 'pedidos@herrajespro.demo',
      isActive: true,
    },
  });

  const melamina = await prisma.produccionMaterial.findFirst({
    where: { applicationId: appId, code: 'MAT-MEL-18' },
  });
  const tirador = await prisma.produccionMaterial.findFirst({
    where: { applicationId: appId, code: 'MAT-TIR-96' },
  });

  if (melamina) {
    await prisma.produccionSupplierMaterialLink.create({
      data: {
        supplierId: tableros.id,
        materialId: melamina.id,
        supplierSku: 'MEL-BLA-18',
      },
    });
  }
  if (tirador) {
    await prisma.produccionSupplierMaterialLink.create({
      data: {
        supplierId: herrajes.id,
        materialId: tirador.id,
        supplierSku: 'TIR-CR-96',
      },
    });
  }

  if (melamina && tirador) {
    const order = await prisma.produccionPurchaseOrder.create({
      data: {
        applicationId: appId,
        supplierId: tableros.id,
        code: `OC-${new Date().getFullYear()}-0001`,
        status: 'SENT',
        orderedAt: new Date(),
        expectedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Reposición mensual de tableros',
        lines: {
          create: [
            {
              materialId: melamina.id,
              quantityOrdered: new Prisma.Decimal('10'),
              quantityReceived: new Prisma.Decimal(0),
              unitPrice: new Prisma.Decimal('315'),
            },
          ],
        },
      },
    });

    await prisma.produccionPurchaseOrder.create({
      data: {
        applicationId: appId,
        supplierId: herrajes.id,
        code: `OC-${new Date().getFullYear()}-0002`,
        status: 'DRAFT',
        orderedAt: new Date(),
        notes: 'Borrador — tiradores y bisagras',
        lines: {
          create: [
            {
              materialId: tirador.id,
              quantityOrdered: new Prisma.Decimal('200'),
              quantityReceived: new Prisma.Decimal(0),
              unitPrice: new Prisma.Decimal('8.2'),
            },
          ],
        },
      },
    });

    logger.info(
      { event: 'seed.progress' },
      `   ✅ 2 proveedores, vínculos y OC demo (${order.code} enviada)`,
    );
  } else {
    logger.info(
      { event: 'seed.progress' },
      '   ✅ 2 proveedores demo (sin materiales para OC)',
    );
  }
}
