import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { RentalData, UpdateRentalData } from '../../repositories/rental.repository';
import { EntityNotFoundException } from '../../exceptions';

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
}

@Injectable()
export class UpdateRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(input: UpdateRentalInput): Promise<RentalData> {
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
    return this.rentalRepository.update(input.id, data);
  }
}
