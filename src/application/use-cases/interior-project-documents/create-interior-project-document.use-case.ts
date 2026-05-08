import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_PROJECT_DOCUMENT_REPOSITORY,
  type CreateInteriorProjectDocumentData,
  type InteriorProjectDocumentRepository,
} from '@domain/repositories/interior-project-document.repository';

@Injectable()
export class CreateInteriorProjectDocumentUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_DOCUMENT_REPOSITORY)
    private readonly repo: InteriorProjectDocumentRepository,
  ) {}

  async execute(data: CreateInteriorProjectDocumentData) {
    const row = await this.repo.create(data);
    if (!row) {
      throw new NotFoundException('Proyecto no encontrado o aplicación inválida');
    }
    return row;
  }
}
