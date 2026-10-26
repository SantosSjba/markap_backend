import { Injectable } from '@nestjs/common';
import { ApplicationAccessRepository } from '../../domain/repositories/application-access.repository';
import { ACCESS_LEVEL_RANK } from '../../../../shared/domain/access-level';
import {
  accessRevision,
  invalidateAccessCache,
  type ApplicationAccess,
  type ApplicationLevel,
} from '../../../../shared/application/ports/application-access.port';
@Injectable()
export class ApplicationAccessService implements ApplicationAccess {
  private readonly cache = new Map<
    string,
    { at: number; revision: number; levels: Map<string, ApplicationLevel> }
  >();
  constructor(private readonly repository: ApplicationAccessRepository) {}
  resolveResourceApplication(resource: string, id: string) {
    return this.repository.resolveResourceApplication(resource, id);
  }
  invalidate(userId?: string) {
    if (userId) this.cache.delete(userId);
    else {
      this.cache.clear();
      invalidateAccessCache();
    }
  }
  async getLevels(userId: string) {
    const cached = this.cache.get(userId);
    if (
      cached &&
      cached.revision === accessRevision() &&
      Date.now() - cached.at < 30000
    )
      return new Map(cached.levels);
    // Revisión previa a la consulta: si se invalida mientras consulta, el resultado nace vencido
    const revision = accessRevision();
    const assignments = await this.repository.getAssignments(userId);
    const levels = new Map<string, ApplicationLevel>();
    for (const a of assignments)
      if (
        !levels.has(a.slug) ||
        ACCESS_LEVEL_RANK[a.level] >
          ACCESS_LEVEL_RANK[levels.get(a.slug)!.level]
      )
        levels.set(a.slug, {
          level: a.level,
          applicationId: a.applicationId,
          name: a.name,
        });
    this.cache.set(userId, {
      at: Date.now(),
      revision,
      levels,
    });
    return new Map(levels);
  }
}
