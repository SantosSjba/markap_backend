import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Slug de la aplicación (ej: alquileres)' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

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

  @ApiProperty({ description: 'ID del propietario (cliente tipo OWNER)' })
  @IsString()
  @IsUUID()
  ownerId: string;

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
}
