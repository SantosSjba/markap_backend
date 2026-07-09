import { Injectable, Inject } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
  type ArquitecturaProjectDocumentRepository,
  type ListArquitecturaProjectDocumentsFilters,
} from '@domain/repositories/arquitectura-project-document.repository';

@Injectable()
export class ListArquitecturaProjectDocumentsUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: ArquitecturaProjectDocumentRepository,
  ) {}

  execute(filters: ListArquitecturaProjectDocumentsFilters) {
    return this.repo.findMany(filters);
  }
}
