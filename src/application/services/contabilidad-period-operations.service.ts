import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
} from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_MONTH_LABELS,
  CONTABILIDAD_PERIOD_STATUS,
} from '@domain/constants/contabilidad-period.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type {
  ContabilidadPeriodRepository,
  CreateContabilidadCostCenterInput,
  UpdateContabilidadCostCenterInput,
} from '@domain/repositories/contabilidad-period.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

@Injectable()
export class ContabilidadPeriodOperationsService {
  constructor(
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  async listPeriods(applicationSlug: string | undefined, year?: number) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const targetYear = year ?? new Date().getFullYear();
    if (targetYear < 2000 || targetYear > 2100) {
      throw new BadRequestException('Año no válido.');
    }
    const rows = await this.periods.ensureYearPeriods(applicationId, targetYear);
    return {
      year: targetYear,
      periods: rows,
      monthLabels: CONTABILIDAD_MONTH_LABELS,
    };
  }

  async setPeriodStatus(applicationSlug: string | undefined, id: string, status: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (status !== CONTABILIDAD_PERIOD_STATUS.OPEN && status !== CONTABILIDAD_PERIOD_STATUS.CLOSED) {
      throw new BadRequestException('Estado debe ser OPEN o CLOSED.');
    }
    const existing = await this.periods.findPeriodById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadPeriod', id);
    return this.periods.setPeriodStatus(applicationId, id, status);
  }

  async listCostCenters(applicationSlug: string | undefined, search?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.periods.ensureDefaultCostCenters(applicationId);
    return this.periods.listCostCenters(applicationId, search);
  }

  async createCostCenter(applicationSlug: string | undefined, body: CreateContabilidadCostCenterInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
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
    const applicationId = await this.resolveApplicationId(applicationSlug);
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
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.periods.findCostCenterById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadCostCenter', id);

    if (await this.periods.hasCostCenterChildren(applicationId, id)) {
      throw new BadRequestException('Desactive primero los centros hijos.');
    }

    return this.periods.deactivateCostCenter(applicationId, id);
  }
}
