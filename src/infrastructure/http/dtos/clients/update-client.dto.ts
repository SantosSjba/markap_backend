import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  MaxLength,
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
    enum: ['OWNER', 'TENANT', 'BUYER'],
  })
  @IsOptional()
  @IsEnum(['OWNER', 'TENANT', 'BUYER'])
  clientType?: 'OWNER' | 'TENANT' | 'BUYER';

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

  @ApiPropertyOptional({
    description: 'Embudo ventas',
    enum: ['PROSPECT', 'INTERESTED', 'CLIENT'],
  })
  @IsOptional()
  @IsEnum(['PROSPECT', 'INTERESTED', 'CLIENT'])
  salesStatus?: 'PROSPECT' | 'INTERESTED' | 'CLIENT' | null;

  @ApiPropertyOptional({ description: 'Origen del lead' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadOrigin?: string | null;

  @ApiPropertyOptional({ description: 'Asesor asignado (id agente)' })
  @IsOptional()
  @IsString()
  assignedAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateClientAddressDto)
  address?: UpdateClientAddressDto;
}
