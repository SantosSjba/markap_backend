import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY, CONTABILIDAD_ACCOUNT_REPOSITORY } from '@common/constants/injection-tokens';
import {
  CONTABILIDAD_ACCOUNT_TYPES,
  CONTABILIDAD_ACCOUNT_TYPE_LABELS,
} from '@domain/constants/contabilidad-pcge.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type {
  ContabilidadAccountDto,
  ContabilidadAccountRepository,
  CreateContabilidadAccountInput,
  UpdateContabilidadAccountInput,
} from '@domain/repositories/contabilidad-account.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { buildContabilidadAccountTree } from '@domain/utils/contabilidad-account-tree';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

const VALID_ACCOUNT_TYPES = new Set(Object.values(CONTABILIDAD_ACCOUNT_TYPES));

@Injectable()
export class ContabilidadAccountOperationsService {
  constructor(
    @Inject(CONTABILIDAD_ACCOUNT_REPOSITORY)
    private readonly accounts: ContabilidadAccountRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  async listTree(applicationSlug: string | undefined, search?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);
    const flat = await this.accounts.listFlat(applicationId, search);
    const tree = buildContabilidadAccountTree(flat);
    return { tree, flat, accountTypeLabels: CONTABILIDAD_ACCOUNT_TYPE_LABELS };
  }

  async getById(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const row = await this.accounts.findById(applicationId, id);
    if (!row) throw new EntityNotFoundException('ContabilidadAccount', id);
    return row;
  }

  async create(applicationSlug: string | undefined, body: CreateContabilidadAccountInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    await this.accounts.ensurePcgeSeed(applicationId);

    const parent = await this.accounts.findById(applicationId, body.parentId);
    if (!parent) throw new EntityNotFoundException('ContabilidadAccount', body.parentId);
    if (parent.isMovement) {
      throw new BadRequestException('Solo puede crear cuentas bajo cuentas título (no de movimiento).');
    }
    if (!body.code?.trim() || !body.name?.trim()) {
      throw new BadRequestException('Código y nombre son obligatorios.');
    }
    if (!VALID_ACCOUNT_TYPES.has(body.accountType as (typeof CONTABILIDAD_ACCOUNT_TYPES)[keyof typeof CONTABILIDAD_ACCOUNT_TYPES])) {
      throw new BadRequestException('Tipo de cuenta no válido.');
    }
    if (!body.code.trim().startsWith(parent.code)) {
      throw new BadRequestException(`El código debe iniciar con el prefijo de la cuenta padre (${parent.code}).`);
    }

    const duplicate = await this.accounts.findByCode(applicationId, body.code.trim());
    if (duplicate) throw new BadRequestException(`Ya existe la cuenta con código ${body.code.trim()}.`);

    return this.accounts.create(applicationId, {
      parentId: body.parentId,
      code: body.code.trim(),
      name: body.name.trim(),
      accountType: body.accountType,
      isMovement: body.isMovement,
      sortOrder: body.sortOrder,
    });
  }

  async update(applicationSlug: string | undefined, id: string, body: UpdateContabilidadAccountInput) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.accounts.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadAccount', id);

    if (body.accountType !== undefined && !VALID_ACCOUNT_TYPES.has(body.accountType as never)) {
      throw new BadRequestException('Tipo de cuenta no válido.');
    }

    if (body.code !== undefined && body.code.trim() !== existing.code) {
      if (existing.hasMovements) {
        throw new BadRequestException('No puede cambiar el código de una cuenta con movimientos.');
      }
      const duplicate = await this.accounts.findByCode(applicationId, body.code.trim());
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`Ya existe la cuenta con código ${body.code.trim()}.`);
      }
      if (existing.parentId) {
        const parent = await this.accounts.findById(applicationId, existing.parentId);
        if (parent && !body.code.trim().startsWith(parent.code)) {
          throw new BadRequestException(`El código debe iniciar con el prefijo de la cuenta padre (${parent.code}).`);
        }
      }
    }

    if (body.isMovement === true && (await this.accounts.hasChildren(applicationId, id))) {
      throw new BadRequestException('No puede marcar como cuenta de movimiento si tiene subcuentas.');
    }

    if (body.name !== undefined && !body.name.trim()) {
      throw new BadRequestException('El nombre no puede estar vacío.');
    }

    return this.accounts.update(applicationId, id, {
      ...body,
      code: body.code?.trim(),
      name: body.name?.trim(),
    });
  }

  async deactivate(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const existing = await this.accounts.findById(applicationId, id);
    if (!existing) throw new EntityNotFoundException('ContabilidadAccount', id);

    if (existing.hasMovements) {
      throw new BadRequestException('No puede desactivar una cuenta con movimientos contables.');
    }
    if (await this.accounts.hasChildren(applicationId, id)) {
      throw new BadRequestException('Desactive primero las subcuentas o reasígnelas.');
    }

    return this.accounts.deactivate(applicationId, id);
  }
}
