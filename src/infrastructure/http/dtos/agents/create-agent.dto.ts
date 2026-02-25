import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateAgentDto {
  @ApiPropertyOptional({ description: 'ID de la aplicación' })
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Slug de la aplicación (ej: alquileres)' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

  @ApiProperty({
    description: 'Tipo de agente: Interno (usuario del sistema) o Externo (tercero)',
    enum: ['INTERNAL', 'EXTERNAL'],
  })
  @IsEnum(['INTERNAL', 'EXTERNAL'])
  type: 'INTERNAL' | 'EXTERNAL';

  @ApiPropertyOptional({
    description: 'ID del usuario (requerido si type es INTERNAL)',
  })
  @IsOptional()
  @IsString()
  userId?: string | null;

  @ApiProperty({
    description: 'Nombre completo (para EXTERNAL es obligatorio; para INTERNAL puede derivarse del usuario)',
  })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({ description: 'ID del tipo de documento' })
  @IsOptional()
  @IsString()
  documentTypeId?: string | null;

  @ApiPropertyOptional({ description: 'Número de documento' })
  @IsOptional()
  @IsString()
  documentNumber?: string | null;
}
