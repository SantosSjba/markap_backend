import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  ARQUITECTURA_CONFIG_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  ARQUITECTURA_PROJECT_REPOSITORY,
  type ArquitecturaProjectRepository,
  type ArquitecturaProjectStatus,
  type ArquitecturaProjectType,
  type CreateArquitecturaProjectData,
} from '@domain/repositories/arquitectura-project.repository';
import {
  ARQUITECTURA_PROJECT_SERIES_KEY,
  type ArquitecturaConfigRepository,
} from '@domain/repositories/arquitectura-config.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class CreateArquitecturaProjectUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_REPOSITORY)
    private readonly repo: ArquitecturaProjectRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(ARQUITECTURA_CONFIG_REPOSITORY)
    private readonly configRepository: ArquitecturaConfigRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    applicationSlug: string;
    code?: string;
    name: string;
    clientId: string;
    projectType: ArquitecturaProjectType;
    status: ArquitecturaProjectStatus;
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
    const app = await this.applicationRepository.findBySlug(input.applicationSlug);
    if (!app || app.slug !== 'arquitectura') {
      throw new BadRequestException(
        'Los proyectos de arquitectura solo se crean con applicationSlug arquitectura',
      );
    }

    const code = input.code?.trim()
      ? input.code.trim()
      : await this.configRepository.allocateNextCode(app.id, ARQUITECTURA_PROJECT_SERIES_KEY);

    const dup = await this.prisma.arquitecturaProject.findFirst({
      where: {
        applicationId: app.id,
        code,
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
        'El cliente no existe en arquitectura o no es válido para proyectos',
      );
    }

    if (input.status === 'CANCELLED') {
      throw new BadRequestException(
        'No se puede crear un proyecto directamente como cancelado.',
      );
    }

    await this.assertAgents(app.id, [
      input.designerAgentId,
      input.architectJrAgentId,
      input.architectSrAgentId,
      input.supervisorAgentId,
      input.commercialAgentId,
    ]);

    const data: CreateArquitecturaProjectData = {
      applicationId: app.id,
      code,
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
