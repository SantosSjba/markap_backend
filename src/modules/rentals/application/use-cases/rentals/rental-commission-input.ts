import { parseDateOnlyOrNull } from '../../../../../shared/domain/utils/peru-date.util';
import type {
  RentalCommissionPatch,
  RentalCommissionStatus,
} from '../../../domain/utils/rental-commission.util';

/** Cobro de la comisión tal como llega de la API (fechas AAAA-MM-DD; null las borra). */
export interface RentalCommissionInput {
  status?: RentalCommissionStatus;
  dueDate?: string | null;
  paidDate?: string | null;
}

export function toRentalCommissionPatch(
  input: RentalCommissionInput | undefined,
): RentalCommissionPatch | undefined {
  if (!input) return undefined;
  return {
    commissionStatus: input.status,
    commissionDueDate:
      input.dueDate !== undefined
        ? parseDateOnlyOrNull(input.dueDate)
        : undefined,
    commissionPaidDate:
      input.paidDate !== undefined
        ? parseDateOnlyOrNull(input.paidDate)
        : undefined,
  };
}
