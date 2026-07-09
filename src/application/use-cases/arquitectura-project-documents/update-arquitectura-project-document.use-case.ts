import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
  type ArquitecturaProjectDocumentRepository,
  type UpdateArquitecturaProjectDocumentData,
} from '@domain/repositories/arquitectura-project-document.repository';

@Injectable()
export class UpdateArquitecturaProjectDocumentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: ArquitecturaProjectDocumentRepository,
  ) {}

  async execute(id: string, applicationSlug: string, data: UpdateArquitecturaProjectDocumentData) {
    const row = await this.repo.update(id, applicationSlug, data);
    if (!row) {
      throw new NotFoundException('Documento no encontrado');
    }
    return row;
  }
}
