import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_ACCOUNT_REPOSITORY,
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
  CONTABILIDAD_SALES_REPOSITORY,
  CONTABILIDAD_TREASURY_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE,
  CONTABILIDAD_SALES_DOCUMENT_TYPE_LABELS,
  CONTABILIDAD_SALES_STATUS_LABELS,
  CONTABILIDAD_SALES_TAX_AFFECTATION_LABELS,
} from '@domain/constants/contabilidad-sales.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import { CONTABILIDAD_TREASURY_SOURCE_TYPE } from '@domain/constants/contabilidad-treasury.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadAccountRepository } from '@domain/repositories/contabilidad-account.repository';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import type {
  ContabilidadSalesRepository,
  CreateCustomerInput,
  CreateSalesCollectionInput,
  CreateSalesCreditNoteInput,
  CreateSalesDebitNoteInput,
  CreateSalesInvoiceInput,
  ListCustomersFilters,
  ListSalesCollectionsFilters,
  ListSalesCreditNotesFilters,
  ListSalesDebitNotesFilters,
  ListSalesInvoicesFilters,
  UpdateCustomerInput,
} from '@domain/repositories/contabilidad-sales.repository';
import type { ContabilidadTreasuryRepository } from '@domain/repositories/contabilidad-treasury.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { parsePenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { parseDateOnly } from '@domain/utils/peru-date.util';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

function mapRepoError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Operación no válida.';
  throw new BadRequestException(message);
}

function assertRuc(ruc: string) {
  const clean = ruc.trim();
  if (!/^\d{11}$/.test(clean)) {
    throw new BadRequestException('RUC/DNI debe tener 11 dígitos.');
  }
}

@Injectable()
export class ContabilidadSalesOperationsService {
  constructor(
    @Inject(CONTABILIDAD_SALES_REPOSITORY)
    private readonly sales: ContabilidadSalesRepository,
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

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  private async assertOpenPeriod(applicationId: string, periodId: string) {
    const period = await this.periods.findPeriodById(applicationId, periodId);
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable está cerrado.');
    }
    return period;
  }

  private assertEntryDateInPeriod(entryDate: string, year: number, month: number) {
    const date = parseDateOnly(entryDate);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Fecha no válida.');
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) {
      throw new BadRequestException('La fecha debe pertenecer al periodo seleccionado.');
    }
  }

  private async getIgvPercent(applicationId: string): Promise<number> {
    const settings = await this.config.getSettings(applicationId);
    return Number(settings.igvPercent) || 18;
  }

  async listCustomers(applicationSlug: string | undefined, filters: ListCustomersFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const customers = await this.sales.listCustomers(applicationId, filters);
    return { customers };
  }

  async createCustomer(applicationSlug: string | undefined, body: CreateCustomerInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    assertRuc(body.ruc);
    if (!body.businessName?.trim()) throw new BadRequestException('Razón social obligatoria.');
    try {
      return await this.sales.createCustomer(applicationId, {
        ...body,
        ruc: body.ruc.trim(),
        businessName: body.businessName.trim(),
      });
    } catch (error) {
      mapRepoError(error);
    }
  }

  async updateCustomer(applicationSlug: string | undefined, id: string, body: UpdateCustomerInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.sales.findCustomerById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadCustomer', id);
    try {
      return await this.sales.updateCustomer(applicationId, id, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listInvoices(applicationSlug: string | undefined, filters: ListSalesInvoicesFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const invoices = await this.sales.listInvoices(applicationId, filters);
    return {
      invoices,
      statusLabels: CONTABILIDAD_SALES_STATUS_LABELS,
      taxAffectationLabels: CONTABILIDAD_SALES_TAX_AFFECTATION_LABELS,
      documentTypeLabels: CONTABILIDAD_SALES_DOCUMENT_TYPE_LABELS,
    };
  }

  async getInvoice(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const invoice = await this.sales.findInvoiceById(applicationId, id);
    if (!invoice) throw new EntityNotFoundException('ContabilidadSalesInvoice', id);
    return invoice;
  }

  async createInvoice(
    applicationSlug: string | undefined,
    body: CreateSalesInvoiceInput,
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

    const income = await this.accounts.findById(applicationId, body.incomeAccountId);
    if (!income?.isActive || !income.isMovement) {
      throw new BadRequestException('Cuenta de ingreso no válida.');
    }

    const igvPercent = await this.getIgvPercent(applicationId);

    try {
      return await this.sales.createInvoiceWithJournal(applicationId, body, igvPercent, userId);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async cancelInvoice(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.sales.cancelInvoice(applicationId, id);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listCreditNotes(applicationSlug: string | undefined, filters: ListSalesCreditNotesFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const creditNotes = await this.sales.listCreditNotes(applicationId, filters);
    return { creditNotes };
  }

  async createCreditNote(
    applicationSlug: string | undefined,
    body: CreateSalesCreditNoteInput,
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
      return await this.sales.createCreditNoteWithJournal(applicationId, body, igvPercent, userId);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listDebitNotes(applicationSlug: string | undefined, filters: ListSalesDebitNotesFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const debitNotes = await this.sales.listDebitNotes(applicationId, filters);
    return { debitNotes };
  }

  async createDebitNote(
    applicationSlug: string | undefined,
    body: CreateSalesDebitNoteInput,
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
      return await this.sales.createDebitNoteWithJournal(applicationId, body, igvPercent, userId);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listCollections(applicationSlug: string | undefined, filters: ListSalesCollectionsFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const collections = await this.sales.listCollections(applicationId, filters);
    return { collections };
  }

  async createCollection(
    applicationSlug: string | undefined,
    body: CreateSalesCollectionInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    await this.treasury.ensureDefaults(applicationId);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.collectionDate, period.year, period.month);

    const amount = parsePenAmount(body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Importe debe ser mayor a cero.');
    }
    if (!body.description?.trim()) throw new BadRequestException('La glosa es obligatoria.');

    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.cashBoxId) {
      throw new BadRequestException('Seleccione una caja.');
    }
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.bankAccountId) {
      throw new BadRequestException('Seleccione una cuenta bancaria.');
    }

    const receivable = await this.accounts.findByCode(applicationId, CONTABILIDAD_RECEIVABLE_ACCOUNT_CODE);
    if (!receivable?.isActive || !receivable.isMovement) {
      throw new BadRequestException('Cuenta 1041 no disponible en el plan de cuentas.');
    }

    try {
      return await this.sales.createCollectionWithTreasury(
        applicationId,
        body,
        receivable.id,
        userId,
      );
    } catch (error) {
      mapRepoError(error);
    }
  }
}
