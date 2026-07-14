import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_ACCOUNT_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
  CONTABILIDAD_TREASURY_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_RECONCILIATION_STATUS_LABELS,
  CONTABILIDAD_TREASURY_MOVEMENT_TYPE_LABELS,
  CONTABILIDAD_TREASURY_SOURCE_TYPE,
} from '@domain/constants/contabilidad-treasury.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadAccountRepository } from '@domain/repositories/contabilidad-account.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import type {
  ContabilidadTreasuryRepository,
  CreateBankAccountInput,
  CreateCashBoxInput,
  CreateTreasuryMovementInput,
  CreateTreasuryTransferInput,
  ListTreasuryMovementsFilters,
  UpdateBankAccountInput,
  UpdateCashBoxInput,
  UpsertReconciliationInput,
} from '@domain/repositories/contabilidad-treasury.repository';
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

@Injectable()
export class ContabilidadTreasuryOperationsService {
  constructor(
    @Inject(CONTABILIDAD_TREASURY_REPOSITORY)
    private readonly treasury: ContabilidadTreasuryRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(CONTABILIDAD_ACCOUNT_REPOSITORY)
    private readonly accounts: ContabilidadAccountRepository,
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

  async listCashBoxes(applicationSlug: string | undefined) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    await this.treasury.ensureDefaults(applicationId);
    const cashBoxes = await this.treasury.listCashBoxes(applicationId);
    return { cashBoxes };
  }

  async createCashBox(applicationSlug: string | undefined, body: CreateCashBoxInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.code?.trim() || !body.name?.trim()) {
      throw new BadRequestException('Código y nombre son obligatorios.');
    }
    const account = await this.accounts.findById(applicationId, body.accountId);
    if (!account?.isActive || !account.isMovement) {
      throw new BadRequestException('Cuenta contable no válida.');
    }
    try {
      return await this.treasury.createCashBox(applicationId, {
        code: body.code.trim().toUpperCase(),
        name: body.name.trim(),
        accountId: body.accountId,
      });
    } catch (error) {
      mapRepoError(error);
    }
  }

  async updateCashBox(applicationSlug: string | undefined, id: string, body: UpdateCashBoxInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.treasury.findCashBoxById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadCashBox', id);
    if (body.accountId) {
      const account = await this.accounts.findById(applicationId, body.accountId);
      if (!account?.isActive || !account.isMovement) {
        throw new BadRequestException('Cuenta contable no válida.');
      }
    }
    try {
      return await this.treasury.updateCashBox(applicationId, id, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listBankAccounts(applicationSlug: string | undefined) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    await this.treasury.ensureDefaults(applicationId);
    const bankAccounts = await this.treasury.listBankAccounts(applicationId);
    return { bankAccounts };
  }

  async createBankAccount(applicationSlug: string | undefined, body: CreateBankAccountInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.code?.trim() || !body.bankName?.trim() || !body.accountNumber?.trim()) {
      throw new BadRequestException('Código, banco y número de cuenta son obligatorios.');
    }
    const account = await this.accounts.findById(applicationId, body.accountId);
    if (!account?.isActive || !account.isMovement) {
      throw new BadRequestException('Cuenta contable no válida.');
    }
    try {
      return await this.treasury.createBankAccount(applicationId, {
        ...body,
        code: body.code.trim().toUpperCase(),
        bankName: body.bankName.trim(),
        accountNumber: body.accountNumber.trim(),
      });
    } catch (error) {
      mapRepoError(error);
    }
  }

  async updateBankAccount(applicationSlug: string | undefined, id: string, body: UpdateBankAccountInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.treasury.findBankAccountById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadBankAccount', id);
    if (body.accountId) {
      const account = await this.accounts.findById(applicationId, body.accountId);
      if (!account?.isActive || !account.isMovement) {
        throw new BadRequestException('Cuenta contable no válida.');
      }
    }
    try {
      return await this.treasury.updateBankAccount(applicationId, id, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async listMovements(applicationSlug: string | undefined, filters: ListTreasuryMovementsFilters) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const movements = await this.treasury.listMovements(applicationId, filters);
    return {
      movements,
      movementTypeLabels: CONTABILIDAD_TREASURY_MOVEMENT_TYPE_LABELS,
    };
  }

  async createMovement(
    applicationSlug: string | undefined,
    body: CreateTreasuryMovementInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.movementDate, period.year, period.month);

    const amount = parsePenAmount(body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Importe debe ser mayor a cero.');
    }
    if (!body.description?.trim()) throw new BadRequestException('La glosa es obligatoria.');
    if (!body.offsetAccountId) throw new BadRequestException('Cuenta de contrapartida obligatoria.');

    const offset = await this.accounts.findById(applicationId, body.offsetAccountId);
    if (!offset?.isActive || !offset.isMovement) {
      throw new BadRequestException('Cuenta de contrapartida no válida.');
    }

    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.cashBoxId) {
      throw new BadRequestException('Seleccione una caja.');
    }
    if (body.sourceType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.bankAccountId) {
      throw new BadRequestException('Seleccione una cuenta bancaria.');
    }

    try {
      return await this.treasury.createMovementWithJournal(applicationId, body, userId);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async createTransfer(
    applicationSlug: string | undefined,
    body: CreateTreasuryTransferInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.movementDate, period.year, period.month);

    const amount = parsePenAmount(body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Importe debe ser mayor a cero.');
    }
    if (!body.description?.trim()) throw new BadRequestException('La glosa es obligatoria.');

    if (body.fromType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.fromCashBoxId) {
      throw new BadRequestException('Origen caja obligatorio.');
    }
    if (body.fromType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.fromBankAccountId) {
      throw new BadRequestException('Origen banco obligatorio.');
    }
    if (body.toType === CONTABILIDAD_TREASURY_SOURCE_TYPE.CASH && !body.toCashBoxId) {
      throw new BadRequestException('Destino caja obligatorio.');
    }
    if (body.toType === CONTABILIDAD_TREASURY_SOURCE_TYPE.BANK && !body.toBankAccountId) {
      throw new BadRequestException('Destino banco obligatorio.');
    }

    try {
      const movements = await this.treasury.createTransferWithJournal(applicationId, body, userId);
      return { movements };
    } catch (error) {
      mapRepoError(error);
    }
  }

  async getReconciliation(
    applicationSlug: string | undefined,
    bankAccountId: string,
    periodId: string,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const reconciliation = await this.treasury.getReconciliation(applicationId, bankAccountId, periodId);
    const movements = await this.treasury.listMovements(applicationId, {
      bankAccountId,
      periodId,
    });
    return {
      reconciliation,
      movements,
      statusLabels: CONTABILIDAD_RECONCILIATION_STATUS_LABELS,
    };
  }

  async upsertReconciliation(applicationSlug: string | undefined, body: UpsertReconciliationInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.assertOpenPeriod(applicationId, body.periodId);
    const bank = await this.treasury.findBankAccountById(applicationId, body.bankAccountId);
    if (!bank) throw new EntityNotFoundException('ContabilidadBankAccount', body.bankAccountId);

    try {
      return await this.treasury.upsertReconciliation(applicationId, body);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async toggleMovementReconciled(
    applicationSlug: string | undefined,
    reconciliationId: string,
    movementId: string,
    reconciled: boolean,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.treasury.toggleMovementReconciled(
        applicationId,
        reconciliationId,
        movementId,
        reconciled,
      );
    } catch (error) {
      mapRepoError(error);
    }
  }

  async closeReconciliation(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.treasury.closeReconciliation(applicationId, id);
    } catch (error) {
      mapRepoError(error);
    }
  }
}
