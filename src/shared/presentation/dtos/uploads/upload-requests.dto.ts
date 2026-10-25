import { z } from 'zod';
import {
  isProvided,
  optionalValue,
  primitiveText,
} from '../../validation/input-schemas';

export class EvidenceUploadDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    taskId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «taskId» debe ser un texto.' }),
      ),
    ),
    kind: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo» debe ser un texto.' }),
      ),
    ),
    title: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «título» debe ser un texto.' }),
      ),
    ),
    capturedAt: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «fecha de captura» debe ser un texto.' }),
      ),
    ),
  });

  taskId?: string;

  kind?: string;

  title?: string;

  capturedAt?: string;
}

export class PropertyMediaDeleteDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    url: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «enlace» debe ser un texto.' })
        .refine(isProvided, { error: 'El campo «enlace» es obligatorio.' }),
    ),
    archivoId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «archivo» debe ser un texto.' }),
      ),
    ),
  });

  url!: string;

  archivoId?: string;
}

export class PropertyMediaUploadDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    kind: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo» debe ser un texto.' }),
      ),
    ),
  });

  kind?: string;
}

export class BudgetAttachmentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    lineItemId: optionalValue(
      z.string({ error: 'El campo «partida» debe ser un texto.' }),
    ),
    title: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «título» debe ser un texto.' }),
      ),
    ),
  });

  lineItemId?: string | null;

  title?: string;
}

export class ProjectDocumentUploadDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    projectId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «proyecto» debe ser un texto.' }),
      ),
    ),
    docType: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «docType» debe ser un texto.' }),
      ),
    ),
    title: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «título» debe ser un texto.' }),
      ),
    ),
  });

  projectId?: string;

  docType?: string;

  title?: string;
}

export class CatalogMaterialUploadDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    kind: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «tipo» debe ser un texto.' }),
      ),
    ),
    materialId: optionalValue(
      z.preprocess(
        primitiveText,
        z.string({ error: 'El campo «material» debe ser un texto.' }),
      ),
    ),
  });

  kind?: string;

  materialId?: string;
}
