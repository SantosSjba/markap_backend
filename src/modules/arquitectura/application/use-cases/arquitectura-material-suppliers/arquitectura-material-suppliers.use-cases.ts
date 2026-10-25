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
  ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY,
  type ArquitecturaMaterialSupplierRepository,
  type ArquitecturaSupplierDetail,
  type CreateArquitecturaMaterialSupplierPayload,
  type ListArquitecturaMaterialSuppliersFilters,
  type RecordArquitecturaMaterialPurchasePayload,
  type UpdateArquitecturaMaterialSupplierPayload,
} from '../../../domain/repositories/arquitectura-material-supplier.repository';
const SLUG = 'arquitectura';

function assertArquitectura(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException(
      'Solo aplica para applicationSlug arquitectura',
    );
  }
}

@Injectable()
export class ListArquitecturaMaterialSuppliersUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  execute(filters: ListArquitecturaMaterialSuppliersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetArquitecturaMaterialSupplierByIdUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug?: string,
  ): Promise<ArquitecturaSupplierDetail> {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Proveedor no encontrado');
    return row;
  }
}

@Injectable()
export class CreateArquitecturaMaterialSupplierUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    applicationSlug: string,
    payload: CreateArquitecturaMaterialSupplierPayload,
  ) {
    assertArquitectura(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id)
      throw new BadRequestException('Aplicación arquitectura no encontrada');

    const dup = await this.references.supplierRucExists(
      'arquitectura',
      app.id,
      payload.ruc.trim(),
    );
    if (dup)
      throw new BadRequestException('Ya existe un proveedor con ese RUC');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateArquitecturaMaterialSupplierUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    id: string,
    applicationSlug: string,
    payload: UpdateArquitecturaMaterialSupplierPayload,
  ) {
    assertArquitectura(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');

    if (payload.ruc?.trim()) {
      const cur = await this.references.findSupplierScope('arquitectura', id);
      if (!cur) throw new NotFoundException('Proveedor no encontrado');

      const dup = await this.references.supplierRucExists(
        'arquitectura',
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
export class DeleteArquitecturaMaterialSupplierUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertArquitectura(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');
    await this.repo.delete(id);
  }
}

@Injectable()
export class LinkArquitecturaSupplierCatalogMaterialUseCase {
  constructor(
    private readonly persistenceErrors: PersistenceErrorPort,

    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  async execute(
    supplierId: string,
    applicationSlug: string,
    catalogMaterialId: string,
    supplierSku?: string | null,
    notes?: string | null,
  ) {
    assertArquitectura(applicationSlug);
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
export class UnlinkArquitecturaSupplierCatalogMaterialUseCase {
  constructor(
    private readonly references: BusinessReferencePort,
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  async execute(linkId: string, applicationSlug: string) {
    assertArquitectura(applicationSlug);
    const link = await this.references.findSupplierLink('arquitectura', linkId);
    if (!link) throw new NotFoundException('Vínculo no encontrado');
    if (link.supplier.application.slug !== SLUG)
      throw new NotFoundException('Vínculo no encontrado');

    await this.repo.unlinkCatalogMaterial(linkId);
  }
}

@Injectable()
export class RecordArquitecturaMaterialPurchaseUseCase {
  constructor(
    @Inject(ARQUITECTURA_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: ArquitecturaMaterialSupplierRepository,
  ) {}

  async execute(
    supplierId: string,
    applicationSlug: string,
    payload: RecordArquitecturaMaterialPurchasePayload,
  ) {
    assertArquitectura(applicationSlug);
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
