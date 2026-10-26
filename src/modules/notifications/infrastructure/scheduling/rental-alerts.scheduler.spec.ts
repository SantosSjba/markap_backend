import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { PinoLogger } from 'nestjs-pino';
import type { EnvConfig } from '../../../../config/env.config';
import type { NotificationsService } from '../../application/services/notifications.service';
import { AuditContext } from '../../../../shared/infrastructure/audit/audit-context';
import { RentalAlertsScheduler } from './rental-alerts.scheduler';

describe('planificación de alertas con SchedulerRegistry', () => {
  let registry: SchedulerRegistry;
  let scheduler: RentalAlertsScheduler;
  let processAlerts: jest.Mock;
  const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };
  function start(enabled = true, intervalMs = 60_000) {
    const config = new ConfigService<EnvConfig, true>({
      rentalAlerts: { enabled, intervalMs },
    });
    scheduler = new RentalAlertsScheduler(
      {
        processScheduledRentalAlerts: processAlerts,
      } as unknown as NotificationsService,
      logger as unknown as PinoLogger,
      registry,
      config,
    );
    scheduler.onApplicationBootstrap();
  }
  beforeEach(() => {
    jest.useFakeTimers();
    registry = new SchedulerRegistry();
    processAlerts = jest.fn();
    processAlerts.mockResolvedValue({
      expiring: 0,
      pendingPayments: 0,
      overduePayments: 0,
    });
    jest.clearAllMocks();
  });
  afterEach(() => {
    scheduler?.onModuleDestroy();
    jest.useRealTimers();
  });
  it('registra las tareas por nombre y conserva el arranque a los 15 segundos y el intervalo configurable', async () => {
    start();
    expect(registry.getTimeouts()).toEqual(['rental-alerts.startup']);
    expect(registry.getIntervals()).toEqual(['rental-alerts.interval']);
    await jest.advanceTimersByTimeAsync(14_999);
    expect(processAlerts).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(processAlerts).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(45_000);
    expect(processAlerts).toHaveBeenCalledTimes(2);
    scheduler.onModuleDestroy();
    expect(registry.getIntervals()).toEqual([]);
    expect(registry.getTimeouts()).toEqual([]);
  });
  it('el job corre con source JOB', async () => {
    let source: string | undefined;
    processAlerts.mockImplementation(() => {
      source = AuditContext.get().source;
      return Promise.resolve({
        expiring: 0,
        pendingPayments: 0,
        overduePayments: 0,
      });
    });
    start();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(source).toBe('JOB');
  });
  it('no registra ni ejecuta tareas cuando las alertas están desactivadas', async () => {
    start(false);
    await jest.advanceTimersByTimeAsync(120_000);
    expect(registry.getIntervals()).toEqual([]);
    expect(registry.getTimeouts()).toEqual([]);
    expect(processAlerts).not.toHaveBeenCalled();
  });
  it('evita solapamientos y permite ejecutar de nuevo después de terminar', async () => {
    let finish: (value: unknown) => void = () => undefined;
    processAlerts.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    start(true, 10_000);
    await jest.advanceTimersByTimeAsync(30_000);
    expect(processAlerts).toHaveBeenCalledTimes(1);
    finish({ expiring: 1, pendingPayments: 0, overduePayments: 0 });
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(10_000);
    expect(processAlerts).toHaveBeenCalledTimes(2);
  });
  it('registra fallos y libera el bloqueo para la próxima ejecución', async () => {
    processAlerts.mockRejectedValueOnce(new Error('provider failed'));
    start();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'rental_alerts.batch.failed' }),
      'Error al procesar alertas de alquileres',
    );
    await jest.advanceTimersByTimeAsync(45_000);
    expect(processAlerts).toHaveBeenCalledTimes(2);
  });
});
