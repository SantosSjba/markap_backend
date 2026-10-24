/** Legacy helper. Uses only the explicitly configured production connection. */
const { Client } = require('pg');
(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  throw new Error('Use pnpm exec prisma migrate deploy; ad-hoc schema changes are disabled.');
})().catch(error => { console.error(error.message); process.exit(1); });
