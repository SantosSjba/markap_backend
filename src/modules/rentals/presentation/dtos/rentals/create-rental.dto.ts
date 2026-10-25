import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  isoDateInput,
  numericValue,
  optionalBooleanInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateRentalDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    applicationSlug: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «aplicación» debe ser un texto.' }),
      )
      .nullish(),
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .uuid({ error: 'El campo «propiedad» no es válido.' }),
    ),
    tenantId: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «inquilino» debe ser un texto.' })
          .uuid({ error: 'El campo «inquilino» no es válido.' }),
      )
      .nullish(),
    tenantIds: z.union([z.string(), z.array(z.string())]).nullish(),
    startDate: isoDateInput,
    endDate: isoDateInput,
    currency: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «moneda» debe ser un texto.' }),
    ),
    monthlyAmount: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «monto mensual» debe ser un número válido.',
        })
        .min(0, {
          error: 'El campo «monto mensual» es menor que el mínimo permitido.',
        }),
    ),
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
    paymentDueDay: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «día de pago» debe ser un número válido.' })
        .min(1, {
          error: 'El campo «día de pago» es menor que el mínimo permitido.',
        })
        .max(28, {
          error: 'El campo «día de pago» supera el máximo permitido.',
        }),
    ),
    notes: z
      .preprocess(
        primitiveText,
        z.string({ error: 'El campo «notas» debe ser un texto.' }),
      )
      .nullish(),
    enableExpirationAlerts: optionalBooleanInput,
    enableCollectionAlerts: optionalBooleanInput,
  });

  @ApiPropertyOptional({ default: 'alquileres' })
  applicationSlug?: string;

  @ApiProperty({ description: 'ID de la propiedad' })
  propertyId: string;

  @ApiPropertyOptional({ description: 'ID del inquilino principal (legacy)' })
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'IDs de inquilinos (JSON array o repetido en form-data)',
    type: [String],
  })
  tenantIds?: string | string[];

  @ApiProperty({ description: 'Fecha de inicio (ISO)', example: '2025-01-01' })
  startDate: string;

  @ApiProperty({ description: 'Fecha de fin (ISO)', example: '2026-01-01' })
  endDate: string;

  @ApiProperty({ description: 'Moneda', example: 'PEN', enum: ['PEN', 'USD'] })
  currency: string;

  @ApiProperty({ description: 'Monto mensual' })
  monthlyAmount: number;

  @ApiPropertyOptional({ description: 'Depósito de garantía' })
  securityDeposit?: number;

  @ApiProperty({ description: 'Día de vencimiento de pago (1-28)', default: 5 })
  paymentDueDay: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Alertas de vencimiento de contrato (30/60/90 días y registro)',
    default: true,
  })
  enableExpirationAlerts?: boolean;

  @ApiPropertyOptional({
    description: 'Alertas de cobranza (pagos pendientes y atrasados)',
    default: true,
  })
  enableCollectionAlerts?: boolean;
}
