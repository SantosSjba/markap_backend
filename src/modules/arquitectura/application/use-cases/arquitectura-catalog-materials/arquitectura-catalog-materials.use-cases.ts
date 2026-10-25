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
  ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY,
  type ArquitecturaCatalogMaterialDetail,
  type ArquitecturaCatalogMaterialRepository,
  type CreateArquitecturaCatalogMaterialPayload,
  type ListArquitecturaCatalogMaterialsFilters,
  type UpdateArquitecturaCatalogMaterialPayload,
} from '../../../domain/repositories/arquitectura-catalog-material.repository';
const SLUG = 'arquitectura';

function assertArquitectura(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException(
      'Solo aplica para applicationSlug arquitectura',
    );
  }
}

@Injectable()
export class ListArquitecturaCatalogMaterialsUseCase {
  constructor(
    @Inject(ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: ArquitecturaCatalogMaterialRepository,
  ) {}

  execute(filters: ListArquitecturaCatalogMaterialsFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetArquitecturaCatalogMaterialByIdUseCase {
  constructor(
    @Inject(ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: ArquitecturaCatalogMaterialRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug?: string,
  ): Promise<ArquitecturaCatalogMaterialDetail> {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Material no encontrado');
    return row;
  }
}

@Injectable()
export class CreateArquitecturaCatalogMaterialUseCase {
  constructor(
    @Inject(ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: ArquitecturaCatalogMaterialRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async execute(
    applicationSlug: string,
    payload: CreateArquitecturaCatalogMaterialPayload,
  ) {
    assertArquitectura(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id)
      throw new BadRequestException('Aplicación arquitectura no encontrada');

    const dup = await this.references.catalogCodeExists(
      'arquitectura',
      app.id,
      payload.code.trim(),
    );
    if (dup)
      throw new BadRequestException('Ya existe un material con ese código');

    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateArquitecturaCatalogMaterialUseCase {
  constructor(
    @Inject(ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: ArquitecturaCatalogMaterialRepository,
  ) {}

  async execute(
    id: string,
    applicationSlug: string,
    payload: UpdateArquitecturaCatalogMaterialPayload,
  ) {
    assertArquitectura(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class DeleteArquitecturaCatalogMaterialUseCase {
  constructor(
    @Inject(ARQUITECTURA_CATALOG_MATERIAL_REPOSITORY)
    private readonly repo: ArquitecturaCatalogMaterialRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertArquitectura(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Material no encontrado');
    await this.repo.delete(id);
  }
}
