/**
 * Migración segura a producción: solo cambios aditivos.
 * - NO ejecuta DROP TABLE ni DELETE
 * - Conserva tablas legacy interior_budget_* con sus datos
 * - Genera diff Prisma (BD actual → schema) y filtra operaciones destructivas
 *
 * Uso (DATABASE_URL = producción):
 *   pnpm exec ts-node prisma/scripts/apply-prod-safe-migrations.ts
 */
import 'dotenv/config';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const MANUAL_DIR = join(ROOT, 'migrations', 'manual');
const DIFF_OUT = join(MANUAL_DIR, '_prod-safe-filtered.sql');

const SKIP_MANUAL_FILES = new Set([
  '_prod-diff-preview.sql',
  '_prod-safe-filtered.sql',
  'ventas-pipeline-stages-postgres.sql', // DELETE + reinsert config
]);

const MANUAL_ORDER = [
  'prod-safe-additive-columns-postgres.sql',
  'arquitectura-phase1-config-projects-postgres.sql',
  'arquitectura-phase4-budget-finance-postgres.sql',
  'arquitectura-phase6-calendar-postgres.sql',
  'arquitectura-phase7-documents-postgres.sql',
  'arquitectura-phase8-execution-postgres.sql',
  'arquitectura-phase9-materials-postgres.sql',
];

function maskUrl(url: string): string {
  return url.replace(/:[^:@/]+@/, ':****@').slice(0, 90);
}

function isDestructiveBlock(block: string): boolean {
  const u = block.toUpperCase();
  if (/\bDROP\s+TABLE\b/.test(u)) return true;
  if (/\bDROP\s+COLUMN\b/.test(u)) return true;
  if (/\bDELETE\s+FROM\b/.test(u)) return true;
  if (/\bTRUNCATE\b/.test(u)) return true;
  if (/\bDROP\s+CONSTRAINT\b/.test(u) && u.includes('INTERIOR_BUDGET')) return true;
  return false;
}

function makeIdempotent(sql: string): string {
  return sql
    .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
    .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
    .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');
}

function filterDiffSql(raw: string): string {
  const blocks = raw.split(/\n(?=-- )/);
  const safe = blocks.filter((block) => block.trim() && !isDestructiveBlock(block));
  return makeIdempotent(safe.join('\n').trim() + '\n');
}

function runSqlFile(filePath: string, label: string): void {
  if (!existsSync(filePath)) {
    console.log(`   ⏭️  ${label}: archivo no encontrado`);
    return;
  }
  try {
    execSync(`npx prisma db execute --file "${filePath}"`, {
      cwd: join(ROOT, '..'),
      stdio: 'pipe',
      encoding: 'utf8',
    });
    console.log(`   ✅ ${label}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const combined = msg + (typeof err === 'object' && err && 'stdout' in err ? String((err as { stdout?: string }).stdout) : '');
    if (/already exists|duplicate|multiple primary keys|Failing row contains/i.test(combined)) {
      if (/Failing row contains/i.test(combined)) {
        console.log(`   ⚠️  ${label} (omitido — datos existentes incompatibles, sin cambios destructivos)`);
        return;
      }
      console.log(`   ✓ ${label} (ya aplicado)`);
      return;
    }
    console.error(`   ❌ ${label}`);
    console.error(combined.slice(0, 800));
    throw err;
  }
}

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL no definida');

  console.log('🛡️  Migración segura a producción');
  console.log('   Conexión:', maskUrl(url), '...\n');
  console.log('   Reglas: sin DROP TABLE, sin DELETE, conserva interior_budget_*\n');

  console.log('📄 Paso 1: SQL manual idempotente (columnas + arquitectura)...');
  for (const file of MANUAL_ORDER) {
    runSqlFile(join(MANUAL_DIR, file), file);
  }

  const extraManual: string[] = [];

  console.log('\n📄 Paso 2: diff Prisma filtrado (nuevas tablas: contabilidad, producción, presupuesto interior)...');
  execSync(`npx prisma migrate diff --from-config-datasource --to-schema prisma --script -o "${DIFF_OUT}"`, {
    cwd: join(ROOT, '..'),
    stdio: 'inherit',
  });

  const rawDiff = readFileSync(DIFF_OUT, 'utf8');
  const safeDiff = filterDiffSql(rawDiff);
  writeFileSync(DIFF_OUT, safeDiff, 'utf8');

  const dropCount = (rawDiff.match(/DROP TABLE/gi) ?? []).length;
  const keptCreates = (safeDiff.match(/CREATE TABLE/gi) ?? []).length;
  console.log(`   Diff: ${dropCount} DROP omitidos, ${keptCreates} CREATE TABLE en script seguro`);

  if (safeDiff.trim().length > 10) {
    runSqlFile(DIFF_OUT, '_prod-safe-filtered.sql');
  } else {
    console.log('   ✓ Diff vacío — esquema ya alineado');
  }

  console.log('\n📄 Paso 3: verificación...');
  execSync('npx ts-node prisma/scripts/inspect-prod-schema.ts', {
    cwd: join(ROOT, '..'),
    stdio: 'inherit',
  });

  console.log('\n✨ Migración segura completada.');
  console.log('   Nota: tablas interior_budget_* legacy se conservan con sus datos.');
  console.log('   Para migrar presupuestos al modelo nuevo: pnpm run prisma:migrate:interior-budgets\n');
}

main().catch((e) => {
  console.error('❌ Migración falló:', e);
  process.exit(1);
});
