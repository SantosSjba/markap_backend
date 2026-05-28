import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '@infrastructure/database/prisma/prisma.service';

/** Valida que el código exista en el catálogo de monedas activas. */
export async function assertActiveSaleCurrency(
  prisma: PrismaService,
  code: string | undefined | null,
): Promise<string> {
  const normalized = (code ?? 'PEN').trim().toUpperCase();
  if (!normalized) {
    throw new BadRequestException('Seleccione la moneda del precio de venta.');
  }
  const row = await prisma.currency.findFirst({
    where: { code: normalized, isActive: true },
  });
  if (!row) {
    throw new BadRequestException(`Moneda no válida o inactiva: ${normalized}`);
  }
  return normalized;
}
