import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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

  const prefixes = ['arquitectura', 'contabilidad', 'gen_archivos', 'interior_budget', 'ventas_pipeline', 'sale_'];
  const relevant = tables
    .map((t) => t.table_name)
    .filter((name) => prefixes.some((p) => name.startsWith(p)));

  console.log('Tablas relevantes en producción:', relevant.length);
  for (const name of relevant) console.log(' -', name);

  const cols: { column_name: string }[] = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients'
    ORDER BY column_name
  `;
  console.log('\nColumnas clients:', cols.map((c) => c.column_name).join(', '));

  const interiorCols: { column_name: string }[] = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'interior_projects'
    ORDER BY column_name
  `;
  console.log('\nColumnas interior_projects:', interiorCols.map((c) => c.column_name).join(', '));

  const counts = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE table_name LIKE 'contabilidad%')::int AS contabilidad,
      COUNT(*) FILTER (WHERE table_name LIKE 'arquitectura%')::int AS arquitectura,
      COUNT(*) FILTER (WHERE table_name LIKE 'produccion%')::int AS produccion,
      COUNT(*) FILTER (WHERE table_name LIKE 'interior_%')::int AS interior
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  console.log('\nConteos:', counts[0]);

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
  console.log('\nTablas interior_*:', interiorTables.map((t) => t.table_name).join(', '));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
