import { Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertActiveCurrency } from '../../../../../shared/application/validation/currency.validator';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import { parseDateOnly } from '../../../../../shared/domain/utils/peru-date.util';
import { Money } from '../../../../../shared/domain/value-objects/money.value-object';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import type { RentalRepository } from '../../../domain/repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../../domain/repositories/rental.repository';
import {
  toRentalCommissionPatch,
  type RentalCommissionInput,
} from './rental-commission-input';

export interface CreateRentalInput {
  applicationSlug?: string;
  applicationId?: string;
  propertyId: string;
  tenantIds: string[];
  startDate: string; // ISO date
  endDate: string;
  currency: string;
  monthlyAmount: number;
  securityDeposit?: number | null;
  paymentDueDay: number;
  notes?: string | null;
  enableExpirationAlerts?: boolean;
  enableCollectionAlerts?: boolean;
  commission?: RentalCommissionInput;
}

@Injectable()
export class CreateRentalUseCase {
  constructor(
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(input: CreateRentalInput) {
    let applicationId = input.applicationId;
    if (!applicationId && input.applicationSlug) {
      const app = await this.applicationRepository.findBySlug(
        input.applicationSlug,
      );
      if (!app) {
        throw new EntityNotFoundException('Application', input.applicationSlug);
      }
      applicationId = app.id;
    }
    if (!applicationId) {
      throw new Error('Falta indicar la aplicación (applicationSlug).');
    }
    const currency = await assertActiveCurrency(
      this.references,
      input.currency,
    );
    const monthly = Money.create(Number(input.monthlyAmount), currency);
    const security =
      input.securityDeposit != null
        ? Money.create(Number(input.securityDeposit), monthly.currency)
        : null;
    const rental = await this.rentalRepository.create({
      applicationId,
      propertyId: input.propertyId,
      tenantIds: input.tenantIds,
      tenantId: input.tenantIds[0],
      startDate: parseDateOnly(input.startDate),
      endDate: parseDateOnly(input.endDate),
      currency: monthly.currency,
      monthlyAmount: monthly.amount,
      securityDeposit: security ? security.amount : null,
      paymentDueDay: Number(input.paymentDueDay),
      notes: input.notes?.trim() || null,
      enableExpirationAlerts: input.enableExpirationAlerts ?? true,
      enableCollectionAlerts: input.enableCollectionAlerts ?? true,
      commission: toRentalCommissionPatch(input.commission),
    });
    return rental;
  }
}
