import { Injectable, Inject } from '@nestjs/common';
import { MenuRepository } from '@domain/repositories/menu.repository';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '@domain/repositories/application.repository';
import { EntityNotFoundException } from '@domain/exceptions';

export interface GetMenusFlatInput {
  applicationSlug: string;
}

@Injectable()
export class GetMenusFlatUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(input: GetMenusFlatInput) {
    const application = await this.applicationRepository.findBySlug(
      input.applicationSlug,
    );

    if (!application) {
      throw new EntityNotFoundException('Application', input.applicationSlug);
    }

    return this.menuRepository.findAllByApplicationId(application.id);
  }
}
