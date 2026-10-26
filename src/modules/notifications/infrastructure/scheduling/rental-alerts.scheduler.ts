import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { EnvConfig } from '../../../../config/env.config';
import {
  AuditContext,
  SYSTEM_CONTEXT,
} from '../../../../shared/infrastructure/audit/audit-context';
import { NotificationsService } from '../../application/services/notifications.service';

const STARTUP_DELAY_MS = 15_000;

@Injectable()
export class RentalAlertsScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly intervalName = 'rental-alerts.interval';
  private readonly timeoutName = 'rental-alerts.startup';
  private running = false;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: PinoLogger,
    private readonly registry: SchedulerRegistry,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {
    this.logger.setContext(RentalAlertsScheduler.name);
  }

  onApplicationBootstrap(): void {
    const { enabled, intervalMs } = this.config.get('rentalAlerts', {
      infer: true,
    });
    if (!enabled) {
      this.logger.info(
        { event: 'rental_alerts.scheduler.disabled' },
        'Alertas programadas de alquileres desactivadas',
      );
      return;
    }

    this.registry.addTimeout(
      this.timeoutName,
      setTimeout(() => {
        void this.tick('startup');
      }, STARTUP_DELAY_MS),
    );

    this.registry.addInterval(
      this.intervalName,
      setInterval(() => {
        void this.tick('interval');
      }, intervalMs),
    );

    this.logger.info(
      {
        event: 'rental_alerts.scheduler.started',
        intervalMs,
        startupDelayMs: STARTUP_DELAY_MS,
      },
      'Alertas programadas de alquileres activadas',
    );
  }

  onModuleDestroy(): void {
    if (this.registry.doesExist('timeout', this.timeoutName))
      this.registry.deleteTimeout(this.timeoutName);
    if (this.registry.doesExist('interval', this.intervalName))
      this.registry.deleteInterval(this.intervalName);
  }

  private async tick(source: string): Promise<void> {
    if (this.running) return;
    this.running = true;
    const runId = randomUUID();
    const startedAt = Date.now();
    try {
      const result = await AuditContext.run(
        { ...SYSTEM_CONTEXT, source: 'JOB' },
        () => this.notificationsService.processScheduledRentalAlerts(),
      );
      if (
        result.expiring + result.pendingPayments + result.overduePayments >
        0
      ) {
        this.logger.info(
          {
            event: 'rental_alerts.batch.completed',
            source,
            runId,
            durationMs: Date.now() - startedAt,
            ...result,
          },
          'Alertas de alquileres procesadas',
        );
      }
    } catch (err: unknown) {
      this.logger.error(
        {
          event: 'rental_alerts.batch.failed',
          source,
          runId,
          durationMs: Date.now() - startedAt,
          err,
        },
        'Error al procesar alertas de alquileres',
      );
    } finally {
      this.running = false;
    }
  }
}
