import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;
const PAYMENT_TYPES = ['ABONO', 'PAGO_FINAL', 'SALDO', 'OTHER'] as const;

export class UpdateInteriorFinancePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  concept?: string;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: PAYMENT_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_TYPES)
  paymentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scheduleItemId?: string | null;
}
