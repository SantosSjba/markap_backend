import { Injectable, Inject } from '@nestjs/common';
import {
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  type InteriorProjectDocumentRepository,
  type ListInteriorProjectDocumentsFilters,
} from '@domain/repositories/interior-project-document.repository';

@Injectable()
export class ListInteriorProjectDocumentsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: InteriorProjectDocumentRepository,
  ) {}

  execute(filters: ListInteriorProjectDocumentsFilters) {
    return this.repo.findMany(filters);
  }
}
