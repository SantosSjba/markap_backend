import { z } from 'zod';
import {
  booleanInput,
  numericValue,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';

export class CreateProjectBudgetSectionDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «nombre» debe ser un texto.' })
        .max(200, { error: 'El campo «nombre» es demasiado largo.' }),
    ),
    sortOrder: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «orden» debe ser un número entero.' })
          .int({ error: 'El campo «orden» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «orden» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
  });

  name!: string;

  sortOrder?: number;
}

export class UpdateProjectBudgetSectionDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    name: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «nombre» debe ser un texto.' })
          .max(200, { error: 'El campo «nombre» es demasiado largo.' }),
      )
      .nullish(),
    sortOrder: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «orden» debe ser un número entero.' })
          .int({ error: 'El campo «orden» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «orden» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
  });

  name?: string;

  sortOrder?: number;
}

export class CreateProjectBudgetLineItemDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    sectionId: z
      .string({ error: 'El campo «sectionId» no es válido.' })
      .uuid({ error: 'El campo «sectionId» no es válido.' }),
    description: z.preprocess(
      primitiveText,
      z
        .string({ error: 'El campo «descripción» debe ser un texto.' })
        .max(2000, { error: 'El campo «descripción» es demasiado largo.' }),
    ),
    sortOrder: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «orden» debe ser un número entero.' })
          .int({ error: 'El campo «orden» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «orden» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    budgetedCost: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «costo presupuestado» debe ser un número válido.',
        })
        .min(0, {
          error:
            'El campo «costo presupuestado» es menor que el mínimo permitido.',
        }),
    ),
    hasIgv: booleanInput.nullish(),
    actualPurchaseCost: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «costo real de compra» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «costo real de compra» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    supplierName: z
      .string({ error: 'El campo «nombre del proveedor» debe ser un texto.' })
      .max(200, {
        error: 'El campo «nombre del proveedor» es demasiado largo.',
      })
      .nullish(),
    supplierId: z
      .string({ error: 'El campo «proveedor» no es válido.' })
      .uuid({ error: 'El campo «proveedor» no es válido.' })
      .nullish(),
  });

  sectionId!: string;

  description!: string;

  sortOrder?: number;

  budgetedCost!: number;

  hasIgv?: boolean;

  actualPurchaseCost?: number | null;

  supplierName?: string | null;

  supplierId?: string | null;
}

export class UpdateProjectBudgetLineItemDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    description: z
      .preprocess(
        primitiveText,
        z
          .string({ error: 'El campo «descripción» debe ser un texto.' })
          .max(2000, { error: 'El campo «descripción» es demasiado largo.' }),
      )
      .nullish(),
    sortOrder: z
      .preprocess(
        numericValue,
        z
          .number({ error: 'El campo «orden» debe ser un número entero.' })
          .int({ error: 'El campo «orden» debe ser un número entero.' })
          .min(0, {
            error: 'El campo «orden» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    budgetedCost: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «costo presupuestado» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «costo presupuestado» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    hasIgv: booleanInput.nullish(),
    actualPurchaseCost: z
      .preprocess(
        numericValue,
        z
          .number({
            error: 'El campo «costo real de compra» debe ser un número válido.',
          })
          .min(0, {
            error:
              'El campo «costo real de compra» es menor que el mínimo permitido.',
          }),
      )
      .nullish(),
    supplierName: z
      .string({ error: 'El campo «nombre del proveedor» debe ser un texto.' })
      .max(200, {
        error: 'El campo «nombre del proveedor» es demasiado largo.',
      })
      .nullish(),
    supplierId: z
      .string({ error: 'El campo «proveedor» no es válido.' })
      .uuid({ error: 'El campo «proveedor» no es válido.' })
      .nullish(),
  });

  description?: string;

  sortOrder?: number;

  budgetedCost?: number;

  hasIgv?: boolean;

  actualPurchaseCost?: number | null;

  supplierName?: string | null;

  supplierId?: string | null;
}

export class CreateLineItemSupplierPaymentDto {
  static readonly isZodDto = true;
  static readonly schema: z.ZodType = z.strictObject({
    lineItemId: z
      .string({ error: 'El campo «partida» no es válido.' })
      .uuid({ error: 'El campo «partida» no es válido.' }),
    paymentNumber: z.preprocess(
      numericValue,
      z
        .number({
          error: 'El campo «paymentNumber» debe ser un número entero.',
        })
        .int({ error: 'El campo «paymentNumber» debe ser un número entero.' })
        .min(1, {
          error: 'El campo «paymentNumber» es menor que el mínimo permitido.',
        }),
    ),
    amount: z.preprocess(
      numericValue,
      z
        .number({ error: 'El campo «importe» debe ser un número válido.' })
        .min(0, {
          error: 'El campo «importe» es menor que el mínimo permitido.',
        }),
    ),
    paidAt: z.preprocess(
      primitiveText,
      z.string({ error: 'El campo «fecha de pago» debe ser un texto.' }),
    ),
  });

  lineItemId!: string;

  paymentNumber!: number;

  amount!: number;

  paidAt!: string;
}
