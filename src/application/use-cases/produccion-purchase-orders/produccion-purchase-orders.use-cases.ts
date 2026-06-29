import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_PURCHASE_ORDER_REPOSITORY,
  type CreateProduccionPurchaseOrderPayload,
  type ListProduccionPurchaseOrdersFilters,
  type ProduccionPurchaseOrderRepository,
  type ReceiveProduccionPurchaseOrderPayload,
  type UpdateProduccionPurchaseOrderPayload,
} from '@domain/repositories/produccion-purchase-order.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionPurchaseOrdersUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  execute(filters: ListProduccionPurchaseOrdersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionPurchaseOrderByIdUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Orden de compra no encontrada');
    return row;
  }
}

@Injectable()
export class CreateProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionPurchaseOrderPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionPurchaseOrderPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de compra no encontrada');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class SendProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de compra no encontrada');
    return this.repo.send(id);
  }
}

@Injectable()
export class ReceiveProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: ReceiveProduccionPurchaseOrderPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de compra no encontrada');
    return this.repo.receive(id, payload);
  }
}

@Injectable()
export class CancelProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de compra no encontrada');
    return this.repo.cancel(id);
  }
}

@Injectable()
export class DeleteProduccionPurchaseOrderUseCase {
  constructor(
    @Inject(PRODUCCION_PURCHASE_ORDER_REPOSITORY)
    private readonly repo: ProduccionPurchaseOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de compra no encontrada');
    await this.repo.delete(id);
  }
}
