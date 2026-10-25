import { z } from 'zod';
import {
  booleanInput,
  isProvided,
  numericInput,
  optionalValue,
  primitiveText,
} from '../../validation/input-schemas';

export class ProduccionStageRowDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    id: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «id» debe ser un texto.' }),
      ),
    ),
    stageKey: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «stageKey» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «stageKey» es obligatorio.' }),
    ),
    label: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etiqueta» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «etiqueta» es obligatorio.' }),
    ),
    sortOrder: numericInput.refine(isProvided, {
      error: 'El campo «orden» es obligatorio.',
    }),
    isActive: booleanInput,
  });

  id?: string;

  stageKey!: string;

  label!: string;

  sortOrder!: number;

  isActive!: boolean;
}

export class ProduccionCatalogRowDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    id: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «id» debe ser un texto.' }),
      ),
    ),
    code: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «código» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «código» es obligatorio.' }),
    ),
    label: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «etiqueta» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «etiqueta» es obligatorio.' }),
    ),
    sortOrder: numericInput.refine(isProvided, {
      error: 'El campo «orden» es obligatorio.',
    }),
    isActive: booleanInput,
  });

  id?: string;

  code!: string;

  label!: string;

  sortOrder!: number;

  isActive!: boolean;
}

export class ProduccionNumberingDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    prefix: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «prefijo» debe ser un texto.' }),
      ),
    ),
    lastNumber: optionalValue(numericInput),
    padLength: optionalValue(numericInput),
    includeYear: optionalValue(booleanInput),
  });

  prefix?: string;

  lastNumber?: number;

  padLength?: number;

  includeYear?: boolean;
}

export class ProduccionUnitsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    units: z
      .array(
        z.lazy(() => ProduccionCatalogRowDto.schema),
        { error: 'El campo «unidades» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «unidades» es obligatorio.' }),
  });

  units!: ProduccionCatalogRowDto[];
}

export class ProductionStagesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    stages: z
      .array(
        z.lazy(() => ProduccionStageRowDto.schema),
        { error: 'El campo «etapas» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «etapas» es obligatorio.' }),
  });

  stages!: ProduccionStageRowDto[];
}

export class MaterialCategoriesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    categories: z
      .array(
        z.lazy(() => ProduccionCatalogRowDto.schema),
        { error: 'El campo «categorías» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «categorías» es obligatorio.' }),
  });

  categories!: ProduccionCatalogRowDto[];
}

export class FurnitureCategoriesDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    categories: z
      .array(
        z.lazy(() => ProduccionCatalogRowDto.schema),
        { error: 'El campo «categorías» debe ser una lista.' },
      )
      .refine(isProvided, { error: 'El campo «categorías» es obligatorio.' }),
  });

  categories!: ProduccionCatalogRowDto[];
}

export class ProduccionSettingsDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    igvPercent: optionalValue(numericInput),
    woodWastePercent: optionalValue(numericInput),
    quotationValidDays: optionalValue(numericInput),
  });

  igvPercent?: number;

  woodWastePercent?: number;

  quotationValidDays?: number;
}
