import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
  type InteriorProjectStatus,
  type InteriorProjectType,
  type UpdateInteriorProjectData,
} from '@domain/repositories/interior-project.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class UpdateInteriorProjectUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    private readonly prisma: PrismaService,
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
    },
  ) {
    const projectRow = await this.prisma.interiorProject.findFirst({
      where: { id, deletedAt: null },
      select: { applicationId: true },
    });
    if (!projectRow) throw new EntityNotFoundException('InteriorProject', id);

    if (applicationSlug?.trim()) {
      const appRow = await this.prisma.application.findUnique({
        where: { slug: applicationSlug.trim() },
      });
      if (!appRow || appRow.id !== projectRow.applicationId) {
        throw new EntityNotFoundException('InteriorProject', id);
      }
    }

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          applicationId: projectRow.applicationId,
          deletedAt: null,
          clientType: { in: ['RESIDENTIAL', 'CORPORATE'] },
        },
      });
      if (!client) {
        throw new BadRequestException('Cliente no válido para interiorismo');
      }
    }

    await this.assertAgents(projectRow.applicationId, [
      data.designerAgentId,
      data.architectAgentId,
      data.supervisorAgentId,
      data.commercialAgentId,
    ]);

    const patch: UpdateInteriorProjectData = { ...data };
    return this.repo.update(id, patch);
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
          `El responsable no existe o no pertenece a esta aplicación`,
        );
      }
    }
  }
}
