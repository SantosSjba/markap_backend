import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
  type CreateArquitecturaProjectDocumentData,
  type ArquitecturaProjectDocumentRepository,
} from '@domain/repositories/arquitectura-project-document.repository';

@Injectable()
export class CreateArquitecturaProjectDocumentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: ArquitecturaProjectDocumentRepository,
  ) {}

  async execute(data: CreateArquitecturaProjectDocumentData) {
    const row = await this.repo.create(data);
    if (!row) {
      throw new NotFoundException('Proyecto no encontrado o aplicaciÃ³n invÃ¡lida');
    }
    return row;
  }
}
