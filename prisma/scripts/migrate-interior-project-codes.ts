/**
 * Pasa los proyectos de Interiorismo al código descriptivo
 * `PROYECTO-<año>-<TIPO>-<DISTRITO>-<APELLIDO>` y guarda el anterior en `legacy_code`.
 * Idempotente: solo toca proyectos cuyo código aún no empieza con `PROYECTO-`.
 * Distrito: el del proyecto o, si no tiene, el de la dirección principal del cliente.
 * Año: fecha de inicio o, si no tiene, fecha de creación.
 *
 * Uso: pnpm run prisma:migrate:interior-project-codes
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  INTERIOR_PROJECT_CODE_OPERATION,
  INTERIOR_PROJECT_TYPE_LABELS,
  buildInteriorProjectCode,
  suggestClientSurname,
} from '../../src/modules/interiorismo/domain/utils/interior-project-code.util';
import { todayDateOnlyLima } from '../../src/shared/domain/utils/peru-date.util';
import { createScriptLogger } from '../../src/shared/infrastructure/logging/script-logger';

const logger = createScriptLogger('Script:migrate-interior-project-codes');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const projects = await prisma.interiorProject.findMany({
    where: {
      NOT: { code: { startsWith: `${INTERIOR_PROJECT_CODE_OPERATION}-` } },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      district: { select: { name: true } },
      client: {
        select: {
          fullName: true,
          documentNumber: true,
          addresses: {
            orderBy: { isPrimary: 'desc' },
            take: 1,
            select: { districtId: true, district: { select: { name: true } } },
          },
        },
      },
    },
  });

  for (const p of projects) {
    const clientAddress = p.client.addresses[0];
    const used = (
      await prisma.interiorProject.findMany({
        where: { applicationId: p.applicationId },
        select: { code: true },
      })
    ).map((r) => r.code);
    const code = buildInteriorProjectCode(
      {
        year: Number(todayDateOnlyLima(p.startDate ?? p.createdAt).slice(0, 4)),
        typeLabel: INTERIOR_PROJECT_TYPE_LABELS[p.projectType] ?? p.projectType,
        district: p.district?.name ?? clientAddress?.district.name ?? p.city,
        clientSurname: suggestClientSurname(
          p.client.fullName,
          p.client.documentNumber,
        ),
      },
      used,
    );
    await prisma.interiorProject.update({
      where: { id: p.id },
      data: {
        code,
        legacyCode: p.legacyCode ?? p.code,
        districtId: p.districtId ?? clientAddress?.districtId ?? null,
      },
    });
    logger.info({ event: 'migration.project' }, `${p.code} → ${code}`);
  }
  logger.info(
    { event: 'migration.done' },
    `✅ ${projects.length} proyecto(s) con código descriptivo.`,
  );
}

main()
  .catch((err) => {
    logger.error(
      { event: 'migration.failed', err },
      'Operación del script fallida',
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
