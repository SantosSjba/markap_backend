import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

const VALUE_TYPES = ['PERCENT', 'FIXED'] as const;

export class UpsertRentalFinancialConfigDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    currency: z
      .preprocess(
        primitiveText,
        z.enum(['PEN', 'USD'], {
          error: 'El campo «moneda» no es una opción permitida.',
        }),
      )
      .nullish(),
    baseAmount: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «monto base» debe ser un número válido.' })
          .min(0, {
            error: 'El campo «monto base» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    expenseType: z
      .enum(VALUE_TYPES, {
        error: 'El campo «tipo de gasto» no es una opción permitida.',
      })
      .nullish(),
    expenseValue: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «expenseValue» debe ser un número válido.',
          })
          .min(0, {
            error: 'El campo «expenseValue» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    expenseDetail: z
      .string({ error: 'El campo «expenseDetail» debe ser un texto.' })
      .nullish(),
    taxType: z
      .enum(VALUE_TYPES, {
        error: 'El campo «taxType» no es una opción permitida.',
      })
      .nullish(),
    taxValue: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «taxValue» debe ser un número válido.' })
          .min(0, {
            error: 'El campo «taxValue» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    taxDetail: z
      .string({ error: 'El campo «taxDetail» debe ser un texto.' })
      .nullish(),
    externalAgentId: z
      .string({ error: 'El campo «externalAgentId» debe ser un texto.' })
      .uuid({ error: 'El campo «externalAgentId» no es válido.' })
      .nullish(),
    externalAgentType: z
      .enum(VALUE_TYPES, {
        error: 'El campo «externalAgentType» no es una opción permitida.',
      })
      .nullish(),
    externalAgentValue: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «externalAgentValue» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «externalAgentValue» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    externalAgentName: z
      .string({ error: 'El campo «agente externo» debe ser un texto.' })
      .nullish(),
    internalAgentId: z
      .string({ error: 'El campo «internalAgentId» debe ser un texto.' })
      .uuid({ error: 'El campo «internalAgentId» no es válido.' })
      .nullish(),
    internalAgentName: z
      .string({ error: 'El campo «internalAgentName» debe ser un texto.' })
      .nullish(),
    internalAgentType: z
      .enum(VALUE_TYPES, {
        error: 'El campo «internalAgentType» no es una opción permitida.',
      })
      .nullish(),
    internalAgentValue: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «internalAgentValue» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «internalAgentValue» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
  });

  @ApiPropertyOptional({ enum: ['PEN', 'USD'] })
  currency?: string;

  @ApiPropertyOptional({
    description:
      'Monto ingresado al concretar el alquiler (base para descuentos). Si no se indica, se usa el monto mensual del contrato.',
  })
  baseAmount?: number | null;

  @ApiPropertyOptional({
    description: 'Tipo de gasto',
    enum: ['PERCENT', 'FIXED'],
  })
  expenseType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor de gasto (% o monto fijo)' })
  expenseValue?: number;

  @ApiPropertyOptional({
    description: 'Detalle del gasto (ej. mantenimiento, comisión bancaria)',
  })
  expenseDetail?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo de impuesto',
    enum: ['PERCENT', 'FIXED'],
  })
  taxType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor de impuesto (% o monto fijo)' })
  taxValue?: number;

  @ApiPropertyOptional({
    description: 'Detalle del impuesto (ej. IGV, renta de 4ta)',
  })
  taxDetail?: string | null;

  @ApiPropertyOptional({
    description: 'ID del agente externo (tabla agents, type EXTERNAL)',
  })
  externalAgentId?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo de comisión agente externo',
    enum: ['PERCENT', 'FIXED'],
  })
  externalAgentType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor comisión agente externo' })
  externalAgentValue?: number;

  @ApiPropertyOptional({
    description: 'Nombre del agente externo (si no se usa externalAgentId)',
  })
  externalAgentName?: string | null;

  @ApiPropertyOptional({
    description: 'ID del agente interno (tabla agents, type INTERNAL)',
  })
  internalAgentId?: string | null;

  @ApiPropertyOptional({
    description: 'Nombre del agente interno (si no se usa internalAgentId)',
  })
  internalAgentName?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo de comisión agente interno',
    enum: ['PERCENT', 'FIXED'],
  })
  internalAgentType?: 'PERCENT' | 'FIXED';

  @ApiPropertyOptional({ description: 'Valor comisión agente interno' })
  internalAgentValue?: number;
}
