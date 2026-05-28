import { CURRENCIES, DOCUMENT_TYPES, PROPERTY_TYPES } from '../data';
import type { SeedDb } from '../types';

export async function seedDocumentTypes(prisma: SeedDb): Promise<void> {
  console.log('\n📄 Creating document types...');
  for (const dt of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: dt.code },
      create: dt,
      update: {},
    });
  }
  console.log('   ✅ Document types created');
}

export async function seedPropertyTypes(prisma: SeedDb): Promise<void> {
  console.log('\n🏠 Creating property types...');
  for (const pt of PROPERTY_TYPES) {
    await prisma.propertyType.upsert({
      where: { code: pt.code },
      create: pt,
      update: {},
    });
  }
  console.log('   ✅ Property types created');
}

export async function seedCurrencies(prisma: SeedDb): Promise<void> {
  console.log('\n💱 Creating currencies...');
  for (const c of CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      update: {
        name: c.name,
        symbol: c.symbol,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
  }
  console.log('   ✅ Currencies created');
}
