import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  optionalBooleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class UpdateRentalDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    startDate: isoDateInput.nullish(),
    endDate: isoDateInput.nullish(),
    currency: z
      .preprocess(
        primitiveText,
        z.enum(['PEN', 'USD'], {
          error: 'El campo «moneda» no es una opción permitida.',
        }),
      )
      .nullish(),
    monthlyAmount: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «monto mensual» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «monto mensual» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    securityDeposit: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «depósito de garantía» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «depósito de garantía» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    paymentDueDay: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «día de pago» debe ser un número válido.',
          })
          .min(1, {
            error: 'El campo «día de pago» es menor que el mínimo permitido.',
          })
          .max(28, {
            error: 'El campo «día de pago» supera el máximo permitido.',
          }),
      )
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    status: z
      .preprocess(
        primitiveText,
        z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED'], {
          error: 'El campo «estado» no es una opción permitida.',
        }),
      )
      .nullish(),
    enableExpirationAlerts: optionalBooleanInput,
    enableCollectionAlerts: optionalBooleanInput,
    tenantIds: z.union([z.string(), z.array(z.string())]).nullish(),
  });

  @ApiPropertyOptional({
    description: 'Fecha de inicio (ISO)',
    example: '2025-01-01',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (ISO)',
    example: '2026-01-01',
  })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Moneda', enum: ['PEN', 'USD'] })
  currency?: string;

  @ApiPropertyOptional({ description: 'Monto mensual' })
  monthlyAmount?: number;

  @ApiPropertyOptional({ description: 'Depósito de garantía' })
  securityDeposit?: number | null;

  @ApiPropertyOptional({ description: 'Día de vencimiento de pago (1-28)' })
  paymentDueDay?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Estado',
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Alertas de vencimiento de contrato' })
  enableExpirationAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Alertas de cobranza' })
  enableCollectionAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de inquilinos del contrato',
    type: [String],
  })
  tenantIds?: string | string[];
}
