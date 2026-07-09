import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const TYPES = ['MEETING', 'VISIT', 'INSTALLATION', 'DEADLINE', 'TEAM_BLOCK'] as const;

export class CreateArquitecturaCalendarEventDto {
  @ApiProperty({ enum: TYPES })
  @IsString()
  @IsIn(TYPES)
  eventType!: string;

  @ApiProperty({ example: 'RevisiÃ³n avances con cliente' })
  @IsString()
  @MaxLength(500)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Av. Larco 123, Miraflores' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  location?: string | null;

  @ApiProperty({ example: '2026-05-20T15:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ description: 'Opcional; vacÃ­o = agenda general / equipo' })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim() !== '')
  @IsUUID()
  assignedAgentId?: string | null;
}
