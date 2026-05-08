import { Injectable, Inject } from '@nestjs/common';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
  type ListInteriorProjectsFilters,
} from '@domain/repositories/interior-project.repository';

@Injectable()
export class ListInteriorProjectsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
  ) {}

  execute(filters: ListInteriorProjectsFilters) {
    return this.repo.findMany(filters);
  }
}
