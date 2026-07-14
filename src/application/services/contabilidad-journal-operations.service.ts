import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_JOURNAL_REPOSITORY, CONTABILIDAD_PERIOD_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_AUDIT_ACTION,
  CONTABILIDAD_AUDIT_ENTITY_TYPE,
} from '@domain/constants/contabilidad-audit.defaults';
import {
  CONTABILIDAD_JOURNAL_STATUS,
  CONTABILIDAD_JOURNAL_STATUS_LABELS,
} from '@domain/constants/contabilidad-journal.defaults';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import type {
  ContabilidadJournalRepository,
  CreateContabilidadJournalEntryInput,
  ListContabilidadJournalEntriesFilters,
  UpdateContabilidadJournalEntryInput,
} from '@domain/repositories/contabilidad-journal.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { parsePenAmount } from '@domain/utils/contabilidad-journal-amounts';
import { parseDateOnly } from '@domain/utils/peru-date.util';
import { ContabilidadAuditOperationsService } from './contabilidad-audit-operations.service';
import { ContabilidadContextService } from './contabilidad-context.service';

function mapRepoError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Operación no válida.';
  throw new BadRequestException(message);
}

@Injectable()
export class ContabilidadJournalOperationsService {
  constructor(
    @Inject(CONTABILIDAD_JOURNAL_REPOSITORY)
    private readonly journal: ContabilidadJournalRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    private readonly context: ContabilidadContextService,
    private readonly audit: ContabilidadAuditOperationsService,
  ) {}

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
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Fecha del asiento no válida.');
    }
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month) {
      throw new BadRequestException('La fecha debe pertenecer al periodo seleccionado.');
    }
  }

  private validateDraftLines(lines: CreateContabilidadJournalEntryInput['lines']) {
    if (!lines?.length) throw new BadRequestException('Debe registrar al menos una línea.');
    if (lines.length < 2) throw new BadRequestException('Un asiento requiere al menos dos líneas.');

    for (const line of lines) {
      if (!line.accountId) throw new BadRequestException('Cada línea debe tener una cuenta.');
      const debit = parsePenAmount(line.debit);
      const credit = parsePenAmount(line.credit);
      if (Number.isNaN(debit) || Number.isNaN(credit)) {
        throw new BadRequestException('Importe no válido en una línea.');
      }
      if (debit > 0 && credit > 0) {
        throw new BadRequestException('Cada línea solo puede tener debe o haber.');
      }
    }
  }

  async list(applicationSlug: string | undefined, filters: ListContabilidadJournalEntriesFilters) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const legalEntityId = await this.context.resolveLegalEntityId(applicationId, filters.legalEntityId);
    const entries = await this.journal.list(applicationId, { ...filters, legalEntityId });
    return {
      entries,
      statusLabels: CONTABILIDAD_JOURNAL_STATUS_LABELS,
    };
  }

  async getById(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entry = await this.journal.findById(applicationId, id);
    if (!entry) throw new EntityNotFoundException('ContabilidadJournalEntry', id);
    return {
      entry,
      statusLabels: CONTABILIDAD_JOURNAL_STATUS_LABELS,
    };
  }

  async create(
    applicationSlug: string | undefined,
    body: CreateContabilidadJournalEntryInput,
    userId?: string | null,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    if (!body.periodId) throw new BadRequestException('Periodo obligatorio.');
    if (!body.entryDate) throw new BadRequestException('Fecha obligatoria.');
    if (!body.description?.trim()) throw new BadRequestException('La glosa es obligatoria.');

    const period = await this.assertOpenPeriod(applicationId, body.periodId);
    this.assertEntryDateInPeriod(body.entryDate, period.year, period.month);
    this.validateDraftLines(body.lines);

    try {
      return await this.journal.createDraft(applicationId, {
        periodId: body.periodId,
        entryDate: body.entryDate,
        description: body.description.trim(),
        lines: body.lines,
      }, userId);
    } catch (error) {
      mapRepoError(error);
    }
  }

  async update(
    applicationSlug: string | undefined,
    id: string,
    body: UpdateContabilidadJournalEntryInput,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.journal.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalEntry', id);
    if (existing.status !== CONTABILIDAD_JOURNAL_STATUS.DRAFT) {
      throw new BadRequestException('Solo se pueden editar asientos en borrador.');
    }

    const period = await this.periods.findPeriodById(applicationId, existing.periodId);
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', existing.periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable está cerrado.');
    }

    if (body.entryDate) {
      this.assertEntryDateInPeriod(body.entryDate, period.year, period.month);
    }
    if (body.description !== undefined && !body.description.trim()) {
      throw new BadRequestException('La glosa es obligatoria.');
    }
    if (body.lines) {
      this.validateDraftLines(body.lines);
    }

    try {
      return await this.journal.updateDraft(applicationId, id, {
        entryDate: body.entryDate,
        description: body.description?.trim(),
        lines: body.lines,
      });
    } catch (error) {
      mapRepoError(error);
    }
  }

  async deleteDraft(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.journal.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalEntry', id);
    if (existing.status !== CONTABILIDAD_JOURNAL_STATUS.DRAFT) {
      throw new BadRequestException('Solo se pueden eliminar asientos en borrador.');
    }

    try {
      await this.journal.deleteDraft(applicationId, id);
      return { ok: true };
    } catch (error) {
      mapRepoError(error);
    }
  }

  async post(applicationSlug: string | undefined, id: string, userId?: string | null) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.journal.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalEntry', id);

    const period = await this.periods.findPeriodById(applicationId, existing.periodId);
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', existing.periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable está cerrado.');
    }

    try {
      const posted = await this.journal.post(applicationId, id, userId);
      await this.audit.log({
        applicationId,
        legalEntityId: period.legalEntityId,
        entityType: CONTABILIDAD_AUDIT_ENTITY_TYPE.JOURNAL_ENTRY,
        entityId: id,
        action: CONTABILIDAD_AUDIT_ACTION.JOURNAL_POST,
        userId: userId ?? null,
        summary: `Asiento N° ${posted.entryNumber} publicado`,
        payload: {
          entryNumber: posted.entryNumber,
          entryDate: posted.entryDate,
          totalDebit: posted.totalDebit,
          totalCredit: posted.totalCredit,
        },
      });
      return posted;
    } catch (error) {
      mapRepoError(error);
    }
  }

  async reverse(applicationSlug: string | undefined, id: string, userId?: string | null) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.journal.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadJournalEntry', id);

    const period = await this.periods.findPeriodById(applicationId, existing.periodId);
    if (!period) throw new EntityNotFoundException('ContabilidadPeriod', existing.periodId);
    if (period.status !== CONTABILIDAD_PERIOD_STATUS.OPEN) {
      throw new BadRequestException('El periodo contable está cerrado.');
    }

    try {
      const reversed = await this.journal.reverse(applicationId, id, userId);
      await this.audit.log({
        applicationId,
        legalEntityId: period.legalEntityId,
        entityType: CONTABILIDAD_AUDIT_ENTITY_TYPE.JOURNAL_ENTRY,
        entityId: id,
        action: CONTABILIDAD_AUDIT_ACTION.JOURNAL_REVERSE,
        userId: userId ?? null,
        summary: `Reversa del asiento N° ${existing.entryNumber}`,
        payload: {
          originalEntryId: id,
          reversalEntryId: reversed.id,
          reversalEntryNumber: reversed.entryNumber,
        },
      });
      return reversed;
    } catch (error) {
      mapRepoError(error);
    }
  }
}
