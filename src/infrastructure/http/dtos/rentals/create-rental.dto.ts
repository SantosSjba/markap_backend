import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentalDto {
  @ApiPropertyOptional({ default: 'alquileres' })
  @IsOptional()
  @IsString()
  applicationSlug?: string;

  @ApiProperty({ description: 'ID de la propiedad' })
  @IsString()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ description: 'ID del inquilino (cliente tipo TENANT)' })
  @IsString()
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Fecha de inicio (ISO)', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin (ISO)', example: '2026-01-01' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Moneda', example: 'PEN', enum: ['PEN', 'USD'] })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Monto mensual' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyAmount: number;

  @ApiPropertyOptional({ description: 'Depósito de garantía' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ description: 'Día de vencimiento de pago (1-28)', default: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(28)
  paymentDueDay: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  notes?: string;
}
