import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  IsIn,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UBIGEO_OTHER_DISTRICT_ID } from '@common/constants/ubigeo-other.constants';
import { LocationCustomDto } from '../clients/location-custom.dto';
import { PropertyMediaItemDto } from './property-media-item.dto';

export class UpdatePropertyDto {
  @ApiProperty({ description: 'Código de la propiedad (ej: PROP-001)' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'ID del tipo de propiedad' })
  @IsString()
  propertyTypeId: string;

  @ApiProperty({ description: 'Dirección completa' })
  @IsString()
  addressLine: string;

  @ApiProperty({ description: 'ID del distrito (ubigeo)' })
  @IsString()
  districtId: string;

  @ApiPropertyOptional({
    description: 'Ubicación libre cuando distrito = Otros; null si vuelve a ubigeo peruano',
  })
  @ValidateIf((o) => o.districtId === UBIGEO_OTHER_DISTRICT_ID)
  @IsObject()
  @ValidateNested()
  @Type(() => LocationCustomDto)
  locationCustom?: LocationCustomDto | null;

  @ApiPropertyOptional({ description: 'Descripción de la propiedad' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Área en m²' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area?: number | null;

  @ApiPropertyOptional({ description: 'Número de habitaciones' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number | null;

  @ApiPropertyOptional({ description: 'Número de baños' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bathrooms?: number | null;

  @ApiPropertyOptional({ description: 'Antigüedad en años' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ageYears?: number | null;

  @ApiPropertyOptional({ description: 'Piso o nivel' })
  @IsOptional()
  @IsString()
  floorLevel?: string | null;

  @ApiPropertyOptional({ description: 'Número de estacionamientos' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  parkingSpaces?: number | null;

  @ApiPropertyOptional({ description: 'Número de partida 1 (máx. 3 por propiedad)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partida1?: string | null;

  @ApiPropertyOptional({ description: 'Número de partida 2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partida2?: string | null;

  @ApiPropertyOptional({ description: 'Número de partida 3' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partida3?: string | null;

  @ApiProperty({ description: 'ID del propietario principal (cliente tipo OWNER)' })
  @IsString()
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({
    description: 'IDs de copropietarios / propietarios adicionales (incluye el principal)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ownerClientIds?: string[];

  @ApiPropertyOptional({ description: 'Alquiler mensual (S/)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyRent?: number | null;

  @ApiPropertyOptional({ description: 'Mantenimiento (S/)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maintenanceAmount?: number | null;

  @ApiPropertyOptional({ description: 'Garantía en meses' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  depositMonths?: number | null;

  @ApiPropertyOptional({ description: 'Precio de venta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number | null;

  @ApiPropertyOptional({ description: 'Moneda del precio de venta (código catálogo)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  saleCurrency?: string;

  @ApiPropertyOptional({ description: 'Proyecto / urbanización' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  projectName?: string | null;

  @ApiPropertyOptional({ type: [PropertyMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyMediaItemDto)
  mediaItems?: PropertyMediaItemDto[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'EXPIRING', 'MAINTENANCE'])
  listingStatus?: string | null;
}
