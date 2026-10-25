import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
} from '../../../domain/repositories/interior-project.repository';

@Injectable()
export class GetInteriorProjectByIdUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new EntityNotFoundException('InteriorProject', id);
    return row;
  }
}
