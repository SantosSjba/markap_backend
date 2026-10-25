import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import type { ApplicationRepository } from '../../../identity/domain/repositories/application.repository';
import { APPLICATION_REPOSITORY } from '../../../identity/domain/repositories/application.repository';
import { CONTABILIDAD_PERIOD_STATUS } from '../../domain/constants/contabilidad-period.defaults';
import type { ContabilidadFinancialRepository } from '../../domain/repositories/contabilidad-financial.repository';
import { CONTABILIDAD_FINANCIAL_REPOSITORY } from '../../domain/repositories/contabilidad-financial.repository';
import type { ContabilidadPeriodRepository } from '../../domain/repositories/contabilidad-period.repository';
import { CONTABILIDAD_PERIOD_REPOSITORY } from '../../domain/repositories/contabilidad-period.repository';
import { PeriodTransactionPort } from '../ports/period-transaction.port';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException(
      'Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).',
    );
  }
}

@Injectable()
export class ContabilidadClosingOperationsService {
  constructor(
    @Inject(CONTABILIDAD_FINANCIAL_REPOSITORY)
    private readonly financial: ContabilidadFinancialRepository,
    @Inject(CONTABILIDAD_PERIOD_REPOSITORY)
    private readonly periods: ContabilidadPeriodRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
    private readonly transactions: PeriodTransactionPort,
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

  async getClosingPreview(
    applicationSlug: string | undefined,
    periodId: string,
  ) {
    if (!periodId?.trim())
      throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    try {
      return await this.financial.getClosingPreview(
        applicationId,
        periodId.trim(),
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'No se pudo obtener la vista previa de cierre.';
      throw new BadRequestException(message);
    }
  }

  async closePeriod(
    applicationSlug: string | undefined,
    periodId: string,
    options?: { postRegularization?: boolean; userId?: string | null },
  ) {
    if (!periodId?.trim())
      throw new BadRequestException('periodId es obligatorio.');
    const applicationId = await this.resolveApplicationId(applicationSlug);
    const id = periodId.trim();
    const postRegularization = options?.postRegularization !== false;

    const preview = await this.getClosingPreview(applicationSlug, id);
    if (!preview.canClose) {
      throw new BadRequestException(
        'No se puede cerrar el periodo. Revise los ítems marcados como error en el checklist.',
      );
    }

    // Regularización y cambio de estado van juntos; el bloqueo evita cierres dobles.
    return this.transactions.withLockedPeriod(id, async () => {
      const existing = await this.periods.findPeriodById(applicationId, id);
      if (!existing)
        throw new EntityNotFoundException('ContabilidadPeriod', id);
      if (existing.status === CONTABILIDAD_PERIOD_STATUS.CLOSED)
        throw new BadRequestException('El periodo ya está cerrado.');

      let regularization: Awaited<
        ReturnType<
          ContabilidadFinancialRepository['createClosingRegularizationEntry']
        >
      > | null = null;
      if (postRegularization) {
        try {
          regularization =
            await this.financial.createClosingRegularizationEntry(
              applicationId,
              id,
              options?.userId ?? null,
            );
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : 'No se pudo generar la regularización de cierre.';
          throw new BadRequestException(message);
        }
      }

      const closed = await this.periods.setPeriodStatus(
        applicationId,
        id,
        CONTABILIDAD_PERIOD_STATUS.CLOSED,
      );
      return { ...closed, regularization };
    });
  }
}
