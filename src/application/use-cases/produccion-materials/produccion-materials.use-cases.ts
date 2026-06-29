import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_MATERIAL_REPOSITORY,
  type CreateProduccionMaterialPayload,
  type CreateProduccionStockMovementPayload,
  type ListProduccionMaterialsFilters,
  type ListProduccionStockMovementsFilters,
  type ProduccionMaterialRepository,
  type UpdateProduccionMaterialPayload,
} from '@domain/repositories/produccion-material.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionMaterialsUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  execute(filters: ListProduccionMaterialsFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionInventoryStatsUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  execute(applicationSlug?: string) {
    return this.repo.getStats(applicationSlug ?? SLUG);
  }
}

@Injectable()
export class GetProduccionMaterialByIdUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Material no encontrado');
    return row;
  }
}

@Injectable()
export class CreateProduccionMaterialUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionMaterialPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionMaterialUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionMaterialPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteProduccionMaterialUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    await this.repo.delete(id);
  }
}

@Injectable()
export class ListProduccionStockMovementsUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  execute(filters: ListProduccionStockMovementsFilters) {
    return this.repo.listMovements(filters);
  }
}

@Injectable()
export class CreateProduccionStockMovementUseCase {
  constructor(
    @Inject(PRODUCCION_MATERIAL_REPOSITORY)
    private readonly repo: ProduccionMaterialRepository,
  ) {}

  execute(applicationSlug: string, payload: CreateProduccionStockMovementPayload) {
    assertProduccion(applicationSlug);
    return this.repo.createMovement(SLUG, payload);
  }
}
