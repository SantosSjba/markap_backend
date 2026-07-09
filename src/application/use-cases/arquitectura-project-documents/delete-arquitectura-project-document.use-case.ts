import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
  type ArquitecturaProjectDocumentRepository,
} from '@domain/repositories/arquitectura-project-document.repository';

@Injectable()
export class DeleteArquitecturaProjectDocumentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: ArquitecturaProjectDocumentRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    const ok = await this.repo.delete(id, applicationSlug);
    if (!ok) {
      throw new NotFoundException('Documento no encontrado');
    }
  }
}
