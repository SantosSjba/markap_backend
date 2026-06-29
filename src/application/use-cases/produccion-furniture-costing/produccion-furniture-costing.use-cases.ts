import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PRODUCCION_FURNITURE_COSTING_REPOSITORY,
  type CreateCostingSnapshotPayload,
  type ProduccionFurnitureCostingRepository,
  type UpdateFurnitureCostingPayload,
} from '@domain/repositories/produccion-furniture-costing.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class GetProduccionFurnitureCostingUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_COSTING_REPOSITORY)
    private readonly repo: ProduccionFurnitureCostingRepository,
  ) {}

  async execute(furnitureId: string, applicationSlug?: string) {
    const row = await this.repo.getCosting(furnitureId, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Mueble no encontrado');
    return row;
  }
}

@Injectable()
export class UpdateProduccionFurnitureCostingUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_COSTING_REPOSITORY)
    private readonly repo: ProduccionFurnitureCostingRepository,
  ) {}

  async execute(furnitureId: string, applicationSlug: string, payload: UpdateFurnitureCostingPayload) {
    assertProduccion(applicationSlug);
    try {
      return await this.repo.updateCosting(furnitureId, SLUG, payload);
    } catch {
      throw new NotFoundException('Mueble no encontrado');
    }
  }
}

@Injectable()
export class CreateProduccionFurnitureCostingSnapshotUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_COSTING_REPOSITORY)
    private readonly repo: ProduccionFurnitureCostingRepository,
  ) {}

  async execute(furnitureId: string, applicationSlug: string, payload: CreateCostingSnapshotPayload) {
    assertProduccion(applicationSlug);
    try {
      return await this.repo.createSnapshot(furnitureId, SLUG, payload);
    } catch {
      throw new NotFoundException('Mueble no encontrado');
    }
  }
}

@Injectable()
export class ListProduccionFurnitureCostingSnapshotsUseCase {
  constructor(
    @Inject(PRODUCCION_FURNITURE_COSTING_REPOSITORY)
    private readonly repo: ProduccionFurnitureCostingRepository,
  ) {}

  execute(furnitureId: string, applicationSlug?: string) {
    return this.repo.listSnapshots(furnitureId, applicationSlug ?? SLUG);
  }
}
