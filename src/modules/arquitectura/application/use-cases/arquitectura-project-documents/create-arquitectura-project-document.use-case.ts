import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY,
  type ArquitecturaProjectDocumentRepository,
  type CreateArquitecturaProjectDocumentData,
} from '../../../domain/repositories/arquitectura-project-document.repository';
@Injectable()
export class CreateArquitecturaProjectDocumentUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: ArquitecturaProjectDocumentRepository,
  ) {}

  async execute(data: CreateArquitecturaProjectDocumentData) {
    const row = await this.repo.create(data);
    if (!row) {
      throw new NotFoundException(
        'Proyecto no encontrado o aplicación inválida',
      );
    }
    return row;
  }
}
