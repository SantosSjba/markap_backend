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

@Injectable()
export class UpdateInteriorProjectUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    id: string,
    applicationSlug: string | undefined,
    data: {
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

    const patch: UpdateInteriorProjectData = { ...data };
    return this.repo.update(id, patch);
  }
}
