import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import {
  ARQUITECTURA_PROJECT_REPOSITORY,
  type ArquitecturaProjectRepository,
} from '../../../domain/repositories/arquitectura-project.repository';

@Injectable()
export class GetArquitecturaProjectByIdUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_REPOSITORY)
    private readonly repo: ArquitecturaProjectRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new EntityNotFoundException('ArquitecturaProject', id);
    return row;
  }
}
