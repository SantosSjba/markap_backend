import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateArquitecturaCalendarEventDto {
  @ApiPropertyOptional({ enum: TYPES })
  @IsOptional()
  @IsString()
  @IsIn(TYPES)
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  location?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
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
