import { Prisma } from '@prisma/client';
import { ARQUITECTURA_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

/**
 * Catálogo de materiales, proveedores, vínculos e historial de compras (Arquitectura).
 */
export async function seedArquitecturaMaterials(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const arquitecturaAppId = appIdBySlug[ARQUITECTURA_APPLICATION_SLUG];
  if (!arquitecturaAppId) {
    console.log('\n⚠️  arquitectura app not found — skipping materiales seed');
    return;
  }

  const existing = await prisma.arquitecturaCatalogMaterial.count({
    where: { applicationId: arquitecturaAppId },
  });
  if (existing > 0) {
    console.log('\n📦 Materiales arquitectura ya sembrados — omitiendo demo');
    return;
  }

  console.log('\n📦 Creando materiales, proveedores y compras demo (arquitectura)…');

  const matCement = await prisma.arquitecturaCatalogMaterial.create({
    data: {
      applicationId: arquitecturaAppId,
      code: 'ARQ-CEM-001',
      name: seedPrueba('Cemento Sol tipo I — bolsa 42.5 kg'),
      category: 'Estructura',
      brand: 'Cementos Pacasmayo',
      unit: 'bol',
      price: new Prisma.Decimal('28.5'),
      stock: new Prisma.Decimal('850'),
      technicalSheetUrl: 'https://example.com/fichas/cemento-sol-i.pdf',
      images: {
        create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-arq-cem/480/480' }],
      },
    },
  });

  const matSteel = await prisma.arquitecturaCatalogMaterial.create({
    data: {
      applicationId: arquitecturaAppId,
      code: 'ARQ-ACE-012',
      name: seedPrueba('Acero corrugado Grado 60 — 1/2"'),
      category: 'Estructura',
      brand: 'Aceros Arequipa',
      unit: 'var',
      price: new Prisma.Decimal('42.8'),
      stock: new Prisma.Decimal('1200'),
      technicalSheetUrl: null,
      images: {
        create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-arq-steel/480/480' }],
      },
    },
  });

  const supObra = await prisma.arquitecturaMaterialSupplier.create({
    data: {
      applicationId: arquitecturaAppId,
      companyName: seedPrueba('Materiales de Obra Lima SAC'),
      ruc: '20111222333',
      contactName: seedPrueba('Jorge Peña'),
      phone: '987001122',
      email: 'ventas@mobra-lima-demo.pe',
    },
  });

  const supMetal = await prisma.arquitecturaMaterialSupplier.create({
    data: {
      applicationId: arquitecturaAppId,
      companyName: seedPrueba('Ferretería Industrial del Sur EIRL'),
      ruc: '20999888777',
      contactName: seedPrueba('Carmen Salas'),
      phone: '982334455',
      email: 'comercial@fisur-demo.pe',
    },
  });

  await prisma.arquitecturaSupplierCatalogLink.createMany({
    data: [
      {
        supplierId: supObra.id,
        catalogMaterialId: matCement.id,
        supplierSku: 'MO-CEM-SOL-425',
        notes: 'Entrega obra La Molina',
      },
      {
        supplierId: supMetal.id,
        catalogMaterialId: matSteel.id,
        supplierSku: 'FIS-AC-12-G60',
        notes: 'Corte a medida',
      },
      {
        supplierId: supObra.id,
        catalogMaterialId: matSteel.id,
        supplierSku: 'MO-AC-12',
        notes: null,
      },
    ],
  });

  await prisma.arquitecturaMaterialPurchase.createMany({
    data: [
      {
        supplierId: supObra.id,
        catalogMaterialId: matCement.id,
        purchasedAt: new Date('2026-03-10'),
        quantity: new Prisma.Decimal('320'),
        unitPrice: new Prisma.Decimal('26.5'),
        totalAmount: new Prisma.Decimal('8480'),
        invoiceRef: 'F001-120334',
        notes: seedPrueba('Obra vivienda La Molina'),
      },
      {
        supplierId: supMetal.id,
        catalogMaterialId: matSteel.id,
        purchasedAt: new Date('2026-03-22'),
        quantity: new Prisma.Decimal('180'),
        unitPrice: new Prisma.Decimal('41'),
        totalAmount: new Prisma.Decimal('7380'),
        invoiceRef: 'F002-884412',
        notes: null,
      },
      {
        supplierId: supObra.id,
        catalogMaterialId: null,
        purchasedAt: new Date('2026-04-02'),
        quantity: new Prisma.Decimal('1'),
        unitPrice: new Prisma.Decimal('580'),
        totalAmount: new Prisma.Decimal('580'),
        invoiceRef: 'B011-55201',
        notes: seedPrueba('Flete materiales estructura'),
      },
    ],
  });

  console.log('   ✅ Catálogo (2), proveedores (2), vínculos y compras demo');
}
