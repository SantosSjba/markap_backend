import { Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  type InteriorProjectDocumentRepository,
} from '../../../domain/repositories/interior-project-document.repository';

/** Cantidad de documentos por tipo (pestañas del listado), de todo el módulo o de un proyecto. */
@Injectable()
export class GetInteriorProjectDocumentStatsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: InteriorProjectDocumentRepository,
  ) {}

  execute(applicationSlug: string, projectId?: string) {
    return this.repo.stats(applicationSlug, projectId);
  }
}
