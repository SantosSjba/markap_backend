import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type { VentasPipelineStageInput } from '@domain/repositories/ventas-config.repository';
import type { ArquitecturaProjectStageInput } from '@domain/repositories/arquitectura-config.repository';
import type { InteriorismoProjectStageInput } from '@domain/repositories/interiorismo-config.repository';

export class InteriorismoProjectStageDto implements InteriorismoProjectStageInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  sortOrder!: number;

  @KeepRaw()
  @IsBoolean()
  isActive!: boolean;
}

export class ArquitecturaProjectStageDto implements ArquitecturaProjectStageInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  sortOrder!: number;

  @KeepRaw()
  @IsBoolean()
  isActive!: boolean;
}

export class VentasPipelineStageDto implements VentasPipelineStageInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  sortOrder!: number;

  @KeepRaw()
  @IsBoolean()
  isActive!: boolean;
}

export class InteriorismoProjectStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteriorismoProjectStageDto)
  @IsNotEmpty()
  stages!: InteriorismoProjectStageInput[];
}

export class ArquitecturaProjectStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArquitecturaProjectStageDto)
  @IsNotEmpty()
  stages!: ArquitecturaProjectStageInput[];
}

export class ProjectNumberingDto {
  @OptionalValue()
  @IsString()
  prefix?: string;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  lastNumber?: number;
}

export class PipelineStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentasPipelineStageDto)
  @IsNotEmpty()
  stages!: VentasPipelineStageInput[];
}
