import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type CreateInteriorBudgetPayload,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class CreateInteriorBudgetUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreateInteriorBudgetPayload, actorUserId?: string | null) {
    const app = await this.applications.findBySlug('interiorismo');
    if (!app) throw new BadRequestException('Aplicación interiorismo no encontrada');

    const project = await this.prisma.interiorProject.findFirst({
      where: {
        id: input.projectId,
        applicationId: app.id,
        deletedAt: null,
      },
    });
    if (!project) throw new BadRequestException('El proyecto no existe en interiorismo');

    const version = input.version ?? 1;
    const dup = await this.prisma.interiorBudget.findFirst({
      where: {
        projectId: input.projectId,
        code: input.code.trim(),
        version,
      },
    });
    if (dup) {
      throw new BadRequestException(
        `Ya existe el presupuesto ${input.code.trim()} versión ${version} en este proyecto`,
      );
    }

    return this.repo.create(input, actorUserId);
  }
}
