import { IsBoolean, IsString } from 'class-validator';
import {
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';

export class PatchDocumentSeriesDto {
  @OptionalValue()
  @IsString()
  sunatSeries?: string;

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
  isActive?: boolean;
}

export class UpdateContabilidadSettingsDto {
  @OptionalValue()
  @IsString()
  taxRegime?: string;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isDetractionAgent?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isRetentionAgent?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isPerceptionAgent?: boolean;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  igvPercent?: number;

  @OptionalValue()
  @IsString()
  currencyCode?: string;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  fiscalYearStartMonth?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  amountDecimals?: number;
}

export class UpdateCompanyProfileDto {
  @OptionalValue()
  @IsString()
  ruc?: string;

  @OptionalValue()
  @IsString()
  legalName?: string;

  @OptionalValue()
  @IsString()
  tradeName?: string | null;

  @OptionalValue()
  @IsString()
  fiscalAddress?: string;

  @OptionalValue()
  @IsString()
  district?: string;

  @OptionalValue()
  @IsString()
  province?: string;

  @OptionalValue()
  @IsString()
  department?: string;

  @OptionalValue()
  @IsString()
  ubigeoCode?: string;
}
