import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { parseDateOnly } from '../../../../../shared/domain/utils/peru-date.util';
import type { Rental } from '../../../domain/entities/rental.entity';
import type {
  RentalRepository,
  UpdateRentalData,
} from '../../../domain/repositories/rental.repository';

import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';

export interface UpdateRentalInput {
  id: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  monthlyAmount?: number;
  securityDeposit?: number | null;
  paymentDueDay?: number;
  notes?: string | null;
  status?: string;
  enableExpirationAlerts?: boolean;
  enableCollectionAlerts?: boolean;
  tenantIds?: string[];
}

@Injectable()
export class UpdateRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(input: UpdateRentalInput): Promise<Rental> {
    const existing = await this.rentalRepository.findById(input.id);
    if (!existing) {
      throw new EntityNotFoundException('Rental', input.id);
    }
    const data: UpdateRentalData = {};
    if (input.startDate != null)
      data.startDate = parseDateOnly(input.startDate);
    if (input.endDate != null) data.endDate = parseDateOnly(input.endDate);
    if (input.currency != null) data.currency = input.currency;
    if (input.monthlyAmount != null) data.monthlyAmount = input.monthlyAmount;
    if (input.securityDeposit !== undefined)
      data.securityDeposit = input.securityDeposit;
    if (input.paymentDueDay != null) data.paymentDueDay = input.paymentDueDay;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.status != null) data.status = input.status;
    if (input.enableExpirationAlerts !== undefined) {
      data.enableExpirationAlerts = input.enableExpirationAlerts;
    }
    if (input.enableCollectionAlerts !== undefined) {
      data.enableCollectionAlerts = input.enableCollectionAlerts;
    }
    if (input.tenantIds !== undefined) {
      data.tenantIds = input.tenantIds;
    }
    return this.rentalRepository.update(input.id, data);
  }
}
