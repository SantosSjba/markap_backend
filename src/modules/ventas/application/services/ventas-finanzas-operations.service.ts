import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../shared/application/ports/business-reference.port';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import type { AgentRepository } from '../../../crm/domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../../crm/domain/repositories/agent.repository';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import {
  type ListBuyerPaymentsFilters,
  type ListCommissionsFilters,
  type ListDocCostsFilters,
  VENTAS_BUYER_PAYMENT_KINDS,
  VENTAS_DOC_COST_TYPES,
  VENTAS_FINANZAS_REPOSITORY,
  type VentasBuyerPaymentKind,
  type VentasDocCostType,
  type VentasFinanzasRepository,
} from '../../domain/repositories/ventas-finanzas.repository';
import { roundMoney } from '../../../../shared/utils/sale-commission.util';
import { assertActiveSaleCurrency } from '../validators/sale-currency.validator';

const VENTAS_SLUG = 'ventas';

function assertVentasApp(slug: string | undefined | null): void {
  if (slug?.trim() !== VENTAS_SLUG) {
    throw new BadRequestException(
      'Estas operaciones solo aplican a la aplicación Ventas (applicationSlug=ventas).',
    );
  }
}

function isBuyerPaymentKind(v: string): v is VentasBuyerPaymentKind {
  return (VENTAS_BUYER_PAYMENT_KINDS as readonly string[]).includes(v);
}

function isDocCostType(v: string): v is VentasDocCostType {
  return (VENTAS_DOC_COST_TYPES as readonly string[]).includes(v);
}

function parseValidDateOrThrow(value: string, fieldLabel: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${fieldLabel} inválida.`);
  }
  return d;
}

@Injectable()
export class VentasFinanzasOperationsService {
  constructor(
    @Inject(VENTAS_FINANZAS_REPOSITORY)
    private readonly finanzas: VentasFinanzasRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  private async resolveVentasApplicationId(
    applicationSlug?: string,
  ): Promise<string> {
    assertVentasApp(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  /** Sin moneda indicada se usa la de la venta (no se asume PEN en ventas en dólares). */
  private async resolveClosingCurrency(
    saleClosingId: string,
    applicationId: string,
    requested?: string | null,
  ): Promise<string> {
    const saleCurrency = await this.finanzas.getClosingCurrency(
      saleClosingId,
      applicationId,
    );
    const code = requested?.trim().toUpperCase();
    if (!code) return saleCurrency ?? 'PEN';
    return assertActiveSaleCurrency(this.references, code);
  }

  async listBuyerPayments(f: ListBuyerPaymentsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.finanzas.listBuyerPayments({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async createBuyerPayment(
    applicationSlug: string | undefined,
    body: {
      saleClosingId: string;
      kind: string;
      amount: number;
      currency?: string;
      dueDate: string;
      notes?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    if (!isBuyerPaymentKind(body.kind)) {
      throw new BadRequestException(
        `Tipo inválido. Use: ${VENTAS_BUYER_PAYMENT_KINDS.join(', ')}`,
      );
    }
    if (!Number.isFinite(body.amount) || body.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor que cero.');
    }
    if (typeof body.saleClosingId !== 'string' || !body.saleClosingId.trim()) {
      throw new BadRequestException('saleClosingId es obligatorio.');
    }
    const ok = await this.finanzas.saleClosingBelongsToApplication(
      body.saleClosingId,
      applicationId,
    );
    if (!ok)
      throw new EntityNotFoundException('SaleClosing', body.saleClosingId);

    const currency = await this.resolveClosingCurrency(
      body.saleClosingId,
      applicationId,
      body.currency,
    );
    // Separación + pagos programados no pueden superar el precio final de la venta
    const coverage = await this.finanzas.getClosingPaymentCoverage(
      body.saleClosingId,
      applicationId,
    );
    // Inicial y cuotas forman parte del precio: van en la moneda de la venta
    if (coverage && coverage.currency !== currency) {
      throw new BadRequestException(
        `Los pagos del comprador van en la moneda de la venta (${coverage.currency}).`,
      );
    }
    if (coverage) {
      const balance = roundMoney(
        coverage.finalPrice -
          coverage.separationAmount -
          coverage.scheduledPayments,
      );
      if (body.amount > balance + 0.01) {
        throw new BadRequestException(
          `El pago supera el saldo por programar de la venta (${Math.max(0, balance)} ${currency}).`,
        );
      }
    }

    return this.finanzas.createBuyerPayment({
      applicationId,
      saleClosingId: body.saleClosingId,
      kind: body.kind,
      amount: body.amount,
      currency,
      dueDate: parseValidDateOrThrow(body.dueDate, 'Fecha de vencimiento'),
      notes: body.notes ?? null,
    });
  }

  async markBuyerPaymentPaid(
    id: string,
    applicationSlug: string | undefined,
    body?: { paidAt?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.finanzas.markBuyerPaymentPaid(
      id,
      applicationId,
      body?.paidAt
        ? parseValidDateOrThrow(body.paidAt, 'Fecha de pago')
        : undefined,
    );
    if (!row) throw new EntityNotFoundException('SaleBuyerPayment', id);
    return row;
  }

  async listCommissions(f: ListCommissionsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.finanzas.listCommissions({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async getCommissionStats(applicationSlug: string | undefined) {
    assertVentasApp(applicationSlug ?? VENTAS_SLUG);
    return this.finanzas.getCommissionStats(VENTAS_SLUG);
  }

  async markCommissionPaid(
    id: string,
    applicationSlug: string | undefined,
    body?: { paidAt?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.finanzas.markCommissionPaid(
      id,
      applicationId,
      body?.paidAt
        ? parseValidDateOrThrow(body.paidAt, 'Fecha de pago')
        : undefined,
    );
    if (!row) throw new EntityNotFoundException('SaleCommission', id);
    return row;
  }

  async markCommissionPaymentPartPaid(
    partId: string,
    applicationSlug: string | undefined,
    body?: { paidAt?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.finanzas.markCommissionPaymentPartPaid(
      partId,
      applicationId,
      body?.paidAt
        ? parseValidDateOrThrow(body.paidAt, 'Fecha de pago')
        : undefined,
    );
    if (!row)
      throw new EntityNotFoundException('SaleCommissionPaymentPart', partId);
    return row;
  }

  async recalculateCommission(id: string, applicationSlug: string | undefined) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.finanzas.recalculateCommissionFromProfile(
      id,
      applicationId,
    );
    if (!row) {
      throw new BadRequestException(
        'No se pudo recalcular: comisión inexistente o sin perfil de % para el asesor.',
      );
    }
    return row;
  }

  async updateCommission(
    id: string,
    applicationSlug: string | undefined,
    body: {
      calculationType: 'PERCENT' | 'FIXED';
      percent?: number | string | null;
      fixedAmount?: number | string | null;
      reason: string;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const reason = body.reason?.trim() ?? '';
    if (reason.length < 5) {
      throw new BadRequestException(
        'Indique el motivo del cambio de comisión (mínimo 5 caracteres).',
      );
    }
    const toNumber = (v: number | string | null | undefined) =>
      v == null || v === '' ? null : Number(String(v).replace(',', '.'));
    const percent = toNumber(body.percent);
    const fixedAmount = toNumber(body.fixedAmount);
    if (body.calculationType === 'PERCENT') {
      if (
        percent == null ||
        !Number.isFinite(percent) ||
        percent < 0 ||
        percent > 100
      ) {
        throw new BadRequestException(
          'El porcentaje de comisión debe estar entre 0 y 100.',
        );
      }
    } else if (
      fixedAmount == null ||
      !Number.isFinite(fixedAmount) ||
      fixedAmount < 0
    ) {
      throw new BadRequestException('Indique un monto fijo válido.');
    }

    const row = await this.finanzas.updateCommissionTerms(id, applicationId, {
      calculationType: body.calculationType,
      percent: body.calculationType === 'PERCENT' ? percent : null,
      fixedAmount: body.calculationType === 'FIXED' ? fixedAmount : null,
      reason,
    });
    if (!row) throw new EntityNotFoundException('SaleCommission', id);
    return row;
  }

  async listAgentCommissionProfiles(applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    return this.finanzas.listAgentCommissionProfiles(applicationId);
  }

  async upsertAgentCommissionProfile(
    applicationSlug: string | undefined,
    body: { agentId: string; commissionPercent: number },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    if (body.commissionPercent < 0 || body.commissionPercent > 100) {
      throw new BadRequestException('El porcentaje debe estar entre 0 y 100.');
    }
    const ag = await this.agentRepository.findById(body.agentId);
    if (!ag || ag.applicationId !== applicationId) {
      throw new BadRequestException(
        'El asesor no existe o no pertenece a Ventas.',
      );
    }
    return this.finanzas.upsertAgentCommissionProfile({
      applicationId,
      agentId: body.agentId,
      commissionPercent: body.commissionPercent,
    });
  }

  async listDocumentationCosts(f: ListDocCostsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.finanzas.listDocumentationCosts({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async createDocumentationCost(
    applicationSlug: string | undefined,
    body: {
      saleClosingId: string;
      costType: string;
      amount: number;
      currency?: string;
      description?: string | null;
      expenseDate?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    if (!isDocCostType(body.costType)) {
      throw new BadRequestException(
        `Tipo inválido. Use: ${VENTAS_DOC_COST_TYPES.join(', ')}`,
      );
    }
    if (body.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor que cero.');
    }
    const ok = await this.finanzas.saleClosingBelongsToApplication(
      body.saleClosingId,
      applicationId,
    );
    if (!ok)
      throw new EntityNotFoundException('SaleClosing', body.saleClosingId);

    return this.finanzas.createDocumentationCost({
      applicationId,
      saleClosingId: body.saleClosingId,
      costType: body.costType,
      amount: body.amount,
      currency: await this.resolveClosingCurrency(
        body.saleClosingId,
        applicationId,
        body.currency,
      ),
      description: body.description ?? null,
      expenseDate: body.expenseDate
        ? parseValidDateOrThrow(body.expenseDate, 'Fecha de gasto')
        : new Date(),
    });
  }

  async getClosingProfitability(closingId: string, applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.finanzas.getClosingProfitability(
      closingId,
      applicationId,
    );
    if (!row) throw new EntityNotFoundException('SaleClosing', closingId);
    return row;
  }
}
