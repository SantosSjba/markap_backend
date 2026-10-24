import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_FINANCIAL_REPOSITORY,
  CONTABILIDAD_PERIOD_REPOSITORY,
} from '@common/constants/injection-tokens';
import { CONTABILIDAD_PERIOD_STATUS } from '@domain/constants/contabilidad-period.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadFinancialRepository } from '@domain/repositories/contabilidad-financial.repository';
import type { ContabilidadPeriodRepository } from '@domain/repositories/contabilidad-period.repository';
import { EntityNotFoundException } from '@domain/exceptions';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

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
    private readonly prisma: PrismaService,
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
    return this.prisma.atomic(async () => {
      await this.prisma
        .$queryRaw`SELECT id FROM contabilidad_periods WHERE id = ${id} FOR UPDATE`;
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
