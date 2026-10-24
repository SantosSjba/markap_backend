import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import {
  IsAmount,
  IsDateOnly,
  OptionalValue,
} from '@common/decorators/validation.decorators';
import type {
  ContabilidadJournalLineInput,
  CreateContabilidadJournalEntryInput,
  UpdateContabilidadJournalEntryInput,
} from '@domain/repositories/contabilidad-journal.repository';

export class ContabilidadJournalLineDto implements ContabilidadJournalLineInput {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @OptionalValue()
  @IsAmount()
  debit?: number | string;

  @OptionalValue()
  @IsAmount()
  credit?: number | string;

  @OptionalValue()
  @IsString()
  foreignCurrency?: string | null;

  @OptionalValue()
  @IsAmount()
  foreignAmount?: number | string | null;

  @OptionalValue()
  @IsAmount()
  exchangeRate?: number | string | null;

  @OptionalValue()
  @IsString()
  costCenterId?: string | null;

  @OptionalValue()
  @IsString()
  auxiliaryRuc?: string | null;

  @OptionalValue()
  @IsString()
  auxiliaryDoc?: string | null;

  @OptionalValue()
  @IsString()
  description?: string | null;
}

export class UpdateContabilidadJournalEntryDto implements UpdateContabilidadJournalEntryInput {
  @OptionalValue()
  @IsDateOnly()
  entryDate?: string;

  @OptionalValue()
  @IsString()
  description?: string;

  @OptionalValue()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContabilidadJournalLineDto)
  lines?: ContabilidadJournalLineInput[];
}

export class CreateContabilidadJournalEntryDto implements CreateContabilidadJournalEntryInput {
  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsDateOnly()
  @IsNotEmpty()
  entryDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContabilidadJournalLineDto)
  @IsNotEmpty()
  lines!: ContabilidadJournalLineInput[];
}
