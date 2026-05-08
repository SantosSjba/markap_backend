import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateInteriorExecutionEvidenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskId?: string | null;

  @ApiProperty({ enum: ['PHOTO', 'DOCUMENT', 'OTHER'] })
  @IsString()
  kind!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: 'URL del archivo o imagen' })
  @IsString()
  @MinLength(1)
  fileUrl!: string;

  @ApiProperty({ example: '2026-05-08T12:00:00.000Z' })
  @IsDateString()
  capturedAt!: string;
}
