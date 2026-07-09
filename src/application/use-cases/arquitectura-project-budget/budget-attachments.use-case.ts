import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GenArchivoService } from '@application/services/gen-archivo.service';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/arquitectura-project-budget.repository';
import type { ArquitecturaProjectBudgetRepository } from '@domain/repositories/arquitectura-project-budget.repository';

const MODULE = 'arquitectura-budget';
const ENTITY_TYPE = 'arquitectura_project';

export type BudgetAttachmentDto = {
  id: string;
  lineItemId: string | null;
  title: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

@Injectable()
export class ListArquitecturaProjectBudgetAttachmentsUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
    private readonly genArchivo: GenArchivoService,
  ) {}

  async execute(projectId: string, lineItemId?: string | null, applicationSlug = 'arquitectura') {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    const rows = await this.genArchivo.listByEntity(MODULE, ENTITY_TYPE, projectId, {
      category: lineItemId ? lineItemId : undefined,
    });
    return rows.map(mapAttachment);
  }
}

@Injectable()
export class UploadArquitecturaProjectBudgetAttachmentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
    private readonly genArchivo: GenArchivoService,
  ) {}

  async execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    payload: { title?: string; lineItemId?: string | null },
    applicationSlug = 'arquitectura',
  ) {
    await this.repo.assertProjectExists(projectId, applicationSlug);
    if (payload.lineItemId) {
      await this.repo.assertLineItemBelongsToProject(projectId, payload.lineItemId, applicationSlug);
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

    return mapAttachment({
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
    private readonly genArchivo: GenArchivoService,
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

function mapAttachment(row: {
  id: string;
  category?: string | null;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
}): BudgetAttachmentDto {
  const lineItemId = row.category && row.category !== 'project' ? row.category : null;
  return {
    id: row.id,
    lineItemId,
    title: row.originalFileName,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}
