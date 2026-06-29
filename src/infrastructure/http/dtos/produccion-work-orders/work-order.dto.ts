import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WorkOrderLineDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  furnitureId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class CreateProduccionWorkOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStart?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ type: [WorkOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderLineDto)
  lines!: WorkOrderLineDto[];
}

export class UpdateProduccionWorkOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStart?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [WorkOrderLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderLineDto)
  lines?: WorkOrderLineDto[];
}

export class UpdateProduccionWorkOrderStageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignee?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  markDone?: boolean;
}

export class ConsumeWorkOrderMaterialDto {
  @ApiProperty()
  @IsString()
  materialId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class ConsumeProduccionWorkOrderMaterialsDto {
  @ApiProperty({ type: [ConsumeWorkOrderMaterialDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumeWorkOrderMaterialDto)
  items!: ConsumeWorkOrderMaterialDto[];
}
