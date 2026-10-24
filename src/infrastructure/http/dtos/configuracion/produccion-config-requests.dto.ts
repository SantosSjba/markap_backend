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

export class ProduccionStageRowDto {
  @OptionalValue()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  stageKey!: string;

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

export class ProduccionCatalogRowDto {
  @OptionalValue()
  @IsString()
  id?: string;

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

export class ProduccionNumberingDto {
  @OptionalValue()
  @IsString()
  prefix?: string;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  lastNumber?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  padLength?: number;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  includeYear?: boolean;
}

export class ProduccionUnitsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionCatalogRowDto)
  @IsNotEmpty()
  units!: ProduccionCatalogRowDto[];
}

export class ProductionStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionStageRowDto)
  @IsNotEmpty()
  stages!: ProduccionStageRowDto[];
}

export class MaterialCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionCatalogRowDto)
  @IsNotEmpty()
  categories!: ProduccionCatalogRowDto[];
}

export class FurnitureCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionCatalogRowDto)
  @IsNotEmpty()
  categories!: ProduccionCatalogRowDto[];
}

export class ProduccionSettingsDto {
  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  igvPercent?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  woodWastePercent?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  quotationValidDays?: number;
}
