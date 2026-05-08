import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  type InteriorProjectDocumentRepository,
} from '@domain/repositories/interior-project-document.repository';

@Injectable()
export class DeleteInteriorProjectDocumentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: InteriorProjectDocumentRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    const ok = await this.repo.delete(id, applicationSlug);
    if (!ok) {
      throw new NotFoundException('Documento no encontrado');
    }
  }
}
