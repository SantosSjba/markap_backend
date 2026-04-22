import { Injectable, Inject } from '@nestjs/common';
import { APPLICATION_REPOSITORY, PROPERTY_REPOSITORY, RENTAL_REPOSITORY } from '@common/constants/injection-tokens';
import type { RentalRepository } from '@domain/repositories/rental.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { PropertyRepository } from '@domain/repositories/property.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { Money } from '@domain/value-objects';

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
  enableAlerts?: boolean;
}

@Injectable()
export class CreateRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
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
    const monthly = Money.create(Number(input.monthlyAmount), input.currency);
    const security =
      input.securityDeposit != null
        ? Money.create(Number(input.securityDeposit), monthly.currency)
        : null;
    const rental = await this.rentalRepository.create({
      applicationId,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      currency: monthly.currency,
      monthlyAmount: monthly.amount,
      securityDeposit: security ? security.amount : null,
      paymentDueDay: Number(input.paymentDueDay),
      notes: input.notes?.trim() || null,
      enableAlerts: input.enableAlerts ?? true,
    });
    await this.propertyRepository.update({
      id: input.propertyId,
      listingStatus: 'RENTED',
    });
    return rental;
  }
}
