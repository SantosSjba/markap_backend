import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  ValidateIf,
  MaxLength,
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

  @ApiPropertyOptional({ description: 'Slug de la aplicación (ej: alquileres, ventas)' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

  @ApiProperty({
    description: 'Propietario, inquilino o comprador/leads (ventas)',
    enum: ['OWNER', 'TENANT', 'BUYER'],
  })
  @IsEnum(['OWNER', 'TENANT', 'BUYER'])
  clientType: 'OWNER' | 'TENANT' | 'BUYER';

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

  @ApiPropertyOptional({
    description: 'Embudo ventas (solo BUYER)',
    enum: ['PROSPECT', 'INTERESTED', 'CLIENT'],
  })
  @IsOptional()
  @IsEnum(['PROSPECT', 'INTERESTED', 'CLIENT'])
  salesStatus?: 'PROSPECT' | 'INTERESTED' | 'CLIENT';

  @ApiPropertyOptional({ description: 'Origen del lead (Facebook, web, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  leadOrigin?: string | null;

  @ApiPropertyOptional({ description: 'ID del asesor (agente) asignado' })
  @IsOptional()
  @IsString()
  assignedAgentId?: string | null;

  @ApiPropertyOptional({ description: 'Dirección (obligatoria para OWNER/TENANT)' })
  @ValidateIf((o) => o.clientType === 'OWNER' || o.clientType === 'TENANT')
  @IsObject()
  @ValidateNested()
  @Type(() => CreateClientAddressDto)
  address?: CreateClientAddressDto;
}
