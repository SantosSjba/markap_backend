import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createScriptLogger } from '../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:inspect-prod-schema');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

async function main() {
  const tables: { table_name: string }[] = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  const prefixes = [
    'arquitectura',
    'contabilidad',
    'gen_archivos',
    'interior_budget',
    'ventas_pipeline',
    'sale_',
  ];
  const relevant = tables
    .map((t) => t.table_name)
    .filter((name) => prefixes.some((p) => name.startsWith(p)));

  logger.info(
    {
      event: 'schema_inspection.progress',
      details: { value1: relevant.length },
    },
    'Tablas relevantes en producción:',
  );
  for (const name of relevant)
    logger.info(
      { event: 'schema_inspection.progress', details: { value1: name } },
      ' -',
    );

  const cols: { column_name: string }[] = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients'
    ORDER BY column_name
  `;
  logger.info(
    {
      event: 'schema_inspection.progress',
      details: { value1: cols.map((c) => c.column_name).join(', ') },
    },
    '\nColumnas clients:',
  );

  const interiorCols: { column_name: string }[] = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interior_projects'
    ORDER BY column_name
  `;
  logger.info(
    {
      event: 'schema_inspection.progress',
      details: { value1: interiorCols.map((c) => c.column_name).join(', ') },
    },
    '\nColumnas interior_projects:',
  );

  const counts = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE table_name LIKE 'contabilidad%')::int AS contabilidad,
      COUNT(*) FILTER (WHERE table_name LIKE 'arquitectura%')::int AS arquitectura,
      COUNT(*) FILTER (WHERE table_name LIKE 'produccion%')::int AS produccion,
      COUNT(*) FILTER (WHERE table_name LIKE 'interior_%')::int AS interior
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  logger.info(
    { event: 'schema_inspection.progress', details: { value1: counts[0] } },
    '\nConteos:',
  );

  const mig = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    ) AS exists
  `;
  const interiorTables: { table_name: string }[] = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'interior%'
    ORDER BY table_name
  `;
  logger.info(
    {
      event: 'schema_inspection.progress',
      details: { value1: interiorTables.map((t) => t.table_name).join(', ') },
    },
    '\nTablas interior_*:',
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    logger.error(
      { event: 'schema_inspection.failed', err: e },
      'Operación del script fallida',
    );
    await prisma.$disconnect();
    process.exit(1);
  });
