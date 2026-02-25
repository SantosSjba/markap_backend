import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Tipo de agente', enum: ['INTERNAL', 'EXTERNAL'] })
  @IsOptional()
  @IsEnum(['INTERNAL', 'EXTERNAL'])
  type?: 'INTERNAL' | 'EXTERNAL';

  @ApiPropertyOptional({ description: 'ID del usuario (si type INTERNAL)' })
  @IsOptional()
  @IsString()
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  fullName?: string;

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

  @ApiPropertyOptional({ description: 'Activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
