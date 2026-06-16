/**
 * Inserta solo el ubigeo "Otros" (99 / 9999 / 999999).
 * Uso: pnpm exec ts-node prisma/scripts/seed-ubigeo-other.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UBIGEO_OTHER_SEED } from '../seed/data/ubigeo-other';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const o = UBIGEO_OTHER_SEED;
  await prisma.department.upsert({
    where: { id: o.department.id },
    update: { name: o.department.name },
    create: o.department,
  });
  await prisma.province.upsert({
    where: { id: o.province.id },
    update: { departmentId: o.province.departmentId, name: o.province.name },
    create: o.province,
  });
  await prisma.district.upsert({
    where: { id: o.district.id },
    update: { provinceId: o.district.provinceId, name: o.district.name },
    create: o.district,
  });
  console.log('✅ Ubigeo "Otros" listo (departamento 99, provincia 9999, distrito 999999)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
