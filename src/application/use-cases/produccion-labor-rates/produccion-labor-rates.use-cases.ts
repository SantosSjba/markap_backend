import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_LABOR_RATE_REPOSITORY,
  type CreateProduccionLaborRatePayload,
  type ListProduccionLaborRatesFilters,
  type ProduccionLaborRateRepository,
  type UpdateProduccionLaborRatePayload,
} from '@domain/repositories/produccion-labor-rate.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionLaborRatesUseCase {
  constructor(
    @Inject(PRODUCCION_LABOR_RATE_REPOSITORY)
    private readonly repo: ProduccionLaborRateRepository,
  ) {}

  execute(filters: ListProduccionLaborRatesFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionLaborRateByIdUseCase {
  constructor(
    @Inject(PRODUCCION_LABOR_RATE_REPOSITORY)
    private readonly repo: ProduccionLaborRateRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Tarifa no encontrada');
    return row;
  }
}

@Injectable()
export class CreateProduccionLaborRateUseCase {
  constructor(
    @Inject(PRODUCCION_LABOR_RATE_REPOSITORY)
    private readonly repo: ProduccionLaborRateRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionLaborRatePayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionLaborRateUseCase {
  constructor(
    @Inject(PRODUCCION_LABOR_RATE_REPOSITORY)
    private readonly repo: ProduccionLaborRateRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionLaborRatePayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Tarifa no encontrada');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteProduccionLaborRateUseCase {
  constructor(
    @Inject(PRODUCCION_LABOR_RATE_REPOSITORY)
    private readonly repo: ProduccionLaborRateRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Tarifa no encontrada');
    await this.repo.delete(id);
  }
}
