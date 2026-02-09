import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateClientAddressDto {
  @ApiProperty({ description: 'Dirección completa' })
  @IsString()
  addressLine: string;

  @ApiProperty({ description: 'ID del distrito (ubigeo)' })
  @IsString()
  districtId: string;

  @ApiPropertyOptional({ description: 'Referencia' })
  @IsOptional()
  @IsString()
  reference?: string | null;
}

export class CreateClientDto {
  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Slug de la aplicación (ej: alquileres)' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

  @ApiProperty({
    description: 'Tipo de cliente',
    enum: ['OWNER', 'TENANT', 'BOTH'],
  })
  @IsEnum(['OWNER', 'TENANT', 'BOTH'])
  clientType: 'OWNER' | 'TENANT' | 'BOTH';

  @ApiProperty({ description: 'ID del tipo de documento' })
  @IsString()
  documentTypeId: string;

  @ApiProperty({ description: 'Número de documento' })
  @IsString()
  documentNumber: string;

  @ApiProperty({ description: 'Nombre completo o Razón Social' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Representante legal' })
  @IsOptional()
  @IsString()
  legalRepresentativeName?: string | null;

  @ApiPropertyOptional({ description: 'Cargo del representante legal' })
  @IsOptional()
  @IsString()
  legalRepresentativePosition?: string | null;

  @ApiProperty({ description: 'Teléfono principal' })
  @IsString()
  primaryPhone: string;

  @ApiPropertyOptional({ description: 'Teléfono secundario' })
  @IsOptional()
  @IsString()
  secondaryPhone?: string | null;

  @ApiProperty({ description: 'Email principal' })
  @IsString()
  primaryEmail: string;

  @ApiPropertyOptional({ description: 'Email secundario' })
  @IsOptional()
  @IsString()
  secondaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ description: 'Dirección' })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateClientAddressDto)
  address: CreateClientAddressDto;
}
