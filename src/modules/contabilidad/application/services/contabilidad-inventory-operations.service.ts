import { mapOperationError } from '../../../../shared/application/errors/map-operation-error';
import { PersistenceErrorPort } from '../../../../shared/application/ports/persistence-error.port';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import {
  CONTABILIDAD_INVENTORY_COST_METHOD_LABELS,
  CONTABILIDAD_INVENTORY_MOVEMENT_TYPE_LABELS,
  CONTABILIDAD_INVENTORY_OFFSET_TYPE_LABELS,
} from '../../domain/constants/contabilidad-inventory.defaults';
import type {
  ContabilidadInventoryRepository,
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  ListInventoryItemsFilters,
  ListInventoryMovementsFilters,
  UpdateInventoryItemInput,
} from '../../domain/repositories/contabilidad-inventory.repository';
import { CONTABILIDAD_INVENTORY_REPOSITORY } from '../../domain/repositories/contabilidad-inventory.repository';
import type { ContabilidadPeriodRepository } from '../../domain/repositories/contabilidad-period.repository';
import { CONTABILIDAD_PERIOD_REPOSITORY } from '../../domain/repositories/contabilidad-period.repository';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException(
      'Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).',
    );
  }
}

@Injectable()
export class ContabilidadInventoryOperationsService {
  constructor(
    private readonly persistenceErrors: PersistenceErrorPort,

    @Inject(CONTABILIDAD_INVENTORY_REPOSITORY)
    private readonly inventory: ContabilidadInventoryRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(
    applicationSlug?: string,
  ): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app)
      throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  getCatalog() {
    return {
      movementTypeLabels: CONTABILIDAD_INVENTORY_MOVEMENT_TYPE_LABELS,
      costMethodLabels: CONTABILIDAD_INVENTORY_COST_METHOD_LABELS,
      offsetTypeLabels: CONTABILIDAD_INVENTORY_OFFSET_TYPE_LABELS,
    };
  }

  async listItems(
    applicationSlug: string | undefined,
    filters: ListInventoryItemsFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.inventory.listItems(applicationId, filters);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async getItem(applicationSlug: string | undefined, id: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      const item = await this.inventory.getItem(applicationId, id);
      if (!item)
        throw new EntityNotFoundException('ContabilidadInventoryItem', id);
      return item;
    } catch (e) {
      if (e instanceof EntityNotFoundException) throw e;
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async createItem(
    applicationSlug: string | undefined,
    body: CreateInventoryItemInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.code?.trim()) throw new BadRequestException('Código obligatorio');
    if (!body.description?.trim())
      throw new BadRequestException('Descripción obligatoria');
    if (!body.accountId)
      throw new BadRequestException('Cuenta de inventario obligatoria');
    try {
      return await this.inventory.createItem(applicationId, body);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async updateItem(
    applicationSlug: string | undefined,
    id: string,
    body: UpdateInventoryItemInput,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.inventory.updateItem(applicationId, id, body);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async listMovements(
    applicationSlug: string | undefined,
    filters: ListInventoryMovementsFilters,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.inventory.listMovements(applicationId, filters);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async createMovement(
    applicationSlug: string | undefined,
    body: CreateInventoryMovementInput,
    userId?: string | null,
  ) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!body.itemId) throw new BadRequestException('itemId obligatorio');
    if (!body.periodId) throw new BadRequestException('periodId obligatorio');
    if (!body.movementType)
      throw new BadRequestException('movementType obligatorio');
    if (!body.movementDate)
      throw new BadRequestException('movementDate obligatorio');
    const period = await this.periods.findPeriodById(
      applicationId,
      body.periodId,
    );
    if (!period)
      throw new EntityNotFoundException('ContabilidadPeriod', body.periodId);
    try {
      return await this.inventory.createMovement(applicationId, body, userId);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async getKardex(applicationSlug: string | undefined, itemId: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.inventory.getKardex(applicationId, itemId);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }

  async getValuedBalance(applicationSlug?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.inventory.getValuedBalance(applicationId);
    } catch (e) {
      return mapOperationError(e, this.persistenceErrors);
    }
  }
}
