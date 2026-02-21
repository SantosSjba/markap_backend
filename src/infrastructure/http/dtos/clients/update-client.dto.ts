import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateClientAddressDto {
  @ApiPropertyOptional({ description: 'Dirección completa' })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({ description: 'ID del distrito (ubigeo)' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Referencia' })
  @IsOptional()
  @IsString()
  reference?: string | null;
}

export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'Tipo de cliente',
    enum: ['OWNER', 'TENANT'],
  })
  @IsOptional()
  @IsEnum(['OWNER', 'TENANT'])
  clientType?: 'OWNER' | 'TENANT';

  @ApiPropertyOptional({ description: 'ID del tipo de documento' })
  @IsOptional()
  @IsString()
  documentTypeId?: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Nombre completo o Razón Social' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Representante legal' })
  @IsOptional()
  @IsString()
  legalRepresentativeName?: string | null;

  @ApiPropertyOptional({ description: 'Cargo del representante legal' })
  @IsOptional()
  @IsString()
  legalRepresentativePosition?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono principal' })
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional({ description: 'Teléfono secundario' })
  @IsOptional()
  @IsString()
  secondaryPhone?: string | null;

  @ApiPropertyOptional({ description: 'Email principal' })
  @IsOptional()
  @IsString()
  primaryEmail?: string;

  @ApiPropertyOptional({ description: 'Email secundario' })
  @IsOptional()
  @IsString()
  secondaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateClientAddressDto)
  address?: UpdateClientAddressDto;
}
