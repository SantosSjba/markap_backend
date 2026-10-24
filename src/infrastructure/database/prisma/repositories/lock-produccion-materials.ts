import { Prisma } from '@prisma/client';

/** Bloquea en orden estable antes de leer saldos que se van a modificar. */
export async function lockProduccionMaterials(
  tx: Prisma.TransactionClient,
  materialIds: readonly string[],
): Promise<void> {
  const ids = [...new Set(materialIds)].sort();
  if (!ids.length) return;
  await tx.$queryRaw`
    SELECT id FROM produccion_materials
    WHERE id IN (${Prisma.join(ids)})
    ORDER BY id FOR UPDATE
  `;
}
