import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { parseOptionalBoolean } from '@common/utils/parse-boolean.util';

export class UpdateRentalDto {
  @ApiPropertyOptional({ description: 'Fecha de inicio (ISO)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (ISO)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Moneda', enum: ['PEN', 'USD'] })
  @IsOptional()
  @IsString()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Monto mensual' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyAmount?: number;

  @ApiPropertyOptional({ description: 'Depósito de garantía' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  securityDeposit?: number | null;

  @ApiPropertyOptional({ description: 'Día de vencimiento de pago (1-28)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(28)
  paymentDueDay?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Estado', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Alertas de vencimiento de contrato' })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  enableExpirationAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Alertas de cobranza' })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  enableCollectionAlerts?: boolean;
}
