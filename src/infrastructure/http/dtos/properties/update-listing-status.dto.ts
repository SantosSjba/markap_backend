import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

/** Alquileres: RENTED | EXPIRING | MAINTENANCE (requiere alquiler activo). Ventas: AVAILABLE | RESERVED | SOLD. */
export class UpdateListingStatusDto {
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
  @IsString()
  @IsIn([
    'RENTED',
    'EXPIRING',
    'MAINTENANCE',
    'AVAILABLE',
    'RESERVED',
    'SOLD',
  ])
  listingStatus:
    | 'RENTED'
    | 'EXPIRING'
    | 'MAINTENANCE'
    | 'AVAILABLE'
    | 'RESERVED'
    | 'SOLD';
}
