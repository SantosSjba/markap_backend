import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../../identity/domain/repositories/application.repository';
import type { AgentRepository } from '../../../domain/repositories/agent.repository';

import { APPLICATION_REPOSITORY } from '../../../../identity/domain/repositories/application.repository';
import { AGENT_REPOSITORY } from '../../../domain/repositories/agent.repository';
import type { VentasSalesRepository } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { VENTAS_SALES_REPOSITORY } from '../../../../ventas/domain/repositories/ventas-sales.repository';
import { assertAgentDeletableForVentas } from '../../../../ventas/application/validators/sales-usage.validator';

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applicationRepository: ApplicationRepository,
    @Inject(VENTAS_SALES_REPOSITORY)
    private readonly ventasSales: VentasSalesRepository,
  ) {}

  async execute(
    id: string,
    expectedApplicationSlug?: string,
  ): Promise<{ message: string }> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) throw new EntityNotFoundException('Agent', id);
    const app = await this.applicationRepository.findById(agent.applicationId);
    if (expectedApplicationSlug?.trim()) {
      if (!app || app.slug !== expectedApplicationSlug.trim()) {
        throw new EntityNotFoundException('Agent', id);
      }
    }
    if (app?.slug === 'ventas') {
      assertAgentDeletableForVentas(
        await this.ventasSales.getSalesUsage(agent.applicationId, {
          agentId: id,
        }),
      );
    }
    await this.agentRepository.softDelete(id);
    return { message: 'Agente eliminado correctamente' };
  }
}
