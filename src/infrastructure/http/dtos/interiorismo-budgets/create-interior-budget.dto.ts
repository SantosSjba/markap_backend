import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInteriorBudgetDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiPropertyOptional({ description: 'Por defecto 1' })
  @IsOptional()
  @IsNumber()
  version?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty({
    description: 'DRAFT | SENT | APPROVED | REJECTED | SUPERSEDED',
    example: 'DRAFT',
  })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  defaultIgvPct?: number;

  @ApiPropertyOptional({
    description:
      'Jerarquía niveles → ambientes → categorías → ítems. Si se omite se crea esqueleto vacío.',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  levels?: unknown[];
}
