import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProduccionStockMovementDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  materialId!: string;

  @ApiProperty({ enum: ['IN', 'OUT', 'ADJUST'] })
  @IsIn(['IN', 'OUT', 'ADJUST'])
  movementType!: 'IN' | 'OUT' | 'ADJUST';

  @ApiProperty({ description: 'IN/OUT: cantidad; ADJUST: stock final deseado' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
