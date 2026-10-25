import { mapOperationError } from '../../../../shared/application/errors/map-operation-error';
import { PersistenceErrorPort } from '../../../../shared/application/ports/persistence-error.port';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import { parseDateOnly } from '../../../../shared/domain/utils/peru-date.util';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import { CONTABILIDAD_PERIOD_STATUS } from '../../domain/constants/contabilidad-period.defaults';
import {
  CONTABILIDAD_PAYABLE_ACCOUNT_CODE,
  CONTABILIDAD_PURCHASE_DOCUMENT_TYPE_LABELS,
  CONTABILIDAD_PURCHASE_STATUS_LABELS,
  CONTABILIDAD_PURCHASE_TAX_AFFECTATION_LABELS,
} from '../../domain/constants/contabilidad-purchases.defaults';
import { CONTABILIDAD_TREASURY_SOURCE_TYPE } from '../../domain/constants/contabilidad-treasury.defaults';
import type { ContabilidadAccountRepository } from '../../domain/repositories/contabilidad-account.repository';
import { CONTABILIDAD_ACCOUNT_REPOSITORY } from '../../domain/repositories/contabilidad-account.repository';
import type { ContabilidadConfigRepository } from '../../domain/repositories/contabilidad-config.repository';
import { CONTABILIDAD_CONFIG_REPOSITORY } from '../../domain/repositories/contabilidad-config.repository';
import type { ContabilidadPeriodRepository } from '../../domain/repositories/contabilidad-period.repository';
import { CONTABILIDAD_PERIOD_REPOSITORY } from '../../domain/repositories/contabilidad-period.repository';
import type {
  ContabilidadPurchasesRepository,
  CreatePurchaseCreditNoteInput,
  CreatePurchaseDebitNoteInput,
  CreatePurchaseInvoiceInput,
  CreatePurchasePaymentInput,
  CreateSupplierInput,
  ListPurchaseCreditNotesFilters,
  ListPurchaseDebitNotesFilters,
  ListPurchaseInvoicesFilters,
  ListPurchasePaymentsFilters,
  ListSuppliersFilters,
  UpdateSupplierInput,
} from '../../domain/repositories/contabilidad-purchases.repository';
import { CONTABILIDAD_PURCHASES_REPOSITORY } from '../../domain/repositories/contabilidad-purchases.repository';
import type { ContabilidadTreasuryRepository } from '../../domain/repositories/contabilidad-treasury.repository';
import { CONTABILIDAD_TREASURY_REPOSITORY } from '../../domain/repositories/contabilidad-treasury.repository';
import { parsePenAmount } from '../../domain/utils/contabilidad-journal-amounts';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException(
      'Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).',
    );
  }
}

function assertRuc(ruc: string) {
  const clean = ruc.trim();
  if (!/^\d{11}$/.test(clean)) {
    throw new BadRequestException('RUC debe tener 11 dígitos.');
  }
}

@Injectable()
export class ContabilidadPurchasesOperationsService {
  constructor(
    private readonly persistenceErrors: PersistenceErrorPort,

    @Inject(CONTABILIDAD_PURCHASES_REPOSITORY)
    private readonly purchases: ContabilidadPurchasesRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(CONTABILIDAD_ACCOUNT_REPOSITORY)
    private readonly accounts: ContabilidadAccountRepository,
    @Inject(CONTABILIDAD_CONFIG_REPOSITORY)
    private readonly config: ContabilidadConfigRepository,
    @Inject(CONTABILIDAD_TREASURY_REPOSITORY)
    private readonly treasury: ContabilidadTreasuryRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(
    applicationSlug?: string,
  ): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app)
      throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  private async assertOpenPeriod(applicationId: string, periodId: string) {
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period)
      throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable está cerrado.');
    }
    return period;
  }

  private assertEntryDateInPeriod(
    entryDate: string,
    year: number,
    month: number,
  ) {
    const date = parseDateOnly(entryDate);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Fecha no válida.');
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) {
      throw new BadRequestException(
        'La fecha debe pertenecer al periodo seleccionado.',
      );
    }
  }

  private async getIgvPercent(applicationId: string): Promise<number> {
    const settings = await this.config.getSettings(applicationId);
    return Number(settings.igvPercent) || 18;
  }

  async listSuppliers(
    applicationSlug: string | undefined,
    filters: ListSuppliersFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const suppliers = await this.purchases.listSuppliers(
      applicationId,
      filters,
    );
    return { suppliers };
  }

  async createSupplier(
    applicationSlug: string | undefined,
    body: CreateSupplierInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    assertRuc(body.ruc);
    if (!body.businessName?.trim())
      throw new BadRequestException('Razón social obligatoria.');
    try {
      return await this.purchases.createSupplier(applicationId, {
        ...body,
        ruc: body.ruc.trim(),
        businessName: body.businessName.trim(),
      });
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async updateSupplier(
    applicationSlug: string | undefined,
    id: string,
    body: UpdateSupplierInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.purchases.findSupplierById(applicationId, id);
    if (!existing)
      throw new EntityNotFoundException('ContabilidadSupplier', id);
    try {
      return await this.purchases.updateSupplier(applicationId, id, body);
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async listInvoices(
    applicationSlug: string | undefined,
    filters: ListPurchaseInvoicesFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const invoices = await this.purchases.listInvoices(applicationId, filters);
    return {
      invoices,
      statusLabels: CONTABILIDAD_PURCHASE_STATUS_LABELS,
      taxAffectationLabels: CONTABILIDAD_PURCHASE_TAX_AFFECTATION_LABELS,
      documentTypeLabels: CONTABILIDAD_PURCHASE_DOCUMENT_TYPE_LABELS,
    };
  }

  async getInvoice(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const invoice = await this.purchases.findInvoiceById(applicationId, id);
    if (!invoice)
      throw new EntityNotFoundException('ContabilidadPurchaseInvoice', id);
    return invoice;
  }

  async createInvoice(
    applicationSlug: string | undefined,
    body: CreatePurchaseInvoiceInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.issueDate, period.year, period.month);

    if (!body.series?.trim() || !body.number?.trim()) {
      throw new BadRequestException('Serie y número son obligatorios.');
    }
    const base = parsePenAmount(body.taxableBase);
    if (Number.isNaN(base) || base <= 0) {
      throw new BadRequestException('Base imponible debe ser mayor a cero.');
    }

    const expense = await this.accounts.findById(
      applicationId,
      body.expenseAccountId,
    );
    if (!expense?.isActive || !expense.isMovement) {
      throw new BadRequestException('Cuenta de gasto/compra no válida.');
    }

    const detraccion = parsePenAmount(body.detraccionAmount ?? 0);
    if (detraccion < 0)
      throw new BadRequestException('Detracción no puede ser negativa.');

    const igvPercent = await this.getIgvPercent(applicationId);

    try {
      return await this.purchases.createInvoiceWithJournal(
        applicationId,
        body,
        igvPercent,
        userId,
      );
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async cancelInvoice(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.purchases.cancelInvoice(applicationId, id);
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async listCreditNotes(
    applicationSlug: string | undefined,
    filters: ListPurchaseCreditNotesFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const creditNotes = await this.purchases.listCreditNotes(
      applicationId,
      filters,
    );
    return { creditNotes };
  }

  async createCreditNote(
    applicationSlug: string | undefined,
    body: CreatePurchaseCreditNoteInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.issueDate, period.year, period.month);

    if (!body.series?.trim() || !body.number?.trim()) {
      throw new BadRequestException('Serie y número son obligatorios.');
    }
    const base = parsePenAmount(body.taxableBase);
    if (Number.isNaN(base) || base <= 0) {
      throw new BadRequestException('Base imponible debe ser mayor a cero.');
    }

    const igvPercent = await this.getIgvPercent(applicationId);

    try {
      return await this.purchases.createCreditNoteWithJournal(
        applicationId,
        body,
        igvPercent,
        userId,
      );
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async listDebitNotes(
    applicationSlug: string | undefined,
    filters: ListPurchaseDebitNotesFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const debitNotes = await this.purchases.listDebitNotes(
      applicationId,
      filters,
    );
    return { debitNotes };
  }

  async createDebitNote(
    applicationSlug: string | undefined,
    body: CreatePurchaseDebitNoteInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.issueDate, period.year, period.month);

    if (!body.series?.trim() || !body.number?.trim()) {
      throw new BadRequestException('Serie y número son obligatorios.');
    }
    const base = parsePenAmount(body.taxableBase);
    if (Number.isNaN(base) || base <= 0) {
      throw new BadRequestException('Base imponible debe ser mayor a cero.');
    }

    const igvPercent = await this.getIgvPercent(applicationId);

    try {
      return await this.purchases.createDebitNoteWithJournal(
        applicationId,
        body,
        igvPercent,
        userId,
      );
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }

  async listPayments(
    applicationSlug: string | undefined,
    filters: ListPurchasePaymentsFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const payments = await this.purchases.listPayments(applicationId, filters);
    return { payments };
  }

  async createPayment(
    applicationSlug: string | undefined,
    body: CreatePurchasePaymentInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    await this.treasury.ensureDefaults(applicationId);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.paymentDate, period.year, period.month);

    const amount = parsePenAmount(body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Importe debe ser mayor a cero.');
    }
    if (!body.description?.trim())
      throw new BadRequestException('La glosa es obligatoria.');

    if (
      body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH &&
      !body.cashBoxId
    ) {
      throw new BadRequestException('Seleccione una caja.');
    }
    if (
      body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK &&
      !body.bankAccountId
    ) {
      throw new BadRequestException('Seleccione una cuenta bancaria.');
    }

    const payable = await this.accounts.findByCode(
      applicationId,
      CONTABILIDAD_PAYABLE_ACCOUNT_CODE,
    );
    if (!payable?.isActive || !payable.isMovement) {
      throw new BadRequestException(
        'Cuenta 421 no disponible en el plan de cuentas.',
      );
    }

    try {
      return await this.purchases.createPaymentWithTreasury(
        applicationId,
        body,
        payable.id,
        userId,
      );
    } catch (error) {
      mapOperationError(error, this.persistenceErrors);
    }
  }
}
