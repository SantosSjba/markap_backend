import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import {
  booleanInput,
  isoDateInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class WorkOrderLineDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    furnitureId: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «mueble» debe ser un texto.' })
        .min(1, { error: 'El campo «mueble» es demasiado corto.' }),
    ),
    quantity: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «cantidad» debe ser un número válido.' })
          .min(0.0001, {
            error: 'El campo «cantidad» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  furnitureId!: string;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class CreateProduccionWorkOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientId: z
      .string({ error: 'El campo «cliente» debe ser un texto.' })
      .nullish(),
    priority: z
      .enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        error: 'El campo «prioridad» no es una opción permitida.',
      })
      .nullish(),
    assignedTo: z
      .string({ error: 'El campo «responsable» debe ser un texto.' })
      .nullish(),
    scheduledStart: isoDateInput.nullish(),
    scheduledEnd: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z.array(
      z.lazy(() => WorkOrderLineDto.schema),
      { error: 'El campo «líneas» debe ser una lista.' },
    ),
  });

  @ApiPropertyOptional()
  clientId?: string | null;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  assignedTo?: string | null;

  @ApiPropertyOptional()
  scheduledStart?: string | null;

  @ApiPropertyOptional()
  scheduledEnd?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: [WorkOrderLineDto] })
  lines!: WorkOrderLineDto[];
}

export class UpdateProduccionWorkOrderDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    clientId: z
      .string({ error: 'El campo «cliente» debe ser un texto.' })
      .nullish(),
    priority: z
      .enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        error: 'El campo «prioridad» no es una opción permitida.',
      })
      .nullish(),
    assignedTo: z
      .string({ error: 'El campo «responsable» debe ser un texto.' })
      .nullish(),
    scheduledStart: isoDateInput.nullish(),
    scheduledEnd: isoDateInput.nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    lines: z
      .array(
        z.lazy(() => WorkOrderLineDto.schema),
        { error: 'El campo «líneas» debe ser una lista.' },
      )
      .nullish(),
  });

  @ApiPropertyOptional()
  clientId?: string | null;

  @ApiPropertyOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  assignedTo?: string | null;

  @ApiPropertyOptional()
  scheduledStart?: string | null;

  @ApiPropertyOptional()
  scheduledEnd?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: [WorkOrderLineDto] })
  lines?: WorkOrderLineDto[];
}

export class UpdateProduccionWorkOrderStageDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    assignee: z
      .string({ error: 'El campo «responsable» debe ser un texto.' })
      .nullish(),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
    markDone: booleanInput.nullish(),
  });

  @ApiPropertyOptional()
  assignee?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  markDone?: boolean;
}

export class ConsumeWorkOrderMaterialDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    materialId: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «material» debe ser un texto.' }),
    ),
    quantity: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «cantidad» debe ser un número válido.' })
        .min(0.0001, {
          error: 'El campo «cantidad» es menor que el mínimo permitido.',
        }),
    ),
    notes: z.string({ error: 'El campo «notas» debe ser un texto.' }).nullish(),
  });

  @ApiProperty()
  materialId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class ConsumeProduccionWorkOrderMaterialsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    items: z.array(
      z.lazy(() => ConsumeWorkOrderMaterialDto.schema),
      { error: 'El campo «items» debe ser una lista.' },
    ),
  });

  @ApiProperty({ type: [ConsumeWorkOrderMaterialDto] })
  items!: ConsumeWorkOrderMaterialDto[];
}
