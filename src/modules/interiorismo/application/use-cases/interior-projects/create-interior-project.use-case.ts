import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { assertAgentsBelongToApplication } from '../../../../../shared/application/validation/assert-agents-belong-to-application';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type CreateInteriorProjectData,
  type InteriorProjectRepository,
  type InteriorProjectStatus,
  type InteriorProjectType,
} from '../../../domain/repositories/interior-project.repository';

@Injectable()
export class CreateInteriorProjectUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(input: {
    applicationSlug: string;
    code: string;
    name: string;
    clientId: string;
    projectType: InteriorProjectType;
    status: InteriorProjectStatus;
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
  }) {
    const app = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    );
    if (!app || app.slug !== 'interiorismo') {
      throw new BadRequestException(
        'Los proyectos de interiorismo solo se crean con applicationSlug interiorismo',
      );
    }

    const dup = await this.references.projectCodeExists(
      'interiorismo',
      app.id,
      input.code.trim(),
    );
    if (dup) {
      throw new BadRequestException(
        'Ya existe un proyecto con ese código en esta aplicación',
      );
    }

    const client = await this.references.projectClientExists(
      app.id,
      input.clientId,
    );
    if (!client) {
      throw new BadRequestException(
        'El cliente no existe en interiorismo o no es válido para proyectos',
      );
    }

    if (input.status === 'CANCELLED') {
      throw new BadRequestException(
        'No se puede crear un proyecto directamente como cancelado.',
      );
    }

    await assertAgentsBelongToApplication(this.references, app.id, [
      input.designerAgentId,
      input.architectJrAgentId,
      input.architectSrAgentId,
      input.supervisorAgentId,
      input.commercialAgentId,
    ]);

    const data: CreateInteriorProjectData = {
      applicationId: app.id,
      code: input.code,
      name: input.name,
      clientId: input.clientId,
      projectType: input.projectType,
      status: input.status,
      addressLine: input.addressLine,
      city: input.city,
      interventionLevel: input.interventionLevel,
      executionTimeNote: input.executionTimeNote,
      currency: input.currency,
      defaultUtilityPct: input.defaultUtilityPct,
      defaultIgvPct: input.defaultIgvPct,
      areaSqm: input.areaSqm,
      levelsCount: input.levelsCount,
      environmentsNote: input.environmentsNote,
      startDate: input.startDate,
      estimatedEndDate: input.estimatedEndDate,
      designerAgentId: input.designerAgentId,
      architectJrAgentId: input.architectJrAgentId,
      architectSrAgentId: input.architectSrAgentId,
      supervisorAgentId: input.supervisorAgentId,
      commercialAgentId: input.commercialAgentId,
      estimatedBudget: input.estimatedBudget,
      projectedCost: input.projectedCost,
      expectedMargin: input.expectedMargin,
      progressPct: input.progressPct,
    };

    return this.repo.create(data);
  }
}
