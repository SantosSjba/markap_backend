import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  type InteriorProjectDocumentRepository,
  type UpdateInteriorProjectDocumentData,
} from '@domain/repositories/interior-project-document.repository';

@Injectable()
export class UpdateInteriorProjectDocumentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: InteriorProjectDocumentRepository,
  ) {}

  async execute(id: string, applicationSlug: string, data: UpdateInteriorProjectDocumentData) {
    const row = await this.repo.update(id, applicationSlug, data);
    if (!row) {
      throw new NotFoundException('Documento no encontrado');
    }
    return row;
  }
}
