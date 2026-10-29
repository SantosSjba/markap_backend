import { Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorManualActivityType,
  type InteriorProjectRepository,
} from '../../../domain/repositories/interior-project.repository';

/** Comprueba que el proyecto exista y sea de la aplicación pedida. */
async function assertProjectInApp(
  references: BusinessReferencePort,
  projectId: string,
  applicationSlug: string,
) {
  const project = await references.findProjectScope('interiorismo', projectId);
  const app = await references.findApplicationBySlug(applicationSlug);
  if (!project || !app || app.id !== project.applicationId) {
    throw new EntityNotFoundException('InteriorProject', projectId);
  }
}

/** Registra una nota, reunión, tarea u otra actividad y devuelve el proyecto actualizado. */
@Injectable()
export class CreateInteriorProjectActivityUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    projectId: string,
    applicationSlug: string,
    data: {
      activityType: InteriorManualActivityType;
      title: string;
      description?: string | null;
      occurredAt: Date;
    },
  ) {
    await assertProjectInApp(this.references, projectId, applicationSlug);
    await this.repo.createActivity(projectId, data);
    return this.repo.findById(projectId, applicationSlug);
  }
}

/** Elimina una actividad registrada a mano (los cambios de etapa quedan en el historial). */
@Injectable()
export class DeleteInteriorProjectActivityUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    projectId: string,
    activityId: string,
    applicationSlug: string,
  ) {
    await assertProjectInApp(this.references, projectId, applicationSlug);
    const deleted = await this.repo.deleteManualActivity(projectId, activityId);
    if (!deleted) {
      throw new EntityNotFoundException('InteriorProjectActivity', activityId);
    }
    return this.repo.findById(projectId, applicationSlug);
  }
}
