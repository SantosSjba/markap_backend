import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  IsDateOnly,
  IsNumeric,
  KeepRaw,
  OptionalValue,
} from '@common/decorators/validation.decorators';

export class CommissionDeductibleDto {
  @IsString()
  @IsNotEmpty()
  deductibleType!: string;

  @OptionalValue()
  @IsString()
  description?: string | null;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  amount!: number;
}

export class CommissionPaymentPartDto {
  @OptionalValue()
  @IsString()
  label?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  amount?: number | null;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  percentOfNet?: number | null;

  @OptionalValue()
  @IsDateOnly()
  dueDate?: string | null;
}

export class ProcessCommissionDto {
  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsIn(['PERCENT', 'FIXED'])
  @IsNotEmpty()
  calculationType!: 'PERCENT' | 'FIXED';

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  percent?: number | null;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  fixedAmount?: number | null;

  @OptionalValue()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionPaymentPartDto)
  paymentParts?: CommissionPaymentPartDto[];

  @OptionalValue()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionDeductibleDto)
  deductibles?: CommissionDeductibleDto[];
}

export class CreateSaleClosingDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @OptionalValue()
  @IsString()
  saleProcessId?: string | null;

  @OptionalValue()
  @IsString()
  saleSeparationId?: string | null;

  @OptionalValue()
  @IsString()
  agentId?: string | null;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  finalPrice!: number;

  @IsString()
  @IsNotEmpty()
  paymentType!: string;

  @OptionalValue()
  @IsString()
  notes?: string | null;

  @OptionalValue()
  @IsString()
  commissionAgentId?: string | null;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  commissionAmount?: number;

  @OptionalValue()
  @KeepRaw()
  @IsNumeric()
  commissionPercent?: number | null;

  @OptionalValue()
  @KeepRaw()
  @IsBoolean()
  commissionAutoFromProfile?: boolean;
}

export class UpdateSaleSeparationDto {
  @OptionalValue()
  @IsIn(['ACTIVE', 'EXPIRED', 'CLOSED'])
  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';

  @OptionalValue()
  @IsString()
  notes?: string | null;

  @OptionalValue()
  @IsString()
  expiresAt?: string | null;
}

export class CreateSaleSeparationDto {
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @OptionalValue()
  @IsString()
  saleProcessId?: string | null;

  @KeepRaw()
  @IsNumeric()
  @IsNotEmpty()
  amount!: number;

  @OptionalValue()
  @IsString()
  currency?: string;

  @IsDateOnly()
  @IsNotEmpty()
  separationDate!: string;

  @OptionalValue()
  @IsString()
  expiresAt?: string | null;

  @OptionalValue()
  @IsString()
  notes?: string | null;
}

export class AddSaleProcessReminderDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  dueAt!: string;
}

export class AddSaleProcessActivityDto {
  @IsString()
  @IsNotEmpty()
  activityType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @OptionalValue()
  @IsString()
  description?: string | null;

  @OptionalValue()
  @IsString()
  scheduledAt?: string | null;

  @OptionalValue()
  @IsString()
  completedAt?: string | null;
}

export class AddSaleProcessNoteDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @OptionalValue()
  @IsString()
  createdBy?: string | null;
}

export class UpdateSaleProcessDto {
  @OptionalValue()
  @IsString()
  pipelineStage?: string;

  @OptionalValue()
  @IsIn(['ACTIVE', 'WON', 'LOST'])
  status?: 'ACTIVE' | 'WON' | 'LOST';

  @OptionalValue()
  @IsString()
  agentId?: string | null;

  @OptionalValue()
  @IsString()
  title?: string | null;

  @OptionalValue()
  @IsString()
  financingChannelId?: string | null;

  @OptionalValue()
  @IsString()
  lostReason?: string | null;
}

export class CreateSaleProcessDto {
  @IsString()
  @IsNotEmpty()
  buyerClientId!: string;

  @OptionalValue()
  @IsArray()
  @IsString({ each: true })
  buyerClientIds?: string[];

  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @OptionalValue()
  @IsArray()
  @IsString({ each: true })
  ownerClientIds?: string[];

  @OptionalValue()
  @IsString()
  agentId?: string | null;

  @OptionalValue()
  @IsString()
  title?: string | null;

  @OptionalValue()
  @IsString()
  pipelineStage?: string;

  @OptionalValue()
  @IsString()
  financingChannelId?: string | null;

  @OptionalValue()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessCommissionDto)
  commissions?: ProcessCommissionDto[];
}
