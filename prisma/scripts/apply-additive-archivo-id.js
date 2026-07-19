/**
 * Aplica SQL aditivo (ADD COLUMN IF NOT EXISTS). Nunca DROP / truncate.
 * Uso: node prisma/scripts/apply-additive-archivo-id.js
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(
  __dirname,
  '..',
  'migrations',
  'manual',
  'add-archivo-id-docs-evidences.sql',
);
const sql = fs.readFileSync(sqlPath, 'utf8');

const candidates = [
  process.env.DATABASE_URL_PUBLIC,
  'postgresql://postgres:MW56rm1kgEI21XTBZ5IM24EArbzxpR7P1ZQBjAELWhhVH9a9wSByPfVAQBC6BVT8@127.0.0.1:5433/markap_db',
  'postgresql://postgres:MW56rm1kgEI21XTBZ5IM24EArbzxpR7P1ZQBjAELWhhVH9a9wSByPfVAQBC6BVT8@152.228.130.81:5433/markap_db',
].filter(Boolean);

async function tryUrl(url) {
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  console.log('Connected:', url.replace(/:[^:@/]+@/, ':***@'));

  // Safety: count rows that must NOT disappear
  const beforeBudgets = await client.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'interior_budget%'`,
  );
  console.log('interior_budget tables before:', beforeBudgets.rows[0].n);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }

  const cols = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND column_name IN ('archivo_id', 'payment_evidence_archivo_id')
     ORDER BY table_name, column_name`,
  );
  console.log('Additive columns present:');
  for (const row of cols.rows) {
    console.log(' -', row.table_name + '.' + row.column_name);
  }

  const afterBudgets = await client.query(
    `SELECT COUNT(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'interior_budget%'`,
  );
  console.log('interior_budget tables after:', afterBudgets.rows[0].n);
  if (afterBudgets.rows[0].n < beforeBudgets.rows[0].n) {
    throw new Error('UNEXPECTED: interior_budget tables decreased — abort logic violated');
  }

  await client.end();
}

(async () => {
  let lastErr;
  for (const url of candidates) {
    try {
      await tryUrl(url);
      console.log('OK — additive migration applied without data loss');
      process.exit(0);
    } catch (e) {
      lastErr = e;
      console.log('Failed:', e.message);
    }
  }
  console.error('Could not apply SQL. Last error:', lastErr?.message);
  process.exit(1);
})();
