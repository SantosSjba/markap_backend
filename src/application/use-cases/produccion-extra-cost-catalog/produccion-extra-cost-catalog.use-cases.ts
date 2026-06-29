import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY,
  type CreateProduccionExtraCostCatalogPayload,
  type ListProduccionExtraCostCatalogFilters,
  type ProduccionExtraCostCatalogRepository,
  type UpdateProduccionExtraCostCatalogPayload,
} from '@domain/repositories/produccion-extra-cost-catalog.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionExtraCostCatalogUseCase {
  constructor(
    @Inject(PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY)
    private readonly repo: ProduccionExtraCostCatalogRepository,
  ) {}

  execute(filters: ListProduccionExtraCostCatalogFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionExtraCostCatalogByIdUseCase {
  constructor(
    @Inject(PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY)
    private readonly repo: ProduccionExtraCostCatalogRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Gasto no encontrado');
    return row;
  }
}

@Injectable()
export class CreateProduccionExtraCostCatalogUseCase {
  constructor(
    @Inject(PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY)
    private readonly repo: ProduccionExtraCostCatalogRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionExtraCostCatalogPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionExtraCostCatalogUseCase {
  constructor(
    @Inject(PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY)
    private readonly repo: ProduccionExtraCostCatalogRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionExtraCostCatalogPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Gasto no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteProduccionExtraCostCatalogUseCase {
  constructor(
    @Inject(PRODUCCION_EXTRA_COST_CATALOG_REPOSITORY)
    private readonly repo: ProduccionExtraCostCatalogRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Gasto no encontrado');
    await this.repo.delete(id);
  }
}
