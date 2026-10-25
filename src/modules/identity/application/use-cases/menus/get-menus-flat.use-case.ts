import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';

import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';
import { MenuRepository } from '../../../domain/repositories/menu.repository';

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
