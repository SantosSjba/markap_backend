import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG, seedPrueba } from '../data';
import type { SeedDb } from '../types';

const DEMO_BOM_BY_CODE: Record<
  string,
  { materialName: string; unit: string; quantity: string; notes?: string }[]
> = {
  'MUE-COM-001': [
    { materialName: 'Tablero roble macizo 18mm', unit: 'm²', quantity: '1.62' },
    { materialName: 'Barniz poliuretano mate', unit: 'gal', quantity: '0.5' },
    { materialName: 'Patas metálicas negro mate', unit: 'und', quantity: '4' },
  ],
  'MUE-DOR-002': [
    { materialName: 'Melamina blanca 15mm', unit: 'plancha', quantity: '6' },
    { materialName: 'Canto PVC 2mm', unit: 'm', quantity: '28' },
    { materialName: 'Riel corredizo 3m', unit: 'und', quantity: '2' },
    { materialName: 'Bisagras cierre suave', unit: 'und', quantity: '12' },
  ],
  'MUE-OFI-003': [
    { materialName: 'MDF enchapado nogal', unit: 'm²', quantity: '4.2' },
    { materialName: 'Guías cajón telescópico', unit: 'par', quantity: '6' },
  ],
};

async function ensureDemoBomLines(prisma: SeedDb, applicationId: string): Promise<number> {
  let created = 0;
  for (const [code, lines] of Object.entries(DEMO_BOM_BY_CODE)) {
    const furniture = await prisma.produccionFurniture.findFirst({
      where: { applicationId, code },
      select: { id: true },
    });
    if (!furniture) continue;

    const existing = await prisma.produccionFurnitureBomLine.count({
      where: { furnitureId: furniture.id },
    });
    if (existing > 0) continue;

    await prisma.produccionFurnitureBomLine.createMany({
      data: lines.map((line, i) => ({
        furnitureId: furniture.id,
        sortOrder: i,
        materialName: seedPrueba(line.materialName),
        unit: line.unit,
        quantity: new Prisma.Decimal(line.quantity),
        notes: line.notes ?? null,
      })),
    });
    created += lines.length;
  }
  return created;
}

/**
 * Catálogo de muebles demo (Producción).
 */
export async function seedProduccionFurniture(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const produccionAppId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!produccionAppId) {
    console.log('\n⚠️  produccion app not found — skipping furniture seed');
    return;
  }

  const existing = await prisma.produccionFurniture.count({
    where: { applicationId: produccionAppId },
  });
  if (existing === 0) {
    console.log('\n🪑 Creando catálogo de muebles demo…');

    const items: Prisma.ProduccionFurnitureCreateInput[] = [
      {
        application: { connect: { id: produccionAppId } },
        code: 'MUE-COM-001',
        name: seedPrueba('Mesa comedor roble 6 puestos'),
        category: 'Comedor',
        description: 'Mesa rectangular en roble macizo, acabado natural.',
        widthCm: 180,
        depthCm: 90,
        heightCm: 76,
        referencePrice: new Prisma.Decimal('2850'),
        technicalSheetUrl: null,
        isActive: true,
        images: {
          create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-mesa-com/480/480' }],
        },
      },
      {
        application: { connect: { id: produccionAppId } },
        code: 'MUE-DOR-002',
        name: seedPrueba('Ropero empotrado 3 cuerpos'),
        category: 'Dormitorio',
        description: 'Ropero a medida con puertas corredizas y cajonera interna.',
        widthCm: 240,
        depthCm: 60,
        heightCm: 240,
        referencePrice: new Prisma.Decimal('4200'),
        isActive: true,
        images: {
          create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-ropero/480/480' }],
        },
      },
      {
        application: { connect: { id: produccionAppId } },
        code: 'MUE-OFI-003',
        name: seedPrueba('Escritorio ejecutivo L'),
        category: 'Oficina',
        description: 'Escritorio en L con cajones laterales y pasacables.',
        widthCm: 160,
        depthCm: 140,
        heightCm: 75,
        referencePrice: new Prisma.Decimal('1950'),
        isActive: true,
        images: {
          create: [{ sortOrder: 0, url: 'https://picsum.photos/seed/markap-escritorio/480/480' }],
        },
      },
      {
        application: { connect: { id: produccionAppId } },
        code: 'MUE-COC-004',
        name: seedPrueba('Isla de cocina con barra'),
        category: 'Cocina',
        description: 'Isla central con almacenamiento y barra desayunador.',
        widthCm: 200,
        depthCm: 90,
        heightCm: 90,
        referencePrice: new Prisma.Decimal('5600'),
        isActive: true,
      },
      {
        application: { connect: { id: produccionAppId } },
        code: 'MUE-OTR-005',
        name: seedPrueba('Biblioteca modular (diseño antiguo)'),
        category: 'Otro',
        description: 'Modelo descontinuado — solo referencia histórica.',
        widthCm: 120,
        depthCm: 35,
        heightCm: 200,
        referencePrice: new Prisma.Decimal('980'),
        isActive: false,
      },
    ];

    for (const data of items) {
      await prisma.produccionFurniture.create({ data });
    }

    console.log(`   ✅ ${items.length} muebles demo en catálogo producción`);
  } else {
    console.log('\n🪑 Catálogo muebles producción ya sembrado — omitiendo alta de muebles');
  }

  const bomCreated = await ensureDemoBomLines(prisma, produccionAppId);
  if (bomCreated > 0) {
    console.log(`   ✅ ${bomCreated} líneas BOM demo en catálogo producción`);
  }
}
