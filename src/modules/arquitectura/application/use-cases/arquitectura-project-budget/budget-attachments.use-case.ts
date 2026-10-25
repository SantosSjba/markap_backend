import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { mapBudgetAttachment } from '../../../../../shared/application/dtos/budget-attachment.dto';
import { FileStoragePort } from '../../../../../shared/application/ports/file-storage.port';
import type { ArquitecturaProjectBudgetRepository } from '../../../domain/repositories/arquitectura-project-budget.repository';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '../../../domain/repositories/arquitectura-project-budget.repository';
const MODULE = 'arquitectura-budget';
const ENTITY_TYPE = 'arquitectura_project';

@Injectable()
export class ListArquitecturaProjectBudgetAttachmentsUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    lineItemId?: string | null,
    applicationSlug = 'arquitectura',
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
export class UploadArquitecturaProjectBudgetAttachmentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    payload: { title?: string; lineItemId?: string | null },
    applicationSlug = 'arquitectura',
  ) {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    if (payload.lineItemId) {
      await this.repo.assertLineItemBelongsToProject(
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
export class DeleteArquitecturaProjectBudgetAttachmentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
    private readonly genArchivo: FileStoragePort,
  ) {}

  async execute(
    projectId: string,
    attachmentId: string,
    applicationSlug = 'arquitectura',
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
