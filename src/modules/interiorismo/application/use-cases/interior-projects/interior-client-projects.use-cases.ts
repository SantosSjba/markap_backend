import { Inject, Injectable } from '@nestjs/common';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
} from '../../../domain/repositories/interior-project.repository';

/** Proyectos (total y activos) de cada cliente del listado de clientes. */
@Injectable()
export class SummarizeInteriorClientProjectsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
  ) {}

  execute(applicationSlug: string, clientIds: string[]) {
    const ids = [
      ...new Set(clientIds.map((id) => id.trim()).filter(Boolean)),
    ].slice(0, 100);
    return this.repo.summarizeByClients(applicationSlug, ids);
  }
}

/** Cobros de un cliente en todos sus proyectos (ficha del cliente). */
@Injectable()
export class ListInteriorClientPaymentsUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly repo: InteriorProjectRepository,
  ) {}

  execute(applicationSlug: string, clientId: string) {
    return this.repo.findClientPayments(applicationSlug, clientId);
  }
}
