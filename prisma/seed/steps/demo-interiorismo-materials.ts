import { Prisma } from '@prisma/client';
import { INTERIORISMO_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Catálogo de materiales, proveedores, vínculos e historial de compras (Interiorismo).
 */
export async function seedInteriorismoMaterials(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const interiorAppId = appIdBySlug[INTERIORISMO_APPLICATION_SLUG];
  if (!interiorAppId) {
    console.log('\n⚠️  interiorismo app not found — skipping materiales seed');
    return;
  }

  const existing = await prisma.interiorCatalogMaterial.count({
    where: { applicationId: interiorAppId },
  });
  if (existing > 0) {
    console.log('\n📦 Materiales interiorismo ya sembrados — omitiendo demo');
    return;
  }

  console.log('\n📦 Creando materiales, proveedores y compras demo…');

  const matFloor = await prisma.interiorCatalogMaterial.create({
    data: {
      applicationId: interiorAppId,
      code: 'MAT-PISO-001',
      name: seedPrueba('Porcelanato 60×60 Alaska Blanco'),
      category: 'Pisos',
      brand: 'Cerámica Sur',
      unit: 'm²',
      price: new Prisma.Decimal('85.9'),
      stock: new Prisma.Decimal('128'),
      technicalSheetUrl: 'https://example.com/fichas/alaska-blanco.pdf',
      images: {
        create: [
          { sortOrder: 0, url: 'https://picsum.photos/seed/markap-piso1/480/480' },
          { sortOrder: 1, url: 'https://picsum.photos/seed/markap-piso2/480/480' },
        ],
      },
    },
  });

  const matPaint = await prisma.interiorCatalogMaterial.create({
    data: {
      applicationId: interiorAppId,
      code: 'MAT-PNT-014',
      name: seedPrueba('Látex premium lavable blanco'),
      category: 'Pinturas',
      brand: 'ColorTech',
      unit: 'gal',
      price: new Prisma.Decimal('42'),
      stock: new Prisma.Decimal('340'),
      technicalSheetUrl: null,
      images: {
        create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-pnt1/480/480' }],
      },
    },
  });

  const supNorth = await prisma.interiorMaterialSupplier.create({
    data: {
      applicationId: interiorAppId,
      companyName: seedPrueba('Distribuidora Norte SAC'),
      ruc: '20123456781',
      contactName: seedPrueba('Rosa Méndez'),
      phone: '987112233',
      email: 'ventas@dist-norte-demo.pe',
    },
  });

  const supCenter = await prisma.interiorMaterialSupplier.create({
    data: {
      applicationId: interiorAppId,
      companyName: seedPrueba('Acabados del Centro EIRL'),
      ruc: '20987654321',
      contactName: seedPrueba('Luis Prado'),
      phone: '982554433',
      email: 'comercial@acabados-demo.pe',
    },
  });

  await prisma.interiorSupplierCatalogLink.createMany({
    data: [
      {
        supplierId: supNorth.id,
        catalogMaterialId: matFloor.id,
        supplierSku: 'DN-PISO-ALASKA',
        notes: 'Entrega Lima norte',
      },
      {
        supplierId: supNorth.id,
        catalogMaterialId: matPaint.id,
        supplierSku: 'DN-PNT-WHITE-GAL',
        notes: null,
      },
      {
        supplierId: supCenter.id,
        catalogMaterialId: matFloor.id,
        supplierSku: 'AC-P60-AW',
        notes: 'Stock showroom Centro',
      },
    ],
  });

  await prisma.interiorMaterialPurchase.createMany({
    data: [
      {
        supplierId: supNorth.id,
        catalogMaterialId: matFloor.id,
        purchasedAt: new Date('2026-04-12'),
        quantity: new Prisma.Decimal('48'),
        unitPrice: new Prisma.Decimal('78'),
        totalAmount: new Prisma.Decimal('3744'),
        invoiceRef: 'F001-908822',
        notes: seedPrueba('Obra corporativo demo'),
      },
      {
        supplierId: supNorth.id,
        catalogMaterialId: matPaint.id,
        purchasedAt: new Date('2026-04-28'),
        quantity: new Prisma.Decimal('25'),
        unitPrice: new Prisma.Decimal('39.5'),
        totalAmount: new Prisma.Decimal('987.5'),
        invoiceRef: 'F001-910014',
        notes: null,
      },
      {
        supplierId: supCenter.id,
        catalogMaterialId: null,
        purchasedAt: new Date('2026-05-05'),
        quantity: new Prisma.Decimal('1'),
        unitPrice: new Prisma.Decimal('450'),
        totalAmount: new Prisma.Decimal('450'),
        invoiceRef: 'B011-44102',
        notes: seedPrueba('Flete y misceláneo'),
      },
    ],
  });

  console.log('   ✅ Catálogo (2), proveedores (2), vínculos y compras demo');
}
