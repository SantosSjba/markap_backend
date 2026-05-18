import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // cada 6 h
const STARTUP_DELAY_MS = 15_000;

@Injectable()
export class RentalAlertsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RentalAlertsScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private startupTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(private readonly notificationsService: NotificationsService) {}

  onModuleInit(): void {
    const enabled = process.env.RENTAL_ALERTS_ENABLED !== 'false';
    if (!enabled) {
      this.logger.log('Alertas programadas de alquileres desactivadas (RENTAL_ALERTS_ENABLED=false)');
      return;
    }

    const intervalMs = Number(process.env.RENTAL_ALERTS_INTERVAL_MS) || DEFAULT_INTERVAL_MS;

    this.startupTimer = setTimeout(() => {
      void this.tick('startup');
    }, STARTUP_DELAY_MS);

    this.timer = setInterval(() => {
      void this.tick('interval');
    }, intervalMs);

    this.logger.log(
      `Alertas de alquileres activas (cada ${Math.round(intervalMs / 60000)} min, primer ciclo en ${STARTUP_DELAY_MS / 1000}s)`,
    );
  }

  onModuleDestroy(): void {
    if (this.startupTimer) clearTimeout(this.startupTimer);
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(source: string): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.notificationsService.processScheduledRentalAlerts();
      if (result.expiring + result.pendingPayments + result.overduePayments > 0) {
        this.logger.log(
          `[${source}] Notificaciones: ${result.expiring} vencimiento, ${result.pendingPayments} pago próximo, ${result.overduePayments} pago atrasado`,
        );
      }
    } catch (err) {
      this.logger.error(`[${source}] Error en alertas de alquileres`, err);
    } finally {
      this.running = false;
    }
  }
}
