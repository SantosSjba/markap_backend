import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import {
  PRODUCCION_WORK_ORDER_REPOSITORY,
  type ConsumeProduccionWorkOrderMaterialPayload,
  type CreateProduccionWorkOrderPayload,
  type ListProduccionWorkOrdersFilters,
  type ProduccionWorkOrderRepository,
  type UpdateProduccionWorkOrderPayload,
  type UpdateProduccionWorkOrderStagePayload,
} from '@domain/repositories/produccion-work-order.repository';

const SLUG = 'produccion';

function assertProduccion(slug: string) {
  if (slug.trim() !== SLUG) {
    throw new BadRequestException('Solo aplica para applicationSlug produccion');
  }
}

@Injectable()
export class ListProduccionWorkOrdersUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  execute(filters: ListProduccionWorkOrdersFilters) {
    return this.repo.list(filters);
  }
}

@Injectable()
export class GetProduccionWorkOrderStatsUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  execute(applicationSlug?: string) {
    return this.repo.getStats(applicationSlug ?? SLUG);
  }
}

@Injectable()
export class GetProduccionWorkOrderByIdUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug?: string) {
    const row = await this.repo.findById(id, applicationSlug ?? SLUG);
    if (!row) throw new NotFoundException('Orden de trabajo no encontrada');
    return row;
  }
}

@Injectable()
export class CreateProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(applicationSlug: string, payload: CreateProduccionWorkOrderPayload) {
    assertProduccion(applicationSlug);
    const app = await this.applications.findBySlug(SLUG);
    if (!app?.id) throw new BadRequestException('Aplicación produccion no encontrada');
    return this.repo.create(app.id, payload);
  }
}

@Injectable()
export class UpdateProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string, payload: UpdateProduccionWorkOrderPayload) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.update(id, payload);
  }
}

@Injectable()
export class StartProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.start(id);
  }
}

@Injectable()
export class UpdateProduccionWorkOrderStageUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(
    id: string,
    stageId: string,
    applicationSlug: string,
    payload: UpdateProduccionWorkOrderStagePayload,
  ) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.updateStage(id, stageId, payload);
  }
}

@Injectable()
export class CompleteProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.complete(id);
  }
}

@Injectable()
export class CancelProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.cancel(id);
  }
}

@Injectable()
export class ConsumeProduccionWorkOrderMaterialsUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string, items: ConsumeProduccionWorkOrderMaterialPayload[]) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    return this.repo.consumeMaterials(id, items);
  }
}

@Injectable()
export class DeleteProduccionWorkOrderUseCase {
  constructor(
    @Inject(PRODUCCION_WORK_ORDER_REPOSITORY)
    private readonly repo: ProduccionWorkOrderRepository,
  ) {}

  async execute(id: string, applicationSlug: string) {
    assertProduccion(applicationSlug);
    const exists = await this.repo.findById(id, SLUG);
    if (!exists) throw new NotFoundException('Orden de trabajo no encontrada');
    await this.repo.delete(id);
  }
}
