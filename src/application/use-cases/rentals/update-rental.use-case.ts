import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import type { Rental, UpdateRentalData } from '@domain/repositories/rental.repository';
import { EntityNotFoundException } from '@domain/exceptions';

import { RENTAL_REPOSITORY } from '@common/constants/injection-tokens';

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
  enableAlerts?: boolean;
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
    if (input.startDate != null) data.startDate = new Date(input.startDate);
    if (input.endDate != null) data.endDate = new Date(input.endDate);
    if (input.currency != null) data.currency = input.currency;
    if (input.monthlyAmount != null) data.monthlyAmount = input.monthlyAmount;
    if (input.securityDeposit !== undefined) data.securityDeposit = input.securityDeposit;
    if (input.paymentDueDay != null) data.paymentDueDay = input.paymentDueDay;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.status != null) data.status = input.status;
    if (input.enableAlerts !== undefined) data.enableAlerts = input.enableAlerts;
    return this.rentalRepository.update(input.id, data);
  }
}
