import { z } from 'zod';
import {
  booleanInput,
  dateOnlyInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CommissionDeductibleDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    deductibleType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «deductibleType» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «deductibleType» es obligatorio.',
        }),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
    amount: numericInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
  });

  deductibleType!: string;

  description?: string | null;

  amount!: number;
}

export class CommissionPaymentPartDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    label: optionalValue(
      z.string({ error: 'El campo «etiqueta» debe ser un texto.' }),
    ),
    amount: optionalValue(numericInput),
    percentOfNet: optionalValue(numericInput),
    dueDate: optionalValue(dateOnlyInput),
  });

  label?: string | null;

  amount?: number | null;

  percentOfNet?: number | null;

  dueDate?: string | null;
}

export class ProcessCommissionDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    agentId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «agente» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «agente» es obligatorio.' }),
    ),
    calculationType: z
      .enum(['PERCENT', 'FIXED'], {
        error: 'El campo «calculationType» no es una opción permitida.',
      })
      .refine(isProvided, {
        error: 'El campo «calculationType» es obligatorio.',
      }),
    percent: optionalValue(numericInput),
    fixedAmount: optionalValue(numericInput),
    currency: optionalValue(
      z.string({ error: 'El campo «moneda» debe ser un texto.' }),
    ),
    paymentParts: optionalValue(
      z.array(
        z.lazy(() => CommissionPaymentPartDto.schema),
        { error: 'El campo «paymentParts» debe ser una lista.' },
      ),
    ),
    deductibles: optionalValue(
      z.array(
        z.lazy(() => CommissionDeductibleDto.schema),
        { error: 'El campo «deductibles» debe ser una lista.' },
      ),
    ),
  });

  agentId!: string;

  calculationType!: 'PERCENT' | 'FIXED';

  percent?: number | null;

  fixedAmount?: number | null;

  /** Moneda del monto fijo; en % se usa la del precio del inmueble */
  currency?: string | null;

  paymentParts?: CommissionPaymentPartDto[];

  deductibles?: CommissionDeductibleDto[];
}

export class CreateSaleClosingDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    saleProcessId: optionalValue(
      z.string({ error: 'El campo «proceso de venta» debe ser un texto.' }),
    ),
    saleSeparationId: optionalValue(
      z.string({ error: 'El campo «saleSeparationId» debe ser un texto.' }),
    ),
    agentId: optionalValue(
      z.string({ error: 'El campo «agente» debe ser un texto.' }),
    ),
    finalPrice: numericInput.refine(isProvided, {
      error: 'El campo «precio final» es obligatorio.',
    }),
    paymentType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «tipo de pago» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «tipo de pago» es obligatorio.',
        }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
    commissionAgentId: optionalValue(
      z.string({ error: 'El campo «commissionAgentId» debe ser un texto.' }),
    ),
    commissionAmount: optionalValue(numericInput),
    commissionPercent: optionalValue(numericInput),
    commissionAutoFromProfile: optionalValue(booleanInput),
  });

  propertyId!: string;

  buyerClientId!: string;

  saleProcessId?: string | null;

  saleSeparationId?: string | null;

  agentId?: string | null;

  finalPrice!: number;

  paymentType!: string;

  notes?: string | null;

  commissionAgentId?: string | null;

  commissionAmount?: number;

  commissionPercent?: number | null;

  commissionAutoFromProfile?: boolean;
}

export class UpdateSaleSeparationDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    status: optionalValue(
      z.enum(['ACTIVE', 'EXPIRED', 'CLOSED'], {
        error: 'El campo «estado» no es una opción permitida.',
      }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
    expiresAt: optionalValue(
      z.string({ error: 'El campo «expiresAt» debe ser un texto.' }),
    ),
  });

  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';

  notes?: string | null;

  expiresAt?: string | null;
}

export class CreateSaleSeparationDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    saleProcessId: optionalValue(
      z.string({ error: 'El campo «proceso de venta» debe ser un texto.' }),
    ),
    amount: numericInput.refine(isProvided, {
      error: 'El campo «importe» es obligatorio.',
    }),
    currency: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «moneda» debe ser un texto.' }),
      ),
    ),
    separationDate: dateOnlyInput.refine(isProvided, {
      error: 'El campo «separationDate» es obligatorio.',
    }),
    expiresAt: optionalValue(
      z.string({ error: 'El campo «expiresAt» debe ser un texto.' }),
    ),
    notes: optionalValue(
      z.string({ error: 'El campo «notas» debe ser un texto.' }),
    ),
  });

  propertyId!: string;

  buyerClientId!: string;

  saleProcessId?: string | null;

  amount!: number;

  currency?: string;

  separationDate!: string;

  expiresAt?: string | null;

  notes?: string | null;
}

export class AddSaleProcessReminderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «título» es obligatorio.' }),
    ),
    dueAt: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «fecha límite» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «fecha límite» es obligatorio.',
        }),
    ),
  });

  title!: string;

  dueAt!: string;
}

export class AddSaleProcessActivityDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    activityType: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «activityType» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «activityType» es obligatorio.',
        }),
    ),
    title: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «título» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «título» es obligatorio.' }),
    ),
    description: optionalValue(
      z.string({ error: 'El campo «descripción» debe ser un texto.' }),
    ),
    scheduledAt: optionalValue(
      z.string({ error: 'El campo «scheduledAt» debe ser un texto.' }),
    ),
    completedAt: optionalValue(
      z.string({ error: 'El campo «completedAt» debe ser un texto.' }),
    ),
  });

  activityType!: string;

  title!: string;

  description?: string | null;

  scheduledAt?: string | null;

  completedAt?: string | null;
}

export class AddSaleProcessNoteDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    text: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «texto» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «texto» es obligatorio.' }),
    ),
    createdBy: optionalValue(
      z.string({ error: 'El campo «createdBy» debe ser un texto.' }),
    ),
  });

  text!: string;

  createdBy?: string | null;
}

export class UpdateSaleProcessDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    pipelineStage: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «pipelineStage» debe ser un texto.' }),
      ),
    ),
    status: optionalValue(
      z.enum(['ACTIVE', 'WON', 'LOST'], {
        error: 'El campo «estado» no es una opción permitida.',
      }),
    ),
    agentId: optionalValue(
      z.string({ error: 'El campo «agente» debe ser un texto.' }),
    ),
    title: optionalValue(
      z.string({ error: 'El campo «título» debe ser un texto.' }),
    ),
    financingChannelId: optionalValue(
      z.string({ error: 'El campo «financingChannelId» debe ser un texto.' }),
    ),
    lostReason: optionalValue(
      z.string({ error: 'El campo «lostReason» debe ser un texto.' }),
    ),
    stageChangeReason: optionalValue(
      z.string({
        error: 'El campo «motivo del cambio de etapa» debe ser un texto.',
      }),
    ),
  });

  pipelineStage?: string;

  /** Obligatorio para retroceder de etapa */
  stageChangeReason?: string | null;

  status?: 'ACTIVE' | 'WON' | 'LOST';

  agentId?: string | null;

  title?: string | null;

  financingChannelId?: string | null;

  lostReason?: string | null;
}

export class CreateSaleProcessDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    buyerClientId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «buyerClientId» debe ser un texto.' })
        .refine(isProvided, {
          error: 'El campo «buyerClientId» es obligatorio.',
        }),
    ),
    buyerClientIds: optionalValue(
      z.array(
        z.string({ error: 'El campo «buyerClientIds» debe ser un texto.' }),
        { error: 'El campo «buyerClientIds» debe ser una lista.' },
      ),
    ),
    propertyId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «propiedad» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «propiedad» es obligatorio.' }),
    ),
    ownerClientIds: optionalValue(
      z.array(
        z.string({ error: 'El campo «propietarios» debe ser un texto.' }),
        { error: 'El campo «propietarios» debe ser una lista.' },
      ),
    ),
    agentId: optionalValue(
      z.string({ error: 'El campo «agente» debe ser un texto.' }),
    ),
    title: optionalValue(
      z.string({ error: 'El campo «título» debe ser un texto.' }),
    ),
    pipelineStage: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «pipelineStage» debe ser un texto.' }),
      ),
    ),
    financingChannelId: optionalValue(
      z.string({ error: 'El campo «financingChannelId» debe ser un texto.' }),
    ),
    commissions: optionalValue(
      z.array(
        z.lazy(() => ProcessCommissionDto.schema),
        { error: 'El campo «commissions» debe ser una lista.' },
      ),
    ),
  });

  buyerClientId!: string;

  buyerClientIds?: string[];

  propertyId!: string;

  ownerClientIds?: string[];

  agentId?: string | null;

  title?: string | null;

  pipelineStage?: string;

  financingChannelId?: string | null;

  commissions?: ProcessCommissionDto[];
}
