import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInteriorExecutionIncidentDto {
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsString()
  severity!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  @IsDateString()
  reportedAt!: string;
}
