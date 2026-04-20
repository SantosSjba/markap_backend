import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '../../repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../repositories/application.repository';
import type { PropertyRepository } from '../../repositories/property.repository';
import { PROPERTY_REPOSITORY } from '../../repositories/property.repository';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { AgentRepository } from '../../repositories/agent.repository';
import { AGENT_REPOSITORY } from '../../repositories/agent.repository';
import {
  VENTAS_SALES_REPOSITORY,
  type VentasSalesRepository,
  type ListSaleProcessesFilters,
  type ListSaleSeparationsFilters,
  type ListSaleClosingsFilters,
  VENTAS_PIPELINE_STAGES,
  VENTAS_PAYMENT_TYPES,
  type VentasPipelineStage,
  type VentasPaymentType,
  type VentasSeparationStatus,
} from '../../repositories/ventas-sales.repository';
import {
  VENTAS_FINANZAS_REPOSITORY,
  type VentasFinanzasRepository,
} from '../../repositories/ventas-finanzas.repository';
import { EntityNotFoundException } from '../../exceptions';

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

function isVentasPaymentType(v: string): v is VentasPaymentType {
  return (VENTAS_PAYMENT_TYPES as readonly string[]).includes(v);
}

@Injectable()
export class VentasSalesOperationsService {
  constructor(
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
    @Inject(VENTAS_FINANZAS_REPOSITORY)
    private readonly ventasFinanzas: VentasFinanzasRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  private async resolveVentasApplicationId(applicationSlug?: string): Promise<string> {
    assertVentasApp(applicationSlug ?? VENTAS_SLUG);
    const app = await this.applicationRepository.findBySlug(VENTAS_SLUG);
    if (!app) throw new EntityNotFoundException('Application', VENTAS_SLUG);
    return app.id;
  }

  async listProcesses(f: ListSaleProcessesFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleProcesses({ ...f, applicationSlug: VENTAS_SLUG });
  }

  async createProcess(
    applicationSlug: string | undefined,
    body: {
      buyerClientId: string;
      propertyId: string;
      agentId?: string | null;
      title?: string | null;
      pipelineStage?: string;
    },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);

    const buyer = await this.clientRepository.findById(body.buyerClientId);
    if (!buyer || buyer.applicationId !== applicationId) {
      throw new EntityNotFoundException('Client', body.buyerClientId);
    }
    if (buyer.clientType !== 'BUYER') {
      throw new BadRequestException('El proceso comercial debe asociarse a un cliente comprador / lead.');
    }

    const property = await this.propertyRepository.findById(body.propertyId);
    if (!property || property.applicationId !== applicationId) {
      throw new EntityNotFoundException('Property', body.propertyId);
    }

    if (body.agentId) {
      const ag = await this.agentRepository.findById(body.agentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException('El asesor no existe o no pertenece a Ventas.');
      }
    }

    let stage: VentasPipelineStage = 'PROSPECT';
    if (body.pipelineStage) {
      if (!isVentasPipelineStage(body.pipelineStage)) {
        throw new BadRequestException(
          `Etapa inválida. Use: ${VENTAS_PIPELINE_STAGES.join(', ')}`,
        );
      }
      stage = body.pipelineStage;
    }

    const code = await this.ventasSales.nextProcessCode(applicationId);
    return this.ventasSales.createSaleProcess({
      applicationId,
      code,
      buyerClientId: body.buyerClientId,
      propertyId: body.propertyId,
      agentId: body.agentId ?? null,
      pipelineStage: stage,
      title: body.title ?? null,
    });
  }

  async getProcessById(id: string, applicationSlug?: string) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.getSaleProcessById(id, applicationId);
    if (!row) throw new EntityNotFoundException('SaleProcess', id);
    return row;
  }

  async updateProcess(
    id: string,
    applicationSlug: string | undefined,
    body: {
      pipelineStage?: string;
      status?: 'ACTIVE' | 'WON' | 'LOST';
      agentId?: string | null;
      title?: string | null;
    },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const existing = await this.ventasSales.getSaleProcessById(id, applicationId);
    if (!existing) throw new EntityNotFoundException('SaleProcess', id);

    if (body.agentId) {
      const ag = await this.agentRepository.findById(body.agentId);
      if (!ag || ag.applicationId !== applicationId) {
        throw new BadRequestException('El asesor no existe o no pertenece a Ventas.');
      }
    }

    const patch: Parameters<VentasSalesRepository['updateSaleProcess']>[2] = {};
    if (body.pipelineStage !== undefined) {
      if (!isVentasPipelineStage(body.pipelineStage)) {
        throw new BadRequestException(`Etapa inválida: ${VENTAS_PIPELINE_STAGES.join(', ')}`);
      }
      patch.pipelineStage = body.pipelineStage;
    }
    if (body.status !== undefined) {
      patch.status = body.status;
      if (body.status === 'WON' || body.status === 'LOST') {
        patch.closedAt = new Date();
      }
    }
    if (body.agentId !== undefined) patch.agentId = body.agentId;
    if (body.title !== undefined) patch.title = body.title;

    return this.ventasSales.updateSaleProcess(id, applicationId, patch);
  }

  async addNote(
    processId: string,
    applicationSlug: string | undefined,
    body: { text: string; createdBy?: string | null },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
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
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.addSaleProcessActivity({
      saleProcessId: processId,
      applicationId,
      activityType: body.activityType.trim(),
      title: body.title,
      description: body.description ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
    });
    if (!row) throw new EntityNotFoundException('SaleProcess', processId);
    return row;
  }

  async addReminder(
    processId: string,
    applicationSlug: string | undefined,
    body: { title: string; dueAt: string },
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.addSaleProcessReminder({
      saleProcessId: processId,
      applicationId,
      title: body.title,
      dueAt: new Date(body.dueAt),
    });
    if (!row) throw new EntityNotFoundException('SaleProcess', processId);
    return row;
  }

  async completeReminder(reminderId: string, applicationSlug?: string) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.completeSaleProcessReminder(
      reminderId,
      applicationId,
    );
    if (!row) throw new EntityNotFoundException('SaleProcessReminder', reminderId);
    return row;
  }

  async listSeparations(f: ListSaleSeparationsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleSeparations({ ...f, applicationSlug: VENTAS_SLUG });
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
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);

    const buyer = await this.clientRepository.findById(body.buyerClientId);
    if (!buyer || buyer.applicationId !== applicationId) {
      throw new EntityNotFoundException('Client', body.buyerClientId);
    }
    if (buyer.clientType !== 'BUYER') {
      throw new BadRequestException('La separación debe asociarse a un cliente comprador / lead.');
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

    if (body.saleProcessId) {
      const p = await this.ventasSales.getSaleProcessById(body.saleProcessId, applicationId);
      if (!p) throw new EntityNotFoundException('SaleProcess', body.saleProcessId);
    }

    if (body.amount <= 0) {
      throw new BadRequestException('El monto de separación debe ser mayor que cero.');
    }

    return this.ventasSales.createSaleSeparation({
      applicationId,
      saleProcessId: body.saleProcessId ?? null,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      amount: body.amount,
      currency: body.currency ?? 'PEN',
      separationDate: new Date(body.separationDate),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes ?? null,
    });
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
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const sep = await this.ventasSales.getSaleSeparationById(id, applicationId);
    if (!sep) throw new EntityNotFoundException('SaleSeparation', id);

    const updated = await this.ventasSales.updateSaleSeparation(id, applicationId, {
      status: body.status,
      notes: body.notes,
      expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
    });

    if (body.status === 'EXPIRED' || body.status === 'CLOSED') {
      const row = sep as { propertyId: string };
      await this.ventasSales.refreshPropertyListingAfterSeparationChange(
        row.propertyId,
        applicationId,
      );
    }

    return updated;
  }

  async setSeparationReceipt(
    id: string,
    applicationId: string,
    relativePath: string,
  ) {
    const sep = await this.ventasSales.getSaleSeparationById(id, applicationId);
    if (!sep) throw new EntityNotFoundException('SaleSeparation', id);
    return this.ventasSales.updateSaleSeparation(id, applicationId, {
      receiptFilePath: relativePath,
    });
  }

  /** Guarda ruta de comprobante tras subir archivo (resuelve applicationId desde slug). */
  async saveSeparationReceiptPath(
    separationId: string,
    applicationSlug: string | undefined,
    relativePath: string,
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    return this.setSeparationReceipt(separationId, applicationId, relativePath);
  }

  async listClosings(f: ListSaleClosingsFilters) {
    assertVentasApp(f.applicationSlug);
    return this.ventasSales.listSaleClosings({ ...f, applicationSlug: VENTAS_SLUG });
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
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);

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
      throw new BadRequestException('El cierre debe asociarse a un cliente comprador / lead.');
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

    if (body.saleSeparationId) {
      const sep = await this.ventasSales.getSaleSeparationById(
        body.saleSeparationId,
        applicationId,
      ) as { propertyId: string; buyerClientId: string; status: string } | null;
      if (!sep) throw new EntityNotFoundException('SaleSeparation', body.saleSeparationId);
      if (sep.propertyId !== body.propertyId || sep.buyerClientId !== body.buyerClientId) {
        throw new BadRequestException('La separación no coincide con propiedad ni comprador del cierre.');
      }
      if (sep.status !== 'ACTIVE') {
        throw new BadRequestException('La separación debe estar activa para cerrar desde ella.');
      }
    }

    if (body.saleProcessId) {
      const proc = await this.ventasSales.getSaleProcessById(
        body.saleProcessId,
        applicationId,
      ) as { propertyId: string; buyerClientId: string } | null;
      if (!proc) throw new EntityNotFoundException('SaleProcess', body.saleProcessId);
      if (proc.propertyId !== body.propertyId || proc.buyerClientId !== body.buyerClientId) {
        throw new BadRequestException('El proceso no coincide con propiedad ni comprador del cierre.');
      }
    }

    let commissionAgentId = body.commissionAgentId ?? body.agentId ?? null;
    if (!commissionAgentId && body.saleProcessId) {
      const proc = (await this.ventasSales.getSaleProcessById(
        body.saleProcessId,
        applicationId,
      )) as { agentId: string | null } | null;
      commissionAgentId = proc?.agentId ?? null;
    }
    if (!commissionAgentId) {
      throw new BadRequestException(
        'Indique el agente para la comisión (commissionAgentId o agentId del cierre / proceso).',
      );
    }

    let commissionAmount = body.commissionAmount;
    let commissionPercent = body.commissionPercent ?? null;

    if (body.commissionAutoFromProfile) {
      const pct = await this.ventasFinanzas.getAgentCommissionPercent(
        applicationId,
        commissionAgentId,
      );
      if (pct == null) {
        throw new BadRequestException(
          'No hay porcentaje configurado para este asesor. Configúrelo en Finanzas → Comisiones.',
        );
      }
      commissionPercent = pct;
      commissionAmount = Math.round(body.finalPrice * (pct / 100) * 100) / 100;
    } else if (commissionAmount == null || commissionAmount < 0) {
      throw new BadRequestException(
        'Indique commissionAmount o active commissionAutoFromProfile con perfil de % del asesor.',
      );
    }

    const ag = await this.agentRepository.findById(commissionAgentId);
    if (!ag || ag.applicationId !== applicationId) {
      throw new BadRequestException('El agente de comisión no existe o no pertenece a Ventas.');
    }

    if (body.agentId) {
      const ag2 = await this.agentRepository.findById(body.agentId);
      if (!ag2 || ag2.applicationId !== applicationId) {
        throw new BadRequestException('El asesor del cierre no existe o no pertenece a Ventas.');
      }
    }

    return this.ventasSales.createSaleClosingWithSideEffects({
      applicationId,
      saleProcessId: body.saleProcessId ?? null,
      saleSeparationId: body.saleSeparationId ?? null,
      propertyId: body.propertyId,
      buyerClientId: body.buyerClientId,
      agentId: body.agentId ?? null,
      finalPrice: body.finalPrice,
      paymentType,
      contractFilePath: null,
      notes: body.notes ?? null,
      commissionAgentId,
      commissionAmount: commissionAmount!,
      commissionPercent,
    });
  }

  async attachClosingContract(
    closingId: string,
    applicationSlug: string | undefined,
    relativeFilePath: string,
  ) {
    const applicationId = await this.resolveVentasApplicationId(applicationSlug);
    const row = await this.ventasSales.getSaleClosingById(closingId, applicationId);
    if (!row) throw new EntityNotFoundException('SaleClosing', closingId);
    return this.ventasSales.updateSaleClosingContractFile(
      closingId,
      applicationId,
      relativeFilePath,
    );
  }
}
