import { Inject, Injectable } from '@nestjs/common';
import { Application } from '../../../domain/entities/application.entity';
import type { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../domain/repositories/application.repository';

/**
 * Get User Applications Use Case
 * Returns all applications that a user has access to based on their roles
 */
import {
  APPLICATION_ACCESS,
  type ApplicationAccess,
} from '../../../../../shared/application/ports/application-access.port';
@Injectable()
export class GetUserApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_ACCESS) private readonly access: ApplicationAccess,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async execute(userId: string): Promise<Application[]> {
    const [apps, levels] = await Promise.all([
      this.applicationRepository.findByUserId(userId),
      this.access.getLevels(userId),
    ]);
    return apps
      .filter((app) => levels.has(app.slug))
      .map((app) => {
        app.accessLevel = levels.get(app.slug)!.level;
        return app;
      });
  }
}
