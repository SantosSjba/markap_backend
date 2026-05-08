import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INTERIOR_FINANCE_REPOSITORY,
  type CreateInteriorFinancePaymentPayload,
  type CreateInteriorFinanceSchedulePayload,
  type InteriorFinanceRepository,
  type UpdateInteriorFinancePaymentPayload,
  type UpdateInteriorFinanceSchedulePayload,
} from '@domain/repositories/interior-finance.repository';

const SLUG_DFLT = 'interiorismo';

const SCHEDULE_KINDS = ['ADVANCE', 'INSTALLMENT', 'OTHER'] as const;
const SCHEDULE_STATUS = ['PENDING', 'PARTIAL', 'PAID', 'WAIVED'] as const;
const PAY_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;

function assertScheduleKind(v: string) {
  if (!(SCHEDULE_KINDS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Tipo de cuota inválido. Use: ${SCHEDULE_KINDS.join(', ')}`);
  }
}

function assertScheduleStatus(v: string) {
  if (!(SCHEDULE_STATUS as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado de programación inválido: ${SCHEDULE_STATUS.join(', ')}`);
  }
}

function assertPaymentStatus(v: string) {
  if (!(PAY_STATUSES as readonly string[]).includes(v)) {
    throw new BadRequestException(`Estado de pago inválido: ${PAY_STATUSES.join(', ')}`);
  }
}

function mapRepoError(e: unknown): never {
  const msg = e instanceof Error ? e.message : '';
  if (msg === 'PROJECT_NOT_FOUND') throw new NotFoundException('Proyecto no encontrado');
  if (msg === 'SCHEDULE_NOT_FOUND') throw new NotFoundException('Programación de cobro no encontrada');
  if (msg === 'PAYMENT_NOT_FOUND') throw new NotFoundException('Pago no encontrado');
  if (msg === 'SCHEDULE_LINK_INVALID') {
    throw new BadRequestException('La cuota vinculada no pertenece al proyecto');
  }
  throw e instanceof Error ? e : new BadRequestException('Error en operación financiera');
}

@Injectable()
export class GetInteriorFinanceOverviewUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  execute(projectId: string, applicationSlug?: string) {
    return this.repo.getOverview(projectId, applicationSlug ?? SLUG_DFLT);
  }
}

@Injectable()
export class CreateInteriorFinanceScheduleUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateInteriorFinanceSchedulePayload,
  ) {
    assertScheduleKind(payload.kind);
    if (payload.amount <= 0) throw new BadRequestException('El monto debe ser mayor a cero');
    try {
      return await this.repo.createSchedule(projectId, applicationSlug ?? SLUG_DFLT, payload);
    } catch (e) {
      mapRepoError(e);
    }
  }
}

@Injectable()
export class UpdateInteriorFinanceScheduleUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorFinanceSchedulePayload,
  ) {
    if (payload.kind !== undefined) assertScheduleKind(payload.kind);
    if (payload.status !== undefined) assertScheduleStatus(payload.status);
    if (payload.amount !== undefined && payload.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    try {
      return await this.repo.updateSchedule(projectId, scheduleId, applicationSlug ?? SLUG_DFLT, payload);
    } catch (e) {
      mapRepoError(e);
    }
  }
}

@Injectable()
export class DeleteInteriorFinanceScheduleUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(projectId: string, scheduleId: string, applicationSlug?: string) {
    try {
      await this.repo.deleteSchedule(projectId, scheduleId, applicationSlug ?? SLUG_DFLT);
    } catch (e) {
      mapRepoError(e);
    }
  }
}

@Injectable()
export class CreateInteriorFinancePaymentUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateInteriorFinancePaymentPayload,
  ) {
    assertPaymentStatus(payload.status);
    if (payload.amount <= 0) throw new BadRequestException('El monto debe ser mayor a cero');
    try {
      return await this.repo.createPayment(projectId, applicationSlug ?? SLUG_DFLT, payload);
    } catch (e) {
      mapRepoError(e);
    }
  }
}

@Injectable()
export class UpdateInteriorFinancePaymentUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
    payload: UpdateInteriorFinancePaymentPayload,
  ) {
    if (payload.status !== undefined) assertPaymentStatus(payload.status);
    if (payload.amount !== undefined && payload.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
    try {
      return await this.repo.updatePayment(projectId, paymentId, applicationSlug ?? SLUG_DFLT, payload);
    } catch (e) {
      mapRepoError(e);
    }
  }
}

@Injectable()
export class DeleteInteriorFinancePaymentUseCase {
  constructor(
    @Inject(INTERIOR_FINANCE_REPOSITORY)
    private readonly repo: InteriorFinanceRepository,
  ) {}

  async execute(projectId: string, paymentId: string, applicationSlug?: string) {
    try {
      await this.repo.deletePayment(projectId, paymentId, applicationSlug ?? SLUG_DFLT);
    } catch (e) {
      mapRepoError(e);
    }
  }
}
