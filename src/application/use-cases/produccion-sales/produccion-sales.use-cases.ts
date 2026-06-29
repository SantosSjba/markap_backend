import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_ORDER_REPOSITORY,
  PRODUCCION_QUOTATION_REPOSITORY,
  PRODUCCION_DELIVERY_REPOSITORY,
  type CreateProduccionDeliveryPayload,
  type CreateProduccionOrderPayload,
  type CreateProduccionQuotationPayload,
  type ListProduccionDeliveriesFilters,
  type ListProduccionOrdersFilters,
  type ListProduccionQuotationsFilters,
  type ProduccionDeliveryRepository,
  type ProduccionOrderRepository,
  type ProduccionQuotationRepository,
  type UpdateProduccionDeliveryPayload,
  type UpdateProduccionOrderPayload,
  type UpdateProduccionQuotationPayload,
} from '@domain/repositories/produccion-sales.repository';
import {
  PRODUCCION_WORK_ORDER_REPOSITORY,
  type ProduccionWorkOrderRepository,
} from '@domain/repositories/produccion-work-order.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionQuotationsUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  execute(filters: ListProduccionQuotationsFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionQuotationByIdUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return row;
  }
}

@Injectable()
export class CreateProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionQuotationPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionQuotationPayload) {
    assertProduccion(applicationSlug);
    await this.getOrFail(id, applicationSlug);
    return this.repo.update(id, payload);
  }

  private async getOrFail(id: string, applicationSlug: string) {
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return row;
  }
}

@Injectable()
export class SendProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return this.repo.send(id);
  }
}

@Injectable()
export class AcceptProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return this.repo.accept(id);
  }
}

@Injectable()
export class RejectProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return this.repo.reject(id);
  }
}

@Injectable()
export class ConvertProduccionQuotationToOrderUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return this.repo.convertToOrder(id);
  }
}

@Injectable()
export class DeleteProduccionQuotationUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly repo: ProduccionQuotationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Cotización no encontrada');
    await this.repo.delete(id);
  }
}

@Injectable()
export class ListProduccionOrdersUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  execute(filters: ListProduccionOrdersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionOrderByIdUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return row;
  }
}

@Injectable()
export class CreateProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionOrderPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionOrderPayload) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class ConfirmProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.repo.confirm(id);
  }
}

@Injectable()
export class CreateWorkOrderFromProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly orderRepo: ProduccionOrderRepository,
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly workOrderRepo: ProduccionWorkOrderRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const order = await this.orderRepo.findById(id, applicationSlug);
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.workOrderId) {
      throw new BadRequestException('El pedido ya tiene una orden de trabajo');
    }
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('El pedido no puede generar OT en este estado');
    }

    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');

    const wo = await this.workOrderRepo.create(app.id, {
      clientId: order.clientId,
      notes: `Generada desde pedido ${order.code}`,
      lines: order.lines.map((l) => ({
        furnitureId: l.furnitureId,
        quantity: l.quantity,
        notes: l.notes,
      })),
    });

    return this.orderRepo.linkWorkOrder(id, wo.id);
  }
}

@Injectable()
export class MarkProduccionOrderReadyUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.repo.markReady(id);
  }
}

@Injectable()
export class CancelProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.repo.cancel(id);
  }
}

@Injectable()
export class DeleteProduccionOrderUseCase {
  constructor(
    @Inject(PRODUCCION_ORDER_REPOSITORY)
    private readonly repo: ProduccionOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Pedido no encontrado');
    await this.repo.delete(id);
  }
}

@Injectable()
export class ListProduccionDeliveriesUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  execute(filters: ListProduccionDeliveriesFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionDeliveryByIdUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Entrega no encontrada');
    return row;
  }
}

@Injectable()
export class CreateProduccionDeliveryUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionDeliveryPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionDeliveryUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionDeliveryPayload) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Entrega no encontrada');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class CompleteProduccionDeliveryUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Entrega no encontrada');
    return this.repo.complete(id);
  }
}

@Injectable()
export class CancelProduccionDeliveryUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Entrega no encontrada');
    return this.repo.cancel(id);
  }
}

@Injectable()
export class DeleteProduccionDeliveryUseCase {
  constructor(
    @Inject(PRODUCCION_DELIVERY_REPOSITORY)
    private readonly repo: ProduccionDeliveryRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const row = await this.repo.findById(id, applicationSlug);
    if (!row) throw new NotFoundException('Entrega no encontrada');
    await this.repo.delete(id);
  }
}
