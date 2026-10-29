import { withUniqueSuffix } from '../../../../rentals/domain/utils/rental-code.util';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertAgentsBelongToApplication } from '../../../../../shared/application/validation/assert-agents-belong-to-application';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
  type InteriorProjectStatus,
  type InteriorProjectType,
  type UpdateInteriorProjectData,
} from '../../../domain/repositories/interior-project.repository';
import {
  INTERIORISMO_CONFIG_REPOSITORY,
  type InteriorismoConfigRepository,
} from '../../../domain/repositories/interiorismo-config.repository';

@Injectable()
export class UpdateInteriorProjectUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    private readonly references: BusinessReferencePort,
    @Inject(INTERIORISMO_CONFIG_REPOSITORY)
    private readonly config: InteriorismoConfigRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug: string | undefined,
    data: {
      code?: string;
      name?: string;
      clientId?: string;
      projectType?: InteriorProjectType;
      status?: InteriorProjectStatus;
      addressLine?: string | null;
      city?: string | null;
      interventionLevel?: string | null;
      executionTimeNote?: string | null;
      currency?: string;
      defaultUtilityPct?: number | null;
      defaultIgvPct?: number | null;
      defaultOverheadPct?: number | null;
      exchangeRate?: number | null;
      districtId?: string | null;
      areaSqm?: number | null;
      levelsCount?: number | null;
      environmentsNote?: string | null;
      startDate?: Date | null;
      estimatedEndDate?: Date | null;
      designerAgentId?: string | null;
      architectJrAgentId?: string | null;
      architectSrAgentId?: string | null;
      supervisorAgentId?: string | null;
      commercialAgentId?: string | null;
      estimatedBudget?: number | null;
      projectedCost?: number | null;
      expectedMargin?: number | null;
      progressPct?: number | null;
    },
  ) {
    const projectRow = await this.references.findProjectScope(
      'interiorismo',
      id,
    );
    if (!projectRow) throw new EntityNotFoundException('InteriorProject', id);

    if (applicationSlug?.trim()) {
      const appRow = await this.references.findApplicationBySlug(
        applicationSlug.trim(),
      );
      if (!appRow || appRow.id !== projectRow.applicationId) {
        throw new EntityNotFoundException('InteriorProject', id);
      }
    }

    if (data.clientId) {
      const client = await this.references.projectClientExists(
        projectRow.applicationId,
        data.clientId,
      );
      if (!client) {
        throw new BadRequestException('Cliente no válido para interiorismo');
      }
    }

    await assertAgentsBelongToApplication(
      this.references,
      projectRow.applicationId,
      [
        data.designerAgentId,
        data.architectJrAgentId,
        data.architectSrAgentId,
        data.supervisorAgentId,
        data.commercialAgentId,
      ],
    );

    // Etapa anterior, para anotar el cambio en la actividad del proyecto
    const previousStatus = data.status
      ? (await this.repo.findById(id))?.status
      : undefined;

    const patch: UpdateInteriorProjectData = { ...data };
    const requestedCode = data.code?.trim();
    if (requestedCode) {
      // «Regenerar» en edición: mismo sufijo que en el alta, sin chocar consigo mismo
      const used = await this.repo.listCodesWithPrefix(
        projectRow.applicationId,
        requestedCode,
      );
      const current = await this.repo.findById(id);
      patch.code = withUniqueSuffix(
        requestedCode,
        used.filter((c) => c !== current?.code),
      );
    } else {
      delete patch.code;
    }
    const updated = await this.repo.update(id, patch);
    if (!data.status || !previousStatus || previousStatus === data.status) {
      return updated;
    }
    await this.repo.createActivity(id, {
      activityType: 'STATUS_CHANGE',
      title: `Etapa: ${await this.stageLabel(projectRow.applicationId, previousStatus)} → ${await this.stageLabel(projectRow.applicationId, data.status)}`,
      occurredAt: new Date(),
    });
    return (await this.repo.findById(id)) ?? updated;
  }

  /** Nombre de la etapa según la configuración de la aplicación */
  private async stageLabel(applicationId: string, code: string) {
    if (code === 'CANCELLED') return 'Cancelado';
    const stages = await this.config.listProjectStages(applicationId);
    return stages.find((s) => s.code === code)?.label ?? code;
  }
}
