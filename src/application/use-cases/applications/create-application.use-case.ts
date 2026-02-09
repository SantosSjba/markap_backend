import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { DuplicateEntityException } from '../../exceptions';

export interface CreateApplicationInput {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  url?: string | null;
  activeCount?: number;
  pendingCount?: number;
  isActive?: boolean;
  order?: number;
}

@Injectable()
export class CreateApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: CreateApplicationInput) {
    const existing = await this.applicationRepository.findBySlug(input.slug);
    if (existing) {
      throw new DuplicateEntityException('Application', 'slug', input.slug);
    }
    return this.applicationRepository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      url: input.url ?? null,
      activeCount: input.activeCount ?? 0,
      pendingCount: input.pendingCount ?? 0,
      isActive: input.isActive ?? true,
      order: input.order ?? 0,
      deletedAt: null,
    });
  }
}
