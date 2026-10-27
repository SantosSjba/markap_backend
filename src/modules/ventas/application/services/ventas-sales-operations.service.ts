import {
  dateOnlyYear,
  todayDateOnlyLima,
} from '../../../../shared/domain/utils/peru-date.util';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BusinessReferencePort } from '../../../../shared/application/ports/business-reference.port';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import type { AgentRepository } from '../../../crm/domain/repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../../crm/domain/repositories/agent.repository';
import type { ClientRepository } from '../../../crm/domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../crm/domain/repositories/client.repository';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import type { PropertyRepository } from '../../../properties/domain/repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../../properties/domain/repositories/property.repository';
import type { VentasComplianceRepository } from '../../domain/repositories/ventas-compliance.repository';
import type { VentasConfigRepository } from '../../domain/repositories/ventas-config.repository';
import { VENTAS_CONFIG_REPOSITORY } from '../../domain/repositories/ventas-config.repository';
import {
  STAGE_REQUIRED_DOCUMENT,
  evaluateStageChange,
  missingStageDocuments,
} from '../../domain/utils/pipeline-stage-rules.util';
import { VENTAS_COMPLIANCE_REPOSITORY } from '../../domain/repositories/ventas-compliance.repository';
import type { VentasFinanzasRepository } from '../../domain/repositories/ventas-finanzas.repository';
import { VENTAS_FINANZAS_REPOSITORY } from '../../domain/repositories/ventas-finanzas.repository';
import {
  type ListSaleClosingsFilters,
  type ListSaleProcessesFilters,
  type ListSaleSeparationsFilters,
  VENTAS_PAYMENT_TYPES,
  VENTAS_PIPELINE_STAGES,
  VENTAS_SALES_REPOSITORY,
  type VentasPaymentType,
  type VentasPipelineStage,
  type VentasSalesRepository,
  type VentasSeparationStatus,
} from '../../domain/repositories/ventas-sales.repository';

import {
  assertPaymentPartsMatchNet,
  assertValidDeductibleType,
  computeNetPayable,
  resolvePaymentPartAmounts,
  roundMoney,
  type SaleCommissionDeductibleInput,
  type SaleCommissionPaymentPartInput,
} from '../../../../shared/utils/sale-commission.util';
import { mapSaleProcessDetail } from '../mappers/ventas-sale-process.mapper';
import { assertActiveSaleCurrency } from '../validators/sale-currency.validator';
import { assertActiveSaleFinancingChannel } from '../validators/sale-financing-channel.validator';

const VENTAS_SLUG = 'ventas';

function assertVentasApp(slug: string | undefined | null): void {
  if (slug?.trim() !== VENTAS_SLUG) {
    throw new BadRequestException(
      'Estas operaciones solo aplican a la aplicación Ventas (applicationSlug=ventas).',
    );
  }
}

function isVentasPipelineStage(v: string): v is VentasPipelineStage {
  return (VENTAS_PIPELINE_STAGES as readonly string[]).includes(v);
}

type SaleProcessStatusRow = { status: 'ACTIVE' | 'WON' | 'LOST' };

function isVentasPaymentType(v: string): v is VentasPaymentType {
  return (VENTAS_PAYMENT_TYPES as readonly string[]).includes(v);
}

function parseValidDateOrThrow(value: string, fieldLabel: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${fieldLabel} inválida.`);
  }
  return d;
}

@Injectable()
export class VentasSalesOperationsService {
  constructor(
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
    @Inject(VENTAS_FINANZAS_REPOSITORY)
    private readonly ventasFinanzas: VentasFinanzasRepository,
    @Inject(VENTAS_COMPLIANCE_REPOSITORY)
    private readonly ventasCompliance: VentasComplianceRepository,
    @Inject(VENTAS_CONFIG_REPOSITORY)
    private readonly ventasConfig: VentasConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    private readonly references: BusinessReferencePort,
  ) {}

  async listFinancingChannels() {
    return this.ventasSales.listSaleFinancingChannels();
  }

  private async resolveVentasApplicationId(
    applicationSlug?: string,
  ): Promise<string> {
    assertVentasApp(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  private async assertSaleProcessAllowsFollowUp(
    processId: string,
    applicationId: string,
  ): Promise<void> {
    const p = (await this.ventasSales.getSaleProcessById(
      processId,
      applicationId,
    )) as SaleProcessStatusRow | null;
    if (!p) throw new EntityNotFoundException('SaleProcess', processId);
    if (p.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo procesos activos admiten notas, actividades o recordatorios.',
      );
    }
  }

  /** Etapas activas del pipeline en su orden configurado */
  private async activeStageOrder(applicationId: string): Promise<string[]> {
    const stages = await this.ventasConfig.listPipelineStages(applicationId);
    const active = stages
      .filter((st) => st.isActive && isVentasPipelineStage(st.code))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((st) => st.code);
    return active.length ? active : [...VENTAS_PIPELINE_STAGES];
  }

  /** Tipos de documento ya cargados en Cumplimiento legal para la operación */
  private async uploadedDocTypes(
    applicationId: string,
    propertyId: string,
    buyerClientId: string,
  ): Promise<Set<string>> {
    const docs = (await this.ventasCompliance.listDocuments(
      applicationId,
      propertyId,
      buyerClientId,
    )) as { docType: string }[];
    return new Set(docs.map((d) => d.docType.toUpperCase()));
  }

  async getProcessStats(applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    return this.ventasSales.getSaleProcessStats(applicationId);
  }

  async listProcesses(f: ListSaleProcessesFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleProcesses({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async createProcess(
    applicationSlug: string | undefined,
    body: {
      buyerClientId: string;
      buyerClientIds?: string[];
      propertyId: string;
      ownerClientIds?: string[];
      agentId?: string | null;
      title?: string | null;
      pipelineStage?: string;
      financingChannelId?: string | null;
      commissions?: {
        agentId: string;
        calculationType: 'PERCENT' | 'FIXED';
        percent?: number | null;
        fixedAmount?: number | null;
        currency?: string | null;
        paymentParts?: SaleCommissionPaymentPartInput[];
        deductibles?: SaleCommissionDeductibleInput[];
      }[];
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);

    const buyerIds = Array.from(
      new Set(
        [body.buyerClientId, ...(body.buyerClientIds ?? [])].filter(Boolean),
      ),
    );
    if (!buyerIds.length) {
      throw new BadRequestException('Debe indicar al menos un comprador.');
    }
    for (const buyerId of buyerIds) {
      const buyer = await this.clientRepository.findById(buyerId);
      if (!buyer || buyer.applicationId !== applicationId) {
        throw new EntityNotFoundException('Client', buyerId);
      }
      if (buyer.clientType !== 'BUYER') {
        throw new BadRequestException(
          `El cliente ${buyer.fullName} no es comprador. El proceso comercial solo acepta compradores.`,
        );
      }
    }

    const property = await this.propertyRepository.findById(body.propertyId);
    if (!property || property.applicationId !== applicationId) {
      throw new EntityNotFoundException('Property', body.propertyId);
    }
    if (property.listingStatus === 'SOLD') {
      throw new BadRequestException(
        'El inmueble ya está vendido; no se puede iniciar un proceso de venta sobre él.',
      );
    }
    const ownerIds = Array.from(
      new Set(
        [property.ownerId, ...(property.owners?.map((o) => o.id) ?? [])].filter(
          Boolean,
        ),
      ),
    );
    for (const ownerId of ownerIds) {
      const owner = await this.clientRepository.findById(ownerId);
      if (!owner || owner.applicationId !== applicationId) {
        throw new EntityNotFoundException('Client', ownerId);
      }
      if (owner.clientType !== 'OWNER') {
        throw new BadRequestException(
          `El cliente ${owner.fullName} no es propietario. Solo se permiten propietarios en la operación.`,
        );
      }
    }

    if (body.agentId) {
      const ag = await this.agentRepository.findById(body.agentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException(
          'El asesor no existe o no pertenece a Ventas.',
        );
      }
    }

    const order = await this.activeStageOrder(applicationId);
    let stage = order[0] as VentasPipelineStage;
    if (body.pipelineStage && body.pipelineStage !== stage) {
      if (
        !isVentasPipelineStage(body.pipelineStage) ||
        !order.includes(body.pipelineStage)
      ) {
        throw new BadRequestException(
          `Etapa inválida. Use: ${order.join(', ')}`,
        );
      }
      // Empezar más adelante solo si los documentos de las etapas previas ya existen
      const missing = missingStageDocuments(
        stage,
        body.pipelineStage,
        order,
        await this.uploadedDocTypes(
          applicationId,
          body.propertyId,
          body.buyerClientId,
        ),
      );
      if (missing.length) {
        throw new BadRequestException(
          `Para iniciar en esa etapa falta cargar en Cumplimiento legal: ${missing.join(', ')}.`,
        );
      }
      stage = body.pipelineStage;
    }

    const financingChannelId = await assertActiveSaleFinancingChannel(
      this.references,
      body.financingChannelId,
    );

    const salePrice = property.salePrice;
    const commissionsInput = body.commissions ?? [];
    const agentIds = new Set<string>();
    const resolvedCommissions: {
      agentId: string;
      calculationType: 'PERCENT' | 'FIXED';
      amount: number;
      currency: string;
      percentApplied: number | null;
      paymentParts: {
        partNumber: number;
        label: string | null;
        amount: number;
        dueDate: Date | null;
      }[];
      deductibles: {
        deductibleType: string;
        description: string | null;
        amount: number;
      }[];
    }[] = [];

    for (const row of commissionsInput) {
      if (!row.agentId?.trim()) continue;
      if (agentIds.has(row.agentId)) {
        throw new BadRequestException(
          'No puede repetir el mismo asesor en las comisiones del proceso.',
        );
      }
      agentIds.add(row.agentId);

      const ag = await this.agentRepository.findById(row.agentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException(
          'Uno de los asesores de comisión no existe o no pertenece a Ventas.',
        );
      }

      const calculationType =
        row.calculationType === 'FIXED' ? 'FIXED' : 'PERCENT';
      let amount = 0;
      let percentApplied: number | null = null;
      // En % la comisión sale del precio, así que va en su moneda; el monto fijo puede ir en otra
      const currency =
        calculationType === 'FIXED' && row.currency
          ? await assertActiveSaleCurrency(this.references, row.currency)
          : property.saleCurrency;

      if (calculationType === 'FIXED') {
        if (row.fixedAmount == null || row.fixedAmount < 0) {
          throw new BadRequestException(
            'Indique un monto fijo válido para cada comisión.',
          );
        }
        amount = Math.round(row.fixedAmount * 100) / 100;
      } else {
        if (row.percent == null || row.percent < 0 || row.percent > 100) {
          throw new BadRequestException(
            'El porcentaje de comisión debe estar entre 0 y 100.',
          );
        }
        percentApplied = row.percent;
        if (salePrice != null && salePrice > 0) {
          amount = Math.round(salePrice * (row.percent / 100) * 100) / 100;
        }
      }

      const deductibles: {
        deductibleType: string;
        description: string | null;
        amount: number;
      }[] = [];
      for (const d of row.deductibles ?? []) {
        if (d.amount == null || d.amount < 0) {
          throw new BadRequestException(
            'Cada deducible debe tener un monto válido.',
          );
        }
        deductibles.push({
          deductibleType: assertValidDeductibleType(d.deductibleType),
          description: d.description?.trim() || null,
          amount: roundMoney(d.amount),
        });
      }

      const net = computeNetPayable(amount, deductibles);
      const paymentParts = resolvePaymentPartAmounts(
        net,
        row.paymentParts ?? [],
      );
      assertPaymentPartsMatchNet(net, paymentParts);

      resolvedCommissions.push({
        agentId: row.agentId,
        calculationType,
        amount,
        currency,
        percentApplied,
        paymentParts,
        deductibles,
      });
    }

    const primaryAgentId =
      body.agentId ?? resolvedCommissions[0]?.agentId ?? null;
    if (primaryAgentId && !agentIds.has(primaryAgentId)) {
      const ag = await this.agentRepository.findById(primaryAgentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException(
          'El asesor del proceso no existe o no pertenece a Ventas.',
        );
      }
    }

    const code = await this.ventasSales.nextProcessCode(
      applicationId,
      property.code,
      dateOnlyYear(todayDateOnlyLima()),
    );
    return this.ventasSales.createSaleProcess({
      applicationId,
      code,
      buyerClientId: body.buyerClientId,
      buyerClientIds: buyerIds,
      propertyId: body.propertyId,
      ownerClientIds: ownerIds,
      agentId: primaryAgentId,
      pipelineStage: stage,
      title: body.title ?? null,
      financingChannelId,
      commissions: resolvedCommissions,
    });
  }

  async getProcessById(id: string, applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    let row = await this.ventasSales.getSaleProcessById(id, applicationId);
    if (!row) throw new EntityNotFoundException('SaleProcess', id);

    const ownersOnRow = (row as { owners?: unknown[] }).owners ?? [];
    const propertyId = (row as { propertyId?: string }).propertyId;
    if (!ownersOnRow.length && propertyId) {
      await this.ventasSales.ensureSaleProcessOwnerLinksFromProperty(
        id,
        propertyId,
      );
      row = await this.ventasSales.getSaleProcessById(id, applicationId);
      if (!row) throw new EntityNotFoundException('SaleProcess', id);
    }

    return mapSaleProcessDetail(row as Record<string, unknown>);
  }

  async updateProcess(
    id: string,
    applicationSlug: string | undefined,
    body: {
      pipelineStage?: string;
      status?: 'ACTIVE' | 'WON' | 'LOST';
      agentId?: string | null;
      title?: string | null;
      financingChannelId?: string | null;
      lostReason?: string | null;
      /** Obligatorio para retroceder de etapa */
      stageChangeReason?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const existing = await this.ventasSales.getSaleProcessById(
      id,
      applicationId,
    );
    if (!existing) throw new EntityNotFoundException('SaleProcess', id);

    const cur = existing as {
      status: 'ACTIVE' | 'WON' | 'LOST';
      pipelineStage: string;
      propertyId: string;
      buyerClientId: string;
    };

    if (body.agentId) {
      const ag = await this.agentRepository.findById(body.agentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException(
          'El asesor no existe o no pertenece a Ventas.',
        );
      }
    }

    if (cur.status === 'LOST') {
      if (
        body.pipelineStage !== undefined &&
        body.pipelineStage !== cur.pipelineStage
      ) {
        throw new BadRequestException(
          'La venta está registrada como caída. No se puede modificar la etapa del pipeline.',
        );
      }
      if (body.status !== undefined && body.status !== 'LOST') {
        throw new BadRequestException(
          'La venta está caída. No se puede reactivar el proceso desde esta pantalla.',
        );
      }
    }

    if (cur.status === 'WON') {
      if (
        body.pipelineStage !== undefined &&
        body.pipelineStage !== cur.pipelineStage
      ) {
        throw new BadRequestException(
          'El proceso ya está ganado. No se puede cambiar la etapa del pipeline.',
        );
      }
      const triesToChangeWon =
        body.status !== undefined ||
        body.agentId !== undefined ||
        body.title !== undefined ||
        body.financingChannelId !== undefined;
      if (triesToChangeWon) {
        throw new BadRequestException(
          'El proceso ya está ganado; no se puede modificar desde esta pantalla.',
        );
      }
    }

    const patch: Parameters<VentasSalesRepository['updateSaleProcess']>[2] = {};

    let stageActivity: { title: string; description: string } | null = null;
    if (
      body.pipelineStage !== undefined &&
      body.pipelineStage !== cur.pipelineStage
    ) {
      const order = await this.activeStageOrder(applicationId);
      if (
        !isVentasPipelineStage(body.pipelineStage) ||
        !order.includes(body.pipelineStage)
      ) {
        throw new BadRequestException(`Etapa inválida: ${order.join(', ')}`);
      }
      const stageLabel = async (code: string) =>
        (await this.ventasConfig.listPipelineStages(applicationId)).find(
          (st) => st.code === code,
        )?.label ?? code;
      const change = evaluateStageChange(
        cur.pipelineStage,
        body.pipelineStage,
        order,
        await this.uploadedDocTypes(
          applicationId,
          cur.propertyId,
          cur.buyerClientId,
        ),
      );
      const fromLabel = await stageLabel(cur.pipelineStage);
      const toLabel = await stageLabel(body.pipelineStage);
      if (change.kind === 'forward') {
        if (change.skipsStages) {
          throw new BadRequestException(
            'Se avanza una etapa a la vez: complete la etapa siguiente antes de pasar a las demás.',
          );
        }
        if (change.missingDocuments.length) {
          throw new BadRequestException(
            `Para pasar a «${toLabel}» cargue antes en Cumplimiento legal: ${change.missingDocuments.join(', ')}.`,
          );
        }
        const doc = STAGE_REQUIRED_DOCUMENT[body.pipelineStage];
        stageActivity = {
          title: `Avance a «${toLabel}»`,
          description: doc
            ? `De «${fromLabel}» a «${toLabel}» con ${doc.label} cargado.`
            : `De «${fromLabel}» a «${toLabel}».`,
        };
      } else if (change.kind === 'backward') {
        const reason = body.stageChangeReason?.trim() ?? '';
        if (reason.length < 5) {
          throw new BadRequestException(
            'Indique el motivo para retroceder de etapa (mínimo 5 caracteres).',
          );
        }
        stageActivity = {
          title: `Retroceso a «${toLabel}»`,
          description: `De «${fromLabel}» a «${toLabel}». Motivo: ${reason}`,
        };
      }
      patch.pipelineStage = body.pipelineStage;
    }

    const markingLost = body.status === 'LOST';
    if (body.status !== undefined) {
      if (body.status === 'LOST') {
        if (cur.status !== 'ACTIVE') {
          throw new BadRequestException(
            cur.status === 'LOST'
              ? 'La venta ya está registrada como caída.'
              : 'Solo un proceso activo puede marcarse como venta caída.',
          );
        }
        const reason = body.lostReason?.trim() ?? '';
        if (reason.length < 5) {
          throw new BadRequestException(
            'Indique el motivo de la venta caída (mínimo 5 caracteres).',
          );
        }
        patch.status = 'LOST';
        patch.lostReason = reason;
        patch.closedAt = new Date();
      } else if (body.status === 'WON') {
        throw new BadRequestException(
          'Registre la venta ganada desde Cierres, no desde la ficha del proceso.',
        );
      } else if (body.status === 'ACTIVE' && cur.status === 'WON') {
        throw new BadRequestException(
          'No se puede reactivar un proceso ya ganado desde esta pantalla.',
        );
      } else {
        patch.status = body.status;
      }
    }

    if (body.agentId !== undefined) patch.agentId = body.agentId;
    if (body.title !== undefined) patch.title = body.title;
    if (body.financingChannelId !== undefined) {
      patch.financingChannelId = await assertActiveSaleFinancingChannel(
        this.references,
        body.financingChannelId,
      );
    }

    if (markingLost) {
      const reason = patch.lostReason ?? '';
      const lost = await this.ventasSales.applySaleProcessLost(
        id,
        applicationId,
        {
          lostReason: reason,
          closedAt: patch.closedAt ?? new Date(),
          activityDescription: reason,
        },
      );
      if (!lost) {
        throw new BadRequestException('No se pudo registrar la venta caída.');
      }
      return mapSaleProcessDetail(lost as Record<string, unknown>);
    }

    if (Object.keys(patch).length > 0) {
      await this.ventasSales.updateSaleProcess(
        id,
        applicationId,
        patch,
        stageActivity ?? undefined,
      );
    }

    const detail = await this.ventasSales.getSaleProcessById(id, applicationId);
    if (!detail) throw new EntityNotFoundException('SaleProcess', id);
    return mapSaleProcessDetail(detail as Record<string, unknown>);
  }

  async addNote(
    processId: string,
    applicationSlug: string | undefined,
    body: { text: string; createdBy?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    await this.assertSaleProcessAllowsFollowUp(processId, applicationId);
    const row = await this.ventasSales.addSaleProcessNote(
      processId,
      applicationId,
      body.text,
      body.createdBy,
    );
    if (!row) throw new EntityNotFoundException('SaleProcess', processId);
    return row;
  }

  async addActivity(
    processId: string,
    applicationSlug: string | undefined,
    body: {
      activityType: string;
      title: string;
      description?: string | null;
      scheduledAt?: string | null;
      completedAt?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    await this.assertSaleProcessAllowsFollowUp(processId, applicationId);
    const row = await this.ventasSales.addSaleProcessActivity({
      saleProcessId: processId,
      applicationId,
      activityType: body.activityType.trim(),
      title: body.title,
      description: body.description ?? null,
      scheduledAt: body.scheduledAt
        ? parseValidDateOrThrow(body.scheduledAt, 'Fecha programada')
        : null,
      completedAt: body.completedAt
        ? parseValidDateOrThrow(body.completedAt, 'Fecha de completado')
        : null,
    });
    if (!row) throw new EntityNotFoundException('SaleProcess', processId);
    return row;
  }

  async addReminder(
    processId: string,
    applicationSlug: string | undefined,
    body: { title: string; dueAt: string },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    await this.assertSaleProcessAllowsFollowUp(processId, applicationId);
    const row = await this.ventasSales.addSaleProcessReminder({
      saleProcessId: processId,
      applicationId,
      title: body.title,
      dueAt: parseValidDateOrThrow(body.dueAt, 'Fecha de vencimiento'),
    });
    if (!row) throw new EntityNotFoundException('SaleProcess', processId);
    return row;
  }

  async completeReminder(reminderId: string, applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.completeSaleProcessReminder(
      reminderId,
      applicationId,
    );
    if (!row)
      throw new EntityNotFoundException('SaleProcessReminder', reminderId);
    return row;
  }

  async listSeparations(f: ListSaleSeparationsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleSeparations({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async getSeparationStats(applicationSlug?: string) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    return this.ventasSales.getSaleSeparationStats(applicationId);
  }

  async createSeparation(
    applicationSlug: string | undefined,
    body: {
      propertyId: string;
      buyerClientId: string;
      saleProcessId?: string | null;
      amount: number;
      currency?: string;
      separationDate: string;
      expiresAt?: string | null;
      notes?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);

    const buyer = await this.clientRepository.findById(body.buyerClientId);
    if (!buyer || buyer.applicationId !== applicationId) {
      throw new EntityNotFoundException('Client', body.buyerClientId);
    }
    if (buyer.clientType !== 'BUYER') {
      throw new BadRequestException(
        'La separación debe asociarse a un cliente comprador / lead.',
      );
    }

    const property = await this.propertyRepository.findById(body.propertyId);
    if (!property || property.applicationId !== applicationId) {
      throw new EntityNotFoundException('Property', body.propertyId);
    }

    if (property.listingStatus === 'SOLD') {
      throw new BadRequestException('La propiedad ya está vendida.');
    }

    const activeCount = await this.ventasSales.countActiveSeparationsOnProperty(
      body.propertyId,
      applicationId,
    );
    if (activeCount > 0) {
      throw new BadRequestException(
        'Ya existe una separación activa sobre este inmueble. Cierre o venza la anterior antes de crear otra.',
      );
    }

    // Vínculo con el proceso: el indicado debe ser del mismo inmueble y comprador;
    // sin indicarlo, se enlaza el proceso activo de ese inmueble en el que participa el comprador.
    let saleProcessId: string | null = body.saleProcessId ?? null;
    if (saleProcessId) {
      const p = (await this.ventasSales.getSaleProcessById(
        saleProcessId,
        applicationId,
      )) as {
        status: string;
        propertyId: string;
        buyerClientId: string;
        buyers?: { buyerClientId: string }[];
      } | null;
      if (!p) throw new EntityNotFoundException('SaleProcess', saleProcessId);
      if (p.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Solo se puede separar sobre un proceso de venta activo.',
        );
      }
      if (p.propertyId !== body.propertyId) {
        throw new BadRequestException(
          'El proceso de venta elegido es de otro inmueble.',
        );
      }
      const processBuyerIds = new Set([
        p.buyerClientId,
        ...(p.buyers ?? []).map((b) => b.buyerClientId),
      ]);
      if (!processBuyerIds.has(body.buyerClientId)) {
        throw new BadRequestException(
          'El comprador no participa en el proceso de venta elegido.',
        );
      }
    } else {
      saleProcessId =
        (
          await this.ventasSales.findActiveProcessForSeparation(
            applicationId,
            body.propertyId,
            body.buyerClientId,
          )
        )?.id ?? null;
    }

    const currency = await assertActiveSaleCurrency(
      this.references,
      body.currency ?? property.saleCurrency,
    );

    if (body.amount <= 0) {
      throw new BadRequestException(
        'El monto de separación debe ser mayor que cero.',
      );
    }

    const created = await this.ventasSales.createSaleSeparation({
      applicationId,
      saleProcessId,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      amount: body.amount,
      currency,
      separationDate: parseValidDateOrThrow(
        body.separationDate,
        'Fecha de separación',
      ),
      expiresAt: body.expiresAt
        ? parseValidDateOrThrow(body.expiresAt, 'Fecha de vencimiento')
        : null,
      notes: body.notes ?? null,
    });
    if (!created) {
      throw new BadRequestException(
        'No se pudo registrar la separación porque el inmueble ya no está disponible.',
      );
    }
    return created;
  }

  async patchSeparation(
    id: string,
    applicationSlug: string | undefined,
    body: {
      status?: VentasSeparationStatus;
      notes?: string | null;
      expiresAt?: string | null;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const sep = await this.ventasSales.getSaleSeparationById(id, applicationId);
    if (!sep) throw new EntityNotFoundException('SaleSeparation', id);
    const current = sep as {
      propertyId: string;
      status: VentasSeparationStatus;
    };

    if (body.status === 'CLOSED' && current.status !== 'CLOSED') {
      throw new BadRequestException(
        'La separación se cierra al registrar el cierre de la venta, no manualmente.',
      );
    }
    if (
      current.status === 'CLOSED' &&
      body.status &&
      body.status !== 'CLOSED'
    ) {
      throw new BadRequestException(
        'La separación ya terminó en un cierre de venta y no se puede cambiar.',
      );
    }

    if (body.status === 'ACTIVE' && current.status !== 'ACTIVE') {
      const activeCount =
        await this.ventasSales.countActiveSeparationsOnProperty(
          current.propertyId,
          applicationId,
        );
      if (activeCount > 0) {
        throw new BadRequestException(
          'No se puede activar esta separación porque ya existe otra separación activa para el inmueble.',
        );
      }
    }

    const updated = await this.ventasSales.updateSaleSeparation(
      id,
      applicationId,
      {
        status: body.status,
        notes: body.notes,
        expiresAt:
          body.expiresAt !== undefined
            ? body.expiresAt
              ? parseValidDateOrThrow(body.expiresAt, 'Fecha de vencimiento')
              : null
            : undefined,
      },
    );

    if (body.status === 'EXPIRED' || body.status === 'CLOSED') {
      await this.ventasSales.refreshPropertyListingAfterSeparationChange(
        current.propertyId,
        applicationId,
      );
    }
    if (body.status === 'ACTIVE') {
      const ok = await this.ventasSales.ensurePropertyReservedForSeparation(
        current.propertyId,
        applicationId,
      );
      if (!ok) {
        throw new BadRequestException(
          'No se puede activar la separación porque el inmueble no está disponible.',
        );
      }
    }

    return updated;
  }

  async setSeparationReceipt(
    id: string,
    applicationId: string,
    file: { filePath: string; archivoId?: string | null },
  ) {
    const sep = await this.ventasSales.getSaleSeparationById(id, applicationId);
    if (!sep) throw new EntityNotFoundException('SaleSeparation', id);
    return this.ventasSales.updateSaleSeparation(id, applicationId, {
      receiptFilePath: file.filePath,
      receiptArchivoId: file.archivoId ?? null,
    });
  }

  /** Guarda comprobante tras subir a MinIO (resuelve applicationId desde slug). */
  async saveSeparationReceipt(
    separationId: string,
    applicationSlug: string | undefined,
    file: { filePath: string; archivoId?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    return this.setSeparationReceipt(separationId, applicationId, file);
  }

  async listClosings(f: ListSaleClosingsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleClosings({
      ...f,
      applicationSlug: VENTAS_SLUG,
    });
  }

  async createClosing(
    applicationSlug: string | undefined,
    body: {
      propertyId: string;
      buyerClientId: string;
      saleProcessId?: string | null;
      saleSeparationId?: string | null;
      agentId?: string | null;
      finalPrice: number;
      paymentType: string;
      notes?: string | null;
      commissionAgentId?: string | null;
      /** Obligatorio salvo que commissionAutoFromProfile sea true */
      commissionAmount?: number;
      commissionPercent?: number | null;
      /** Si true, toma el % de Finanzas → Comisiones y calcula el monto */
      commissionAutoFromProfile?: boolean;
    },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);

    if (!isVentasPaymentType(body.paymentType)) {
      throw new BadRequestException(
        `Tipo de pago inválido. Use: ${VENTAS_PAYMENT_TYPES.join(', ')}`,
      );
    }
    const paymentType = body.paymentType;

    const buyer = await this.clientRepository.findById(body.buyerClientId);
    if (!buyer || buyer.applicationId !== applicationId) {
      throw new EntityNotFoundException('Client', body.buyerClientId);
    }
    if (buyer.clientType !== 'BUYER') {
      throw new BadRequestException(
        'El cierre debe asociarse a un cliente comprador / lead.',
      );
    }

    const property = await this.propertyRepository.findById(body.propertyId);
    if (!property || property.applicationId !== applicationId) {
      throw new EntityNotFoundException('Property', body.propertyId);
    }
    if (property.listingStatus === 'SOLD') {
      throw new BadRequestException('La propiedad ya figura como vendida.');
    }

    if (body.finalPrice <= 0) {
      throw new BadRequestException('El precio final debe ser mayor que cero.');
    }

    const readiness = await this.ventasCompliance.getClosingReadiness(
      applicationId,
      body.propertyId,
      body.buyerClientId,
    );
    if (!readiness.ok) {
      throw new BadRequestException(
        `La operación no está lista para cierre legal/compliance: ${readiness.missing.join('; ')}`,
      );
    }

    if (body.saleSeparationId) {
      const sep = (await this.ventasSales.getSaleSeparationById(
        body.saleSeparationId,
        applicationId,
      )) as {
        propertyId: string;
        buyerClientId: string;
        status: string;
      } | null;
      if (!sep)
        throw new EntityNotFoundException(
          'SaleSeparation',
          body.saleSeparationId,
        );
      if (
        sep.propertyId !== body.propertyId ||
        sep.buyerClientId !== body.buyerClientId
      ) {
        throw new BadRequestException(
          'La separación no coincide con propiedad ni comprador del cierre.',
        );
      }
      if (sep.status !== 'ACTIVE') {
        throw new BadRequestException(
          'La separación debe estar activa para cerrar desde ella.',
        );
      }
    }

    if (body.saleProcessId) {
      const proc = (await this.ventasSales.getSaleProcessById(
        body.saleProcessId,
        applicationId,
      )) as {
        propertyId: string;
        buyerClientId: string;
        buyers?: { buyerClientId: string }[];
        status: string;
      } | null;
      if (!proc)
        throw new EntityNotFoundException('SaleProcess', body.saleProcessId);
      // El cierre puede firmarlo cualquiera de los compradores del proceso
      const processBuyerIds = new Set([
        proc.buyerClientId,
        ...(proc.buyers ?? []).map((b) => b.buyerClientId),
      ]);
      if (
        proc.propertyId !== body.propertyId ||
        !processBuyerIds.has(body.buyerClientId)
      ) {
        throw new BadRequestException(
          'El proceso no coincide con propiedad ni comprador del cierre.',
        );
      }
      if (proc.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Solo se puede cerrar un proceso de venta activo. Las ventas caídas o ya ganadas no admiten cierre.',
        );
      }
    }

    // Cierre desde el proceso: su separación activa (si la hay) se cierra con la venta
    let saleSeparationId = body.saleSeparationId ?? null;
    if (!saleSeparationId && body.saleProcessId) {
      const procSeps = (
        (await this.ventasSales.getSaleProcessById(
          body.saleProcessId,
          applicationId,
        )) as {
          separations?: { id: string; status: string; buyerClientId: string }[];
        } | null
      )?.separations;
      saleSeparationId =
        procSeps?.find(
          (s) =>
            s.status === 'ACTIVE' && s.buyerClientId === body.buyerClientId,
        )?.id ?? null;
    }

    // Una separación vigente de otro comprador reserva el inmueble: no se puede vender a un tercero
    const activeSeparations =
      await this.ventasSales.listActiveSeparationsOnProperty(
        body.propertyId,
        applicationId,
      );
    for (const sep of activeSeparations) {
      if (sep.id === saleSeparationId) continue;
      if (sep.buyerClientId === body.buyerClientId && !saleSeparationId) {
        saleSeparationId = sep.id;
        continue;
      }
      throw new BadRequestException(
        'El inmueble tiene una separación activa de otro comprador. Márquela como vencida antes de registrar este cierre.',
      );
    }

    const processCommissionCount = body.saleProcessId
      ? await this.ventasSales.countProcessCommissions(
          body.saleProcessId,
          applicationId,
        )
      : 0;

    let commissionAgentId = body.commissionAgentId ?? body.agentId ?? null;
    let commissionAmount = body.commissionAmount ?? 0;
    let commissionPercent = body.commissionPercent ?? null;

    if (processCommissionCount === 0) {
      if (!commissionAgentId && body.saleProcessId) {
        const proc = (await this.ventasSales.getSaleProcessById(
          body.saleProcessId,
          applicationId,
        )) as { agentId: string | null } | null;
        commissionAgentId = proc?.agentId ?? null;
      }
      if (!commissionAgentId) {
        throw new BadRequestException(
          'Indique el agente para la comisión o defina comisiones al crear el proceso.',
        );
      }

      if (body.commissionAutoFromProfile) {
        const pct = await this.ventasFinanzas.getAgentCommissionPercent(
          applicationId,
          commissionAgentId,
        );
        if (pct == null) {
          throw new BadRequestException(
            'No hay porcentaje configurado para este asesor en el cierre manual.',
          );
        }
        commissionPercent = pct;
        commissionAmount =
          Math.round(body.finalPrice * (pct / 100) * 100) / 100;
      } else if (commissionAmount == null || commissionAmount < 0) {
        throw new BadRequestException(
          'Indique el monto de comisión para el cierre.',
        );
      }

      const ag = await this.agentRepository.findById(commissionAgentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException(
          'El agente de comisión no existe o no pertenece a Ventas.',
        );
      }
    } else {
      commissionAgentId = null;
      commissionAmount = 0;
      commissionPercent = null;
    }

    if (body.agentId) {
      const ag2 = await this.agentRepository.findById(body.agentId);
      if (!ag2 || ag2.applicationId !== applicationId) {
        throw new BadRequestException(
          'El asesor del cierre no existe o no pertenece a Ventas.',
        );
      }
    }

    const created = await this.ventasSales.createSaleClosingWithSideEffects({
      applicationId,
      saleProcessId: body.saleProcessId ?? null,
      saleSeparationId,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      agentId: body.agentId ?? null,
      finalPrice: body.finalPrice,
      paymentType,
      contractFilePath: null,
      notes: body.notes ?? null,
      commissionAgentId,
      commissionAmount: commissionAmount,
      commissionPercent,
    });
    if (!created) {
      throw new BadRequestException(
        'No se pudo registrar el cierre porque el inmueble ya no está disponible para venta.',
      );
    }
    return created;
  }

  async attachClosingContract(
    closingId: string,
    applicationSlug: string | undefined,
    file: { filePath: string; archivoId?: string | null },
  ) {
    const applicationId =
      await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.getSaleClosingById(
      closingId,
      applicationId,
    );
    if (!row) throw new EntityNotFoundException('SaleClosing', closingId);
    return this.ventasSales.updateSaleClosingContractFile(
      closingId,
      applicationId,
      file,
    );
  }
}
