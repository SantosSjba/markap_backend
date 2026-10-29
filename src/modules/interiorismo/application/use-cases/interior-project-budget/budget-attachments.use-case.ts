import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { mapBudgetAttachment } from '../../../../../shared/application/dtos/budget-attachment.dto';
import { FileStoragePort } from '../../../../../shared/application/ports/file-storage.port';
import type { InteriorProjectBudgetRepository } from '../../../domain/repositories/interior-project-budget.repository';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '../../../domain/repositories/interior-project-budget.repository';

const MODULE = 'interiorismo-budget';
const ENTITY_TYPE = 'interior_project';

@Injectable()
export class ListInteriorProjectBudgetAttachmentsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    lineItemId?: string | null,
    applicationSlug = 'interiorismo',
  ) {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    const rows = await this.genArchivo.listByEntity(
      MODULE,
      ENTITY_TYPE,
      projectId,
      {
        category: lineItemId ? lineItemId : undefined,
      },
    );
    return rows.map(mapBudgetAttachment);
  }
}

@Injectable()
export class UploadInteriorProjectBudgetAttachmentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    payload: { title?: string; lineItemId?: string | null },
    applicationSlug = 'interiorismo',
  ) {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    if (payload.lineItemId) {
      await this.repo.assertRowBelongsToProject(
        projectId,
        payload.lineItemId,
        applicationSlug,
      );
    }

    const row = await this.genArchivo.upload(
      {
        applicationSlug,
        module: MODULE,
        entityType: ENTITY_TYPE,
        entityId: projectId,
        category: payload.lineItemId ?? 'project',
      },
      file,
    );

    return mapBudgetAttachment({
      ...row,
      category: payload.lineItemId ?? 'project',
      createdAt: new Date(),
    });
  }
}

@Injectable()
export class DeleteInteriorProjectBudgetAttachmentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    attachmentId: string,
    applicationSlug = 'interiorismo',
  ): Promise<void> {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    const archivo = await this.genArchivo.findByIdWithMeta(attachmentId);
    if (
      !archivo ||
      archivo.module !== MODULE ||
      archivo.entityType !== ENTITY_TYPE ||
      archivo.entityId !== projectId
    ) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    await this.genArchivo.softDelete(attachmentId);
  }
}
