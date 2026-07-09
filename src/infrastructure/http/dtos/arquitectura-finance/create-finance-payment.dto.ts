import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateArquitecturaFinancePaymentDto {
  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @IsDateString()
  paidAt!: string;

  @ApiProperty({ example: 2500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Transferencia — adelanto' })
  @IsString()
  @MaxLength(2000)
  concept!: string;

  @ApiProperty({ enum: STATUSES })
  @IsString()
  @IsIn(STATUSES)
  status!: string;

  @ApiPropertyOptional({ enum: PAYMENT_TYPES, default: 'OTHER' })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_TYPES)
  paymentType?: string;

  @ApiPropertyOptional({ description: 'Cuota programada (opcional)' })
  @IsOptional()
  @IsUUID()
  scheduleItemId?: string | null;
}
