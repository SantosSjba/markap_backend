import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateListingStatusDto {
  @ApiProperty({
    description: 'Estado de listado de la propiedad (solo si tiene alquiler en vigencia)',
    enum: ['RENTED', 'EXPIRING', 'MAINTENANCE'],
  })
  @IsString()
  @IsIn(['RENTED', 'EXPIRING', 'MAINTENANCE'])
  listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE';
}
