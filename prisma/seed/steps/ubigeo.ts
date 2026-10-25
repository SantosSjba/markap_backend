import { DEPARTMENTS, DISTRICTS, PROVINCES } from '../data';
import { UBIGEO_OTHER_SEED } from '../data/ubigeo-other';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:ubigeo');

export async function seedUbigeo(prisma: SeedDb): Promise<void> {
  logger.info({ event: 'seed.progress' }, '\n🗺️ Creating ubigeo (all Peru)...');
  // Keep transactions small to avoid timeout/rollback errors in remote MySQL.
  const CHUNK = 100;

  async function bulkUpsertDepartments(
    rows: readonly { id: string; name: string }[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      for (const row of chunk) {
        await prisma.department.upsert({
          where: { id: row.id },
          update: { name: row.name },
          create: { id: row.id, name: row.name },
        });
      }
    }
  }

  async function bulkUpsertProvinces(
    rows: readonly { id: string; departmentId: string; name: string }[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      for (const row of chunk) {
        await prisma.province.upsert({
          where: { id: row.id },
          update: { departmentId: row.departmentId, name: row.name },
          create: {
            id: row.id,
            departmentId: row.departmentId,
            name: row.name,
          },
        });
      }
    }
  }

  async function bulkUpsertDistricts(
    rows: readonly { id: string; provinceId: string; name: string }[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      for (const row of chunk) {
        await prisma.district.upsert({
          where: { id: row.id },
          update: { provinceId: row.provinceId, name: row.name },
          create: { id: row.id, provinceId: row.provinceId, name: row.name },
        });
      }
      logger.info(
        { event: 'seed.progress' },
        `   ... districts ${i + 1}–${Math.min(i + CHUNK, rows.length)} done`,
      );
    }
  }

  await bulkUpsertDepartments(DEPARTMENTS);
  logger.info(
    { event: 'seed.progress' },
    `   ✅ ${DEPARTMENTS.length} departments`,
  );

  await bulkUpsertProvinces(PROVINCES);
  logger.info(
    { event: 'seed.progress' },
    `   ✅ ${PROVINCES.length} provinces`,
  );

  await bulkUpsertDistricts(DISTRICTS);
  logger.info(
    { event: 'seed.progress' },
    `   ✅ ${DISTRICTS.length} districts`,
  );

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
  logger.info(
    { event: 'seed.progress' },
    `   ✅ Ubigeo "${o.department.name}" (extranjero / sin ubigeo)`,
  );
}
