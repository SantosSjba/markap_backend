import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import {
  PRODUCCION_FURNITURE_REPOSITORY,
  type CreateProduccionFurniturePayload,
  type ListProduccionFurnitureFilters,
  type ProduccionFurnitureDetail,
  type ProduccionFurnitureRepository,
  type UpdateProduccionFurniturePayload,
} from '../../../domain/repositories/produccion-furniture.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException(
      'Solo aplica para applicationSlug produccion',
    );
  }
}

@Injectable()
export class ListProduccionFurnitureUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
  ) {}

  execute(filters: ListProduccionFurnitureFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionFurnitureStatsUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
  ) {}

  execute(applicationSlug?: string) {
    return this.repo.getStats(applicationSlug ?? SLUG);
  }
}

@Injectable()
export class GetProduccionFurnitureByIdUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug?: string,
  ): Promise<ProduccionFurnitureDetail> {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Mueble no encontrado');
    return row;
  }
}

@Injectable()
export class CreateProduccionFurnitureUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    applicationSlug: string,
    payload: CreateProduccionFurniturePayload,
  ) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id)
      throw new BadRequestException('Aplicación produccion no encontrada');

    const dup = await this.references.catalogCodeExists(
      'produccion',
      app.id,
      payload.code.trim(),
    );
    if (dup)
      throw new BadRequestException('Ya existe un mueble con ese código');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionFurnitureUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug: string,
    payload: UpdateProduccionFurniturePayload,
  ) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Mueble no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteProduccionFurnitureUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_REPOSITORY)
    private readonly repo: ProduccionFurnitureRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Mueble no encontrado');
    await this.repo.delete(id);
  }
}
