import { Injectable, Inject } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import { EntityNotFoundException } from '../../exceptions';

export interface UpdateApplicationInput {
  id: string;
  name?: string;
  slug?: string;
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
export class UpdateApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(input: UpdateApplicationInput) {
    const existing = await this.applicationRepository.findById(input.id);
    if (!existing) {
      throw new EntityNotFoundException('Application', input.id);
    }
    const data: Partial<{
      name: string;
      slug: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      url: string | null;
      activeCount: number;
      pendingCount: number;
      isActive: boolean;
      order: number;
    }> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.url !== undefined) data.url = input.url;
    if (input.activeCount !== undefined) data.activeCount = input.activeCount;
    if (input.pendingCount !== undefined) data.pendingCount = input.pendingCount;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.order !== undefined) data.order = input.order;
    return this.applicationRepository.update(input.id, data);
  }
}
