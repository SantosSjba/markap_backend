import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '@infrastructure/database/prisma/prisma.service';

/** Valida que el id exista en el catálogo de medios de financiamiento activos. */
export async function assertActiveSaleFinancingChannel(
  prisma: PrismaService,
  id: string | undefined | null,
): Promise<string | null> {
  if (id === undefined) return undefined as unknown as string | null;
  if (id === null || !String(id).trim()) return null;
  const row = await prisma.saleFinancingChannel.findFirst({
    where: { id: id.trim(), isActive: true },
  });
  if (!row) {
    throw new BadRequestException('Medio de pago / banco no válido o inactivo.');
  }
  return row.id;
}
