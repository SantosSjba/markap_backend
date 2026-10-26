import { z } from 'zod';
import {
  isoDateInput,
  primitiveText,
} from '../../../../../shared/presentation/validation/input-schemas';
import { RENTAL_COMMISSION_STATUSES } from '../../../domain/utils/rental-commission.util';

/** Estado del cobro de la comisión (form-data o JSON). */
export const commissionStatusInput = z
  .preprocess(
    (value: unknown) => (value === '' ? undefined : primitiveText(value)),
    z.enum(RENTAL_COMMISSION_STATUSES, {
      error: 'El campo «estado de la comisión» no es una opción permitida.',
    }),
  )
  .optional();

/** Fecha opcional; vacío o null la borra. */
export const commissionDateInput = z.preprocess(
  (value: unknown) => (value === '' ? null : value),
  isoDateInput.nullish(),
);
