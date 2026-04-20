import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { PaymentMethod } from '@domain/repositories/payment.repository';

const PAYMENT_METHODS: PaymentMethod[] = [
  'CASH',
  'TRANSFER',
  'DEPOSIT',
  'YAPE',
  'PLIN',
  'CHECK',
  'OTHER',
];

/** Body de POST /payments/:id/register */
export class RegisterPaymentDto {
  @ApiProperty({ example: '2024-06-15', description: 'Fecha de pago (ISO date)' })
  @IsDateString()
  paidDate!: string;

  @ApiProperty({ example: 1200.5 })
  @Type(() => Number)
  @IsNumber()
  paidAmount!: number;

  @ApiProperty({ enum: PAYMENT_METHODS, example: 'TRANSFER' })
  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  referenceNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
