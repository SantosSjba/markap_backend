import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  CreateElectronicDocumentLogInput,
  CreateJournalTemplateInput,
  JournalTemplateLineInput,
  UpdateJournalTemplateInput,
  UpsertExchangeRateInput,
  UpsertIncomeTaxPeriodInput,
} from '@domain/repositories/contabilidad-extensions.repository';

export class JournalTemplateLineDto implements JournalTemplateLineInput {
  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  lineNumber!: number;

  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @OptionalValue()
  @IsAmount()
  defaultDebit?: number | string;

  @OptionalValue()
  @IsAmount()
  defaultCredit?: number | string;

  @OptionalValue()
  @IsString()
  costCenterId?: string | null;

  @OptionalValue()
  @IsString()
  description?: string | null;
}

export class UpsertIncomeTaxPeriodDto implements UpsertIncomeTaxPeriodInput {
  @OptionalValue()
  @IsAmount()
  deductibleAdjustments?: number | string;

  @OptionalValue()
  @IsAmount()
  nonDeductibleAdjustments?: number | string;

  @OptionalValue()
  @IsAmount()
  otherIncomeAdjustments?: number | string;

  @OptionalValue()
  @IsAmount()
  otherExpenseAdjustments?: number | string;

  @OptionalValue()
  @IsAmount()
  advancePaymentAmount?: number | string;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class CreateElectronicDocumentLogDto implements CreateElectronicDocumentLogInput {
  @OptionalValue()
  @IsString()
  periodId?: string | null;

  @IsString()
  @IsNotEmpty()
  documentKind!: string;

  @IsString()
  @IsNotEmpty()
  documentRef!: string;

  @OptionalValue()
  @IsString()
  sunatStatus?: string;

  @OptionalValue()
  @IsString()
  xmlHash?: string | null;

  @OptionalValue()
  @IsString()
  cdrReference?: string | null;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class UpdateJournalTemplateDto implements UpdateJournalTemplateInput {
  @OptionalValue()
  @IsString()
  name?: string;

  @OptionalValue()
  @IsString()
  description?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;

  @OptionalValue()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalTemplateLineDto)
  lines?: JournalTemplateLineInput[];
}

export class CreateJournalTemplateDto implements CreateJournalTemplateInput {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @OptionalValue()
  @IsString()
  description?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalTemplateLineDto)
  @IsNotEmpty()
  lines!: JournalTemplateLineInput[];
}

export class UpsertExchangeRateDto implements UpsertExchangeRateInput {
  @IsDateOnly()
  @IsNotEmpty()
  rateDate!: string;

  @IsString()
  @IsNotEmpty()
  currencyCode!: string;

  @IsAmount()
  @IsNotEmpty()
  buyRate!: number | string;

  @IsAmount()
  @IsNotEmpty()
  sellRate!: number | string;

  @OptionalValue()
  @IsString()
  source?: string | null;
}
