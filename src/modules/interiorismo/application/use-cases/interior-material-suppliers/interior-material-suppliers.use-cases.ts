import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessReferencePort } from '../../../../../shared/application/ports/business-reference.port';
import { PersistenceErrorPort } from '../../../../../shared/application/ports/persistence-error.port';

import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import {
  INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
  type CreateInteriorMaterialSupplierPayload,
  type InteriorMaterialSupplierRepository,
  type InteriorSupplierDetail,
  type ListInteriorMaterialSuppliersFilters,
  type RecordInteriorMaterialPurchasePayload,
  type UpdateInteriorMaterialSupplierPayload,
} from '../../../domain/repositories/interior-material-supplier.repository';

const SLUG = 'interiorismo';

function assertInteriorismo(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException(
      'Solo aplica para applicationSlug interiorismo',
    );
  }
}

@Injectable()
export class ListInteriorMaterialSuppliersUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  execute(filters: ListInteriorMaterialSuppliersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetInteriorMaterialSupplierByIdUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug?: string,
  ): Promise<InteriorSupplierDetail> {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Proveedor no encontrado');
    return row;
  }
}

@Injectable()
export class CreateInteriorMaterialSupplierUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    applicationSlug: string,
    payload: CreateInteriorMaterialSupplierPayload,
  ) {
    assertInteriorismo(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id)
      throw new BadRequestException('Aplicación interiorismo no encontrada');

    const dup = await this.references.supplierRucExists(
      'interiorismo',
      app.id,
      payload.ruc.trim(),
    );
    if (dup)
      throw new BadRequestException('Ya existe un proveedor con ese RUC');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateInteriorMaterialSupplierUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    id: string,
    applicationSlug: string,
    payload: UpdateInteriorMaterialSupplierPayload,
  ) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');

    if (payload.ruc?.trim()) {
      const cur = await this.references.findSupplierScope('interiorismo', id);
      if (!cur) throw new NotFoundException('Proveedor no encontrado');

      const dup = await this.references.supplierRucExists(
        'interiorismo',
        cur.applicationId,
        payload.ruc.trim(),
        id,
      );
      if (dup)
        throw new BadRequestException('Ya existe otro proveedor con ese RUC');
    }

    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteInteriorMaterialSupplierUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');
    await this.repo.delete(id);
  }
}

@Injectable()
export class LinkInteriorSupplierCatalogMaterialUseCase {
  constructor(
    private readonly persistenceErrors: PersistenceErrorPort,

    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(
    supplierId: string,
    applicationSlug: string,
    catalogMaterialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(supplierId, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');

    try {
      return await this.repo.linkCatalogMaterial(
        supplierId,
        catalogMaterialId,
        supplierSku,
        notes,
      );
    } catch (e) {
      if (this.persistenceErrors.isUniqueConflict(e)) {
        throw new BadRequestException(
          'Este material ya está vinculado al proveedor',
        );
      }
      throw e;
    }
  }
}

@Injectable()
export class UnlinkInteriorSupplierCatalogMaterialUseCase {
  constructor(
    private readonly references: BusinessReferencePort,
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(linkId: string, applicationSlug: string) {
    assertInteriorismo(applicationSlug);
    const link = await this.references.findSupplierLink('interiorismo', linkId);
    if (!link) throw new NotFoundException('Vínculo no encontrado');
    if (link.supplier.application.slug !== SLUG)
      throw new NotFoundException('Vínculo no encontrado');

    await this.repo.unlinkCatalogMaterial(linkId);
  }
}

@Injectable()
export class RecordInteriorMaterialPurchaseUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(
    supplierId: string,
    applicationSlug: string,
    payload: RecordInteriorMaterialPurchasePayload,
  ) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(supplierId, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');

    try {
      return await this.repo.recordPurchase(supplierId, payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('inválido')) throw new BadRequestException(msg);
      throw e;
    }
  }
}

/** Indicadores de proveedores: con materiales, con partidas en proyectos y compras del mes. */
@Injectable()
export class GetInteriorMaterialSupplierStatsUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  execute(applicationSlug: string) {
    assertInteriorismo(applicationSlug);
    return this.repo.stats(SLUG);
  }
}
