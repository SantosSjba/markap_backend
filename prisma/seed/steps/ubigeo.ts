import { DEPARTMENTS, DISTRICTS, PROVINCES } from '../data';
import type { SeedDb } from '../types';

export async function seedUbigeo(prisma: SeedDb): Promise<void> {
  console.log('\n🗺️ Creating ubigeo (all Peru)...');

  async function bulkUpsertDepartments(rows: readonly { id: string; name: string }[]) {
    const values = rows.map(r => `('${r.id}', '${r.name.replace(/'/g, "''")}')`).join(',');
    await prisma.$executeRawUnsafe(
      `INSERT INTO departments (id, name) VALUES ${values} ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    );
  }

  async function bulkUpsertProvinces(
    rows: readonly { id: string; departmentId: string; name: string }[],
  ) {
    const values = rows
      .map(r => `('${r.id}', '${r.departmentId}', '${r.name.replace(/'/g, "''")}')`)
      .join(',');
    await prisma.$executeRawUnsafe(
      `INSERT INTO provinces (id, department_id, name) VALUES ${values} ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    );
  }

  async function bulkUpsertDistricts(
    rows: readonly { id: string; provinceId: string; name: string }[],
  ) {
    const values = rows
      .map(r => `('${r.id}', '${r.provinceId}', '${r.name.replace(/'/g, "''")}')`)
      .join(',');
    await prisma.$executeRawUnsafe(
      `INSERT INTO districts (id, province_id, name) VALUES ${values} ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    );
  }

  await bulkUpsertDepartments(DEPARTMENTS);
  console.log(`   ✅ ${DEPARTMENTS.length} departments`);

  await bulkUpsertProvinces(PROVINCES);
  console.log(`   ✅ ${PROVINCES.length} provinces`);

  const CHUNK = 500;
  for (let i = 0; i < DISTRICTS.length; i += CHUNK) {
    await bulkUpsertDistricts(DISTRICTS.slice(i, i + CHUNK));
    console.log(`   ... districts ${i + 1}–${Math.min(i + CHUNK, DISTRICTS.length)} done`);
  }
  console.log(`   ✅ ${DISTRICTS.length} districts`);
}
