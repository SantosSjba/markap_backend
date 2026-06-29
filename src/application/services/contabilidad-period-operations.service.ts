import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_PERIOD_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_AUDIT_ACTION,
  CONTABILIDAD_AUDIT_ENTITY_TYPE,
} from '@domain/constants/contabilidad-audit.defaults';
import {
  CONTABILIDAD_MONTH_LABELS,
  CONTABILIDAD_PERIOD_STATUS,
} from '@domain/constants/contabilidad-period.defaults';
import type {
  ContabilidadPeriodRepository,
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '@domain/repositories/contabilidad-period.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { ContabilidadAuditOperationsService } from './contabilidad-audit-operations.service';
import { ContabilidadContextService } from './contabilidad-context.service';

@Injectable()
export class ContabilidadPeriodOperationsService {
  constructor(
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    private readonly context: ContabilidadContextService,
    private readonly audit: ContabilidadAuditOperationsService,
  ) {}

  async listPeriods(applicationSlug: string | undefined, year?: number, legalEntityId?: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const entityId = await this.context.resolveLegalEntityId(applicationId, legalEntityId);
    const targetYear = year ?? new Date().getFullYear();
    if (targetYear < 2000 || targetYear > 2100) {
      throw new BadRequestException('Año no válido.');
    }
    const rows = await this.periods.ensureYearPeriods(applicationId, entityId, targetYear);
    return {
      year: targetYear,
      legalEntityId: entityId,
      periods: rows,
      monthLabels: CONTABILIDAD_MONTH_LABELS,
    };
  }

  async setPeriodStatus(
    applicationSlug: string | undefined,
    id: string,
    status: string,
    userId?: string | null,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    if (status !== CONTABILIDAD_PERIOD_STATUS.OPEN && status !== CONTABILIDAD_PERIOD_STATUS.CLOSED) {
      throw new BadRequestException('Estado debe ser OPEN o CLOSED.');
    }
    const existing = await this.periods.findPeriodById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadPeriod', id);

    const updated = await this.periods.setPeriodStatus(applicationId, id, status);

    await this.audit.log({
      applicationId,
      legalEntityId: existing.legalEntityId,
      entityType: CONTABILIDAD_AUDIT_ENTITY_TYPE.PERIOD,
      entityId: id,
      action:
        status === CONTABILIDAD_PERIOD_STATUS.CLOSED
          ? CONTABILIDAD_AUDIT_ACTION.PERIOD_CLOSE
          : CONTABILIDAD_AUDIT_ACTION.PERIOD_OPEN,
      userId: userId ?? null,
      summary: `${updated.label} → ${status}`,
      payload: { year: updated.year, month: updated.month, status },
    });

    return updated;
  }

  async listCostCenters(applicationSlug: string | undefined, search?: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    await this.periods.ensureDefaultCostCenters(applicationId);
    return this.periods.listCostCenters(applicationId, search);
  }

  async createCostCenter(applicationSlug: string | undefined, body: CreateContabilidadCostCenterInput) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    await this.periods.ensureDefaultCostCenters(applicationId);

    if (!body.code?.trim() || !body.name?.trim()) {
      throw new BadRequestException('Código y nombre son obligatorios.');
    }

    const code = body.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,12}$/.test(code)) {
      throw new BadRequestException('Código: 2-12 caracteres alfanuméricos, guión o guión bajo.');
    }

    const duplicate = await this.periods.findCostCenterByCode(applicationId, code);
    if (duplicate) throw new BadRequestException(`Ya existe el centro de costo ${code}.`);

    if (body.parentId) {
      const parent = await this.periods.findCostCenterById(applicationId, body.parentId);
      if (!parent) throw new EntityNotFoundException('ContabilidadCostCenter', body.parentId);
    }

    return this.periods.createCostCenter(applicationId, {
      code,
      name: body.name.trim(),
      parentId: body.parentId ?? null,
    });
  }

  async updateCostCenter(
    applicationSlug: string | undefined,
    id: string,
    body: UpdateContabilidadCostCenterInput,
  ) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.periods.findCostCenterById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadCostCenter', id);

    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,12}$/.test(code)) {
        throw new BadRequestException('Código: 2-12 caracteres alfanuméricos, guión o guión bajo.');
      }
      const duplicate = await this.periods.findCostCenterByCode(applicationId, code);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`Ya existe el centro de costo ${code}.`);
      }
      body = { ...body, code };
    }

    if (body.name !== undefined && !body.name.trim()) {
      throw new BadRequestException('El nombre no puede estar vacío.');
    }

    if (body.parentId !== undefined && body.parentId !== null) {
      if (body.parentId === id) throw new BadRequestException('Un centro no puede ser padre de sí mismo.');
      const parent = await this.periods.findCostCenterById(applicationId, body.parentId);
      if (!parent) throw new EntityNotFoundException('ContabilidadCostCenter', body.parentId);
    }

    return this.periods.updateCostCenter(applicationId, id, {
      ...body,
      name: body.name?.trim(),
    });
  }

  async deactivateCostCenter(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.context.resolveApplicationId(applicationSlug);
    const existing = await this.periods.findCostCenterById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadCostCenter', id);

    if (await this.periods.hasCostCenterChildren(applicationId, id)) {
      throw new BadRequestException('Desactive primero los centros hijos.');
    }

    return this.periods.deactivateCostCenter(applicationId, id);
  }
}
