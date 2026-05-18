import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepository } from '@domain/repositories/notification.repository';
import type { Notification } from '@domain/entities/notification.entity';
import type { AlertConfigRepository } from '@domain/repositories/alert-config.repository';
import type { NotificationPayload } from '@infrastructure/http/gateways/notifications.gateway';
import { NotificationsGateway } from '@infrastructure/http/gateways/notifications.gateway';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

import { ALERT_CONFIG_REPOSITORY, NOTIFICATION_REPOSITORY } from '@common/constants/injection-tokens';

export const RENTAL_NOTIFICATION_ROLE_CODES = ['ADMIN', 'MANAGER'] as const;

/** Tipos de alerta que se controlan desde AlertConfig */
export type AlertType =
  | 'RENTAL_CREATED'
  | 'RENTAL_EXPIRING_30'
  | 'RENTAL_EXPIRING_60'
  | 'RENTAL_EXPIRING_90'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_OVERDUE';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Inject(ALERT_CONFIG_REPOSITORY)
    private readonly alertConfigRepository: AlertConfigRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  async getUserIdsByRoleCodes(roleCodes: string[]): Promise<string[]> {
    if (roleCodes.length === 0) return [];
    const roles = await (this.prisma as any).role.findMany({
      where: { code: { in: roleCodes }, isActive: true },
      select: { id: true },
    });
    const roleIds = roles.map((r: { id: string }) => r.id);
    if (roleIds.length === 0) return [];
    const userRoles = await (this.prisma as any).userRole.findMany({
      where: { roleId: { in: roleIds }, isActive: true, revokedAt: null },
      select: { userId: true },
      distinct: ['userId'],
    });
    return userRoles.map((ur: { userId: string }) => ur.userId);
  }

  /**
   * Verifica si un usuario tiene habilitado un tipo de alerta para una aplicación.
   * Si no tiene config guardada, se usan los defaults (true para la mayoría).
   */
  private async isAlertEnabledForUser(
    userId: string,
    applicationId: string,
    alertType: AlertType,
  ): Promise<boolean> {
    const config = await this.alertConfigRepository.findByUserAndApp(userId, applicationId);
    if (!config) {
      // Defaults: RENTAL_CREATED siempre, expiring 90 días no, el resto sí
      if (alertType === 'RENTAL_EXPIRING_90') return false;
      return true;
    }
    switch (alertType) {
      case 'RENTAL_EXPIRING_30': return config.alert30Days;
      case 'RENTAL_EXPIRING_60': return config.alert60Days;
      case 'RENTAL_EXPIRING_90': return config.alert90Days;
      case 'PAYMENT_PENDING':    return config.alertPendingPayment;
      case 'PAYMENT_OVERDUE':    return config.alertOverduePayment;
      default:                   return config.channelInApp;
    }
  }

  async createForUserIds(
    userIds: string[],
    type: string,
    title: string,
    body?: string | null,
    data?: Record<string, unknown> | null,
  ): Promise<Notification[]> {
    const created: Notification[] = [];
    const payloads: { userId: string; payload: NotificationPayload }[] = [];
    for (const userId of userIds) {
      const n = await this.notificationRepository.create({
        userId,
        type,
        title,
        body: body ?? null,
        data: data ?? null,
      });
      created.push(n);
      payloads.push({
        userId,
        payload: {
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          createdAt: n.createdAt.toISOString(),
        },
      });
    }
    for (const { userId, payload } of payloads) {
      this.notificationsGateway.emitToUser(userId, payload);
    }
    return created;
  }

  /**
   * Notifica a los usuarios con roles ADMIN/MANAGER cuando se crea un alquiler.
   * Solo envía a los usuarios que tienen channelInApp habilitado en su AlertConfig.
   * Respeta enableExpirationAlerts del contrato.
   */
  async notifyRentalCreated(
    rentalId: string,
    applicationSlug: string,
    tenantName: string,
    propertyAddress: string,
  ): Promise<void> {
    // Verificar si el alquiler tiene habilitadas las alertas
    const rental = await (this.prisma as any).rental.findUnique({
      where: { id: rentalId },
      select: { enableExpirationAlerts: true, applicationId: true },
    });
    if (!rental || !rental.enableExpirationAlerts) return;

    const userIds = await this.getUserIdsByRoleCodes([...RENTAL_NOTIFICATION_ROLE_CODES]);
    if (userIds.length === 0) return;

    // Filtrar solo los que tienen channelInApp activo
    const eligibleUserIds: string[] = [];
    for (const userId of userIds) {
      const enabled = await this.isAlertEnabledForUser(
        userId,
        rental.applicationId,
        'RENTAL_CREATED',
      );
      if (enabled) eligibleUserIds.push(userId);
    }
    if (eligibleUserIds.length === 0) return;

    await this.createForUserIds(
      eligibleUserIds,
      'RENTAL_CREATED',
      'Nuevo alquiler registrado',
      `Inquilino: ${tenantName}. Propiedad: ${propertyAddress}`,
      { rentalId, applicationSlug },
    );
  }

  /**
   * Notifica sobre contratos próximos a vencer.
   * alertType puede ser 'RENTAL_EXPIRING_30', 'RENTAL_EXPIRING_60', 'RENTAL_EXPIRING_90'
   */
  async notifyRentalExpiring(
    rentalId: string,
    applicationId: string,
    applicationSlug: string,
    tenantName: string,
    propertyAddress: string,
    daysLeft: number,
    alertType: 'RENTAL_EXPIRING_30' | 'RENTAL_EXPIRING_60' | 'RENTAL_EXPIRING_90',
  ): Promise<void> {
    const rental = await (this.prisma as any).rental.findUnique({
      where: { id: rentalId },
      select: { enableExpirationAlerts: true },
    });
    if (!rental || !rental.enableExpirationAlerts) return;

    const userIds = await this.getUserIdsByRoleCodes([...RENTAL_NOTIFICATION_ROLE_CODES]);
    if (userIds.length === 0) return;

    const eligibleUserIds: string[] = [];
    for (const userId of userIds) {
      const enabled = await this.isAlertEnabledForUser(userId, applicationId, alertType);
      if (enabled) eligibleUserIds.push(userId);
    }
    if (eligibleUserIds.length === 0) return;

    await this.createForUserIds(
      eligibleUserIds,
      alertType,
      `Contrato por vencer en ${daysLeft} días`,
      `Inquilino: ${tenantName}. Propiedad: ${propertyAddress}`,
      { rentalId, applicationSlug, daysLeft },
    );
  }

  /**
   * Notifica sobre pagos pendientes o atrasados.
   */
  async notifyPaymentAlert(
    paymentId: string,
    rentalId: string,
    applicationId: string,
    applicationSlug: string,
    tenantName: string,
    alertType: 'PAYMENT_PENDING' | 'PAYMENT_OVERDUE',
  ): Promise<void> {
    const rental = await (this.prisma as any).rental.findUnique({
      where: { id: rentalId },
      select: { enableCollectionAlerts: true },
    });
    if (!rental || !rental.enableCollectionAlerts) return;

    const userIds = await this.getUserIdsByRoleCodes([...RENTAL_NOTIFICATION_ROLE_CODES]);
    if (userIds.length === 0) return;

    const eligibleUserIds: string[] = [];
    for (const userId of userIds) {
      const enabled = await this.isAlertEnabledForUser(userId, applicationId, alertType);
      if (enabled) eligibleUserIds.push(userId);
    }
    if (eligibleUserIds.length === 0) return;

    const title = alertType === 'PAYMENT_PENDING'
      ? 'Pago próximo a vencer'
      : 'Pago atrasado';

    await this.createForUserIds(
      eligibleUserIds,
      alertType,
      title,
      `Inquilino: ${tenantName}`,
      { paymentId, rentalId, applicationSlug },
    );
  }

  async listByUserId(
    userId: string,
    unreadOnly?: boolean,
    limit?: number,
    offset?: number,
  ) {
    return this.notificationRepository.findManyByUserId({
      userId,
      unreadOnly,
      limit,
      offset,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepository.markAsRead(id, userId);
  }

  async countUnread(userId: string) {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  /**
   * Job programado: contratos por vencer (30/60/90 días) y pagos pendientes/atrasados.
   */
  async processScheduledRentalAlerts(): Promise<{
    expiring: number;
    pendingPayments: number;
    overduePayments: number;
  }> {
    const stats = { expiring: 0, pendingPayments: 0, overduePayments: 0 };
    const today = this.startOfDay(new Date());

    const rentals = await (this.prisma as any).rental.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        application: { select: { id: true, slug: true } },
        property: { select: { addressLine: true } },
        tenant: { select: { fullName: true } },
        tenants: {
          orderBy: { sortOrder: 'asc' },
          include: { client: { select: { fullName: true } } },
        },
      },
    });

    for (const rental of rentals) {
      const applicationId = rental.applicationId as string;
      const applicationSlug = rental.application?.slug ?? 'alquileres';
      const tenantName = this.formatTenantNames(rental);
      const propertyAddress = rental.property?.addressLine ?? '—';

      if (rental.enableExpirationAlerts) {
        const end = this.startOfDay(new Date(rental.endDate));
        const daysLeft = Math.round((end.getTime() - today.getTime()) / 86_400_000);
        const expiringMap: Record<number, 'RENTAL_EXPIRING_30' | 'RENTAL_EXPIRING_60' | 'RENTAL_EXPIRING_90'> = {
          30: 'RENTAL_EXPIRING_30',
          60: 'RENTAL_EXPIRING_60',
          90: 'RENTAL_EXPIRING_90',
        };
        const alertType = expiringMap[daysLeft];
        if (alertType) {
          const sent = await this.wasAlertSentRecently(alertType, rental.id, { daysLeft });
          if (!sent) {
            await this.notifyRentalExpiring(
              rental.id,
              applicationId,
              applicationSlug,
              tenantName,
              propertyAddress,
              daysLeft,
              alertType,
            );
            stats.expiring += 1;
          }
        }
      }
    }

    const pendingWindowDays = Number(process.env.RENTAL_ALERT_PENDING_DAYS) || 3;
    const pendingUntil = new Date(today);
    pendingUntil.setDate(pendingUntil.getDate() + pendingWindowDays);

    const payments = await (this.prisma as any).payment.findMany({
      where: {
        status: 'PENDING',
        rental: { deletedAt: null, status: 'ACTIVE' },
      },
      include: {
        rental: {
          include: {
            application: { select: { id: true, slug: true } },
            tenant: { select: { fullName: true } },
            tenants: {
              orderBy: { sortOrder: 'asc' },
              include: { client: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    for (const payment of payments) {
      const rental = payment.rental;
      if (!rental?.enableCollectionAlerts) continue;

      const due = this.startOfDay(new Date(payment.dueDate));
      const applicationId = rental.applicationId as string;
      const applicationSlug = rental.application?.slug ?? 'alquileres';
      const tenantName = this.formatTenantNames(rental);

      if (due.getTime() < today.getTime()) {
        const sent = await this.wasAlertSentRecently('PAYMENT_OVERDUE', rental.id, {
          paymentId: payment.id,
        });
        if (!sent) {
          await this.notifyPaymentAlert(
            payment.id,
            rental.id,
            applicationId,
            applicationSlug,
            tenantName,
            'PAYMENT_OVERDUE',
          );
          stats.overduePayments += 1;
        }
        continue;
      }

      if (due.getTime() <= pendingUntil.getTime()) {
        const sent = await this.wasAlertSentRecently('PAYMENT_PENDING', rental.id, {
          paymentId: payment.id,
        });
        if (!sent) {
          await this.notifyPaymentAlert(
            payment.id,
            rental.id,
            applicationId,
            applicationSlug,
            tenantName,
            'PAYMENT_PENDING',
          );
          stats.pendingPayments += 1;
        }
      }
    }

    return stats;
  }

  private startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private formatTenantNames(rental: {
    tenant?: { fullName: string };
    tenants?: { client: { fullName: string } }[];
  }): string {
    const fromJoin = (rental.tenants ?? [])
      .map((t) => t.client?.fullName)
      .filter(Boolean) as string[];
    if (fromJoin.length) return fromJoin.join(', ');
    return rental.tenant?.fullName ?? '—';
  }

  /** Evita duplicar la misma alerta el mismo día. */
  private async wasAlertSentRecently(
    type: string,
    rentalId: string,
    extra?: { daysLeft?: number; paymentId?: string },
  ): Promise<boolean> {
    const since = new Date();
    since.setHours(since.getHours() - 20);

    const rows = await (this.prisma as any).notification.findMany({
      where: { type, createdAt: { gte: since } },
      select: { data: true },
      take: 200,
    });

    return rows.some((row: { data: unknown }) => {
      const data = row.data as Record<string, unknown> | null;
      if (!data || data.rentalId !== rentalId) return false;
      if (extra?.daysLeft != null && data.daysLeft !== extra.daysLeft) return false;
      if (extra?.paymentId != null && data.paymentId !== extra.paymentId) return false;
      return true;
    });
  }
}
