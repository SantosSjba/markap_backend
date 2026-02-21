import { Injectable, Inject } from '@nestjs/common';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface CreateRentalInput {
  applicationSlug?: string;
  applicationId?: string;
  propertyId: string;
  tenantId: string;
  startDate: string; // ISO date
  endDate: string;
  currency: string;
  monthlyAmount: number;
  securityDeposit?: number | null;
  paymentDueDay: number;
  notes?: string | null;
}

@Injectable()
export class CreateRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: CreateRentalInput) {
    let applicationId = input.applicationId;
    if (!applicationId && input.applicationSlug) {
      const app = await this.applicationRepository.findBySlug(
        input.applicationSlug,
      );
      if (!app) {
        throw new EntityNotFoundException(
          'Application',
          input.applicationSlug,
        );
      }
      applicationId = app.id;
    }
    if (!applicationId) {
      throw new Error('applicationId or applicationSlug is required');
    }
    return this.rentalRepository.create({
      applicationId,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      currency: input.currency,
      monthlyAmount: Number(input.monthlyAmount),
      securityDeposit:
        input.securityDeposit != null
          ? Number(input.securityDeposit)
          : null,
      paymentDueDay: Number(input.paymentDueDay),
      notes: input.notes?.trim() || null,
    });
  }
}
