import { Injectable, Inject } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_REPOSITORY,
  type ArquitecturaProjectRepository,
  type ListArquitecturaProjectsFilters,
} from '@domain/repositories/arquitectura-project.repository';

@Injectable()
export class ListArquitecturaProjectsUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_REPOSITORY)
    private readonly repo: ArquitecturaProjectRepository,
  ) {}

  execute(filters: ListArquitecturaProjectsFilters) {
    return this.repo.findMany(filters);
  }
}
