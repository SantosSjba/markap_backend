import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  INTERIOR_MATERIAL_SUPPLIER_REPOSITORY,
  type CreateInteriorMaterialSupplierPayload,
  type InteriorMaterialSupplierRepository,
  type InteriorSupplierDetail,
  type ListInteriorMaterialSuppliersFilters,
  type RecordInteriorMaterialPurchasePayload,
  type UpdateInteriorMaterialSupplierPayload,
} from '@domain/repositories/interior-material-supplier.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

const SLUG = 'interiorismo';

function assertInteriorismo(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug interiorismo');
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

  async execute(id: string, applicationSlug?: string): Promise<InteriorSupplierDetail> {
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
    private readonly prisma: PrismaService,
  ) {}

  async execute(applicationSlug: string, payload: CreateInteriorMaterialSupplierPayload) {
    assertInteriorismo(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación interiorismo no encontrada');

    const dup = await this.prisma.interiorMaterialSupplier.findFirst({
      where: { applicationId: app.id, ruc: payload.ruc.trim() },
    });
    if (dup) throw new BadRequestException('Ya existe un proveedor con ese RUC');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateInteriorMaterialSupplierUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateInteriorMaterialSupplierPayload) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Proveedor no encontrado');

    if (payload.ruc?.trim()) {
      const cur = await this.prisma.interiorMaterialSupplier.findUnique({
        where: { id },
        select: { applicationId: true },
      });
      if (!cur) throw new NotFoundException('Proveedor no encontrado');

      const dup = await this.prisma.interiorMaterialSupplier.findFirst({
        where: {
          applicationId: cur.applicationId,
          ruc: payload.ruc.trim(),
          NOT: { id },
        },
      });
      if (dup) throw new BadRequestException('Ya existe otro proveedor con ese RUC');
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
      return await this.repo.linkCatalogMaterial(supplierId, catalogMaterialId, supplierSku, notes);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Este material ya está vinculado al proveedor');
      }
      throw e;
    }
  }
}

@Injectable()
export class UnlinkInteriorSupplierCatalogMaterialUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(linkId: string, applicationSlug: string) {
    assertInteriorismo(applicationSlug);
    const link = await this.prisma.interiorSupplierCatalogLink.findUnique({
      where: { id: linkId },
      include: { supplier: { include: { application: { select: { slug: true } } } } },
    });
    if (!link) throw new NotFoundException('Vínculo no encontrado');
    if (link.supplier.application.slug !== SLUG) throw new NotFoundException('Vínculo no encontrado');

    await this.repo.unlinkCatalogMaterial(linkId);
  }
}

@Injectable()
export class RecordInteriorMaterialPurchaseUseCase {
  constructor(
    @Inject(INTERIOR_MATERIAL_SUPPLIER_REPOSITORY)
    private readonly repo: InteriorMaterialSupplierRepository,
  ) {}

  async execute(supplierId: string, applicationSlug: string, payload: RecordInteriorMaterialPurchasePayload) {
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
