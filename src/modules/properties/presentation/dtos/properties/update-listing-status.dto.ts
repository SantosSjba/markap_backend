import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

/** Alquileres: RENTED | EXPIRING | MAINTENANCE (requiere alquiler activo). Ventas: AVAILABLE | RESERVED | SOLD. */
export class UpdateListingStatusDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    listingStatus: z.enum(
      ['RENTED', 'EXPIRING', 'MAINTENANCE', 'AVAILABLE', 'RESERVED', 'SOLD'],
      {
        error: 'El campo «estado de la propiedad» no es una opción permitida.',
      },
    ),
  });

  @ApiProperty({
    description:
      'Alquileres: RENTED, EXPIRING, MAINTENANCE (requiere alquiler en vigencia). Ventas: AVAILABLE, RESERVED, SOLD.',
    enum: [
      'RENTED',
      'EXPIRING',
      'MAINTENANCE',
      'AVAILABLE',
      'RESERVED',
      'SOLD',
    ],
  })
  listingStatus:
    | 'RENTED'
    | 'EXPIRING'
    | 'MAINTENANCE'
    | 'AVAILABLE'
    | 'RESERVED'
    | 'SOLD';
}
