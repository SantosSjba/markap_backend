import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ARQUITECTURA_FINANCE_REPOSITORY,
  type CreateArquitecturaFinancePaymentPayload,
  type CreateArquitecturaFinanceSchedulePayload,
  type ArquitecturaFinanceRepository,
  type UpdateArquitecturaFinancePaymentPayload,
  type UpdateArquitecturaFinanceSchedulePayload,
} from '@domain/repositories/arquitectura-finance.repository';

const SLUG_DFLT = 'arquitectura';

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
export class GetArquitecturaFinanceOverviewUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  execute(projectId: string, applicationSlug?: string) {
    return this.repo.getOverview(projectId, applicationSlug ?? SLUG_DFLT);
  }
}

@Injectable()
export class CreateArquitecturaFinanceScheduleUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinanceSchedulePayload,
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
export class UpdateArquitecturaFinanceScheduleUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    scheduleId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinanceSchedulePayload,
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
export class DeleteArquitecturaFinanceScheduleUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
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
export class CreateArquitecturaFinancePaymentUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    applicationSlug: string | undefined,
    payload: CreateArquitecturaFinancePaymentPayload,
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
export class UpdateArquitecturaFinancePaymentUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  async execute(
    projectId: string,
    paymentId: string,
    applicationSlug: string | undefined,
    payload: UpdateArquitecturaFinancePaymentPayload,
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
export class DeleteArquitecturaFinancePaymentUseCase {
  constructor(
    @Inject(ARQUITECTURA_FINANCE_REPOSITORY)
    private readonly repo: ArquitecturaFinanceRepository,
  ) {}

  async execute(projectId: string, paymentId: string, applicationSlug?: string) {
    try {
      await this.repo.deletePayment(projectId, paymentId, applicationSlug ?? SLUG_DFLT);
    } catch (e) {
      mapRepoError(e);
    }
  }
}
