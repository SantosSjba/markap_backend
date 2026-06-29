import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_SUPPLIER_REPOSITORY,
  type CreateProduccionSupplierPayload,
  type ListProduccionSuppliersFilters,
  type ProduccionSupplierRepository,
  type UpdateProduccionSupplierPayload,
} from '@domain/repositories/produccion-supplier.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionSuppliersUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  execute(filters: ListProduccionSuppliersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionSupplierByIdUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Proveedor no encontrado');
    return row;
  }
}

@Injectable()
export class CreateProduccionSupplierUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionSupplierPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionSupplierUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionSupplierPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteProduccionSupplierUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');
    await this.repo.delete(id);
  }
}

@Injectable()
export class LinkProduccionSupplierMaterialUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  async execute(
    supplierId: string,
    applicationSlug: string,
    materialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(supplierId, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');
    return this.repo.linkMaterial(supplierId, materialId, supplierSku, notes);
  }
}

@Injectable()
export class UnlinkProduccionSupplierMaterialUseCase {
  constructor(
    @Inject(PRODUCCION_SUPPLIER_REPOSITORY)
    private readonly repo: ProduccionSupplierRepository,
  ) {}

  async execute(linkId: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    await this.repo.unlinkMaterial(linkId);
  }
}
