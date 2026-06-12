import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type CreateInteriorProjectData,
  type InteriorProjectRepository,
  type InteriorProjectStatus,
  type InteriorProjectType,
} from '@domain/repositories/interior-project.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class CreateInteriorProjectUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    applicationSlug: string;
    code: string;
    name: string;
    clientId: string;
    projectType: InteriorProjectType;
    status: InteriorProjectStatus;
    addressLine?: string | null;
    areaSqm?: number | null;
    levelsCount?: number | null;
    environmentsNote?: string | null;
    startDate?: Date | null;
    estimatedEndDate?: Date | null;
    designerAgentId?: string | null;
    architectAgentId?: string | null;
    supervisorAgentId?: string | null;
    commercialAgentId?: string | null;
    estimatedBudget?: number | null;
    projectedCost?: number | null;
    expectedMargin?: number | null;
    progressPct?: number | null;
  }) {
    const app = await this.applicationRepository.findBySlug(input.applicationSlug);
    if (!app || app.slug !== 'interiorismo') {
      throw new BadRequestException(
        'Los proyectos de interiorismo solo se crean con applicationSlug interiorismo',
      );
    }

    const dup = await this.prisma.interiorProject.findFirst({
      where: {
        applicationId: app.id,
        code: input.code.trim(),
        deletedAt: null,
      },
    });
    if (dup) {
      throw new BadRequestException('Ya existe un proyecto con ese código en esta aplicación');
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: input.clientId,
        applicationId: app.id,
        deletedAt: null,
        clientType: { in: ['RESIDENTIAL', 'CORPORATE'] },
      },
    });
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

    await this.assertAgents(app.id, [
      input.designerAgentId,
      input.architectAgentId,
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
      areaSqm: input.areaSqm,
      levelsCount: input.levelsCount,
      environmentsNote: input.environmentsNote,
      startDate: input.startDate,
      estimatedEndDate: input.estimatedEndDate,
      designerAgentId: input.designerAgentId,
      architectAgentId: input.architectAgentId,
      supervisorAgentId: input.supervisorAgentId,
      commercialAgentId: input.commercialAgentId,
      estimatedBudget: input.estimatedBudget,
      projectedCost: input.projectedCost,
      expectedMargin: input.expectedMargin,
      progressPct: input.progressPct,
    };

    return this.repo.create(data);
  }

  private async assertAgents(
    applicationId: string,
    ids: (string | null | undefined)[],
  ): Promise<void> {
    const unique = [...new Set(ids.filter((x): x is string => !!x?.trim()))];
    for (const agentId of unique) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, applicationId, deletedAt: null },
      });
      if (!agent) {
        throw new BadRequestException(
          `El responsable ${agentId} no existe o no pertenece a esta aplicación`,
        );
      }
    }
  }
}
