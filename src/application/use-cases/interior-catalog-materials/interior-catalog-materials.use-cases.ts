import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  INTERIOR_CATALOG_MATERIAL_REPOSITORY,
  type CreateInteriorCatalogMaterialPayload,
  type InteriorCatalogMaterialDetail,
  type InteriorCatalogMaterialRepository,
  type ListInteriorCatalogMaterialsFilters,
  type UpdateInteriorCatalogMaterialPayload,
} from '@domain/repositories/interior-catalog-material.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

const SLUG = 'interiorismo';

function assertInteriorismo(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug interiorismo');
  }
}

@Injectable()
export class ListInteriorCatalogMaterialsUseCase {
  constructor(
    @Inject(INTERIOR_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: InteriorCatalogMaterialRepository,
  ) {}

  execute(filters: ListInteriorCatalogMaterialsFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetInteriorCatalogMaterialByIdUseCase {
  constructor(
    @Inject(INTERIOR_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: InteriorCatalogMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug?: string): Promise<InteriorCatalogMaterialDetail> {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Material no encontrado');
    return row;
  }
}

@Injectable()
export class CreateInteriorCatalogMaterialUseCase {
  constructor(
    @Inject(INTERIOR_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: InteriorCatalogMaterialRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(applicationSlug: string, payload: CreateInteriorCatalogMaterialPayload) {
    assertInteriorismo(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación interiorismo no encontrada');

    const dup = await this.prisma.interiorCatalogMaterial.findFirst({
      where: { applicationId: app.id, code: payload.code.trim() },
    });
    if (dup) throw new BadRequestException('Ya existe un material con ese código');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateInteriorCatalogMaterialUseCase {
  constructor(
    @Inject(INTERIOR_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: InteriorCatalogMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateInteriorCatalogMaterialPayload) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteInteriorCatalogMaterialUseCase {
  constructor(
    @Inject(INTERIOR_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: InteriorCatalogMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertInteriorismo(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    await this.repo.delete(id);
  }
}
