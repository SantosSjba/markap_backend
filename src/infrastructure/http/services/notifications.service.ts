import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepository, NotificationData } from '../../../application/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../../application/repositories/notification.repository';
import type { NotificationPayload } from '../gateways/notifications.gateway';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { PrismaService } from '../../database/prisma/prisma.service';

export const RENTAL_NOTIFICATION_ROLE_CODES = ['ADMIN', 'MANAGER'] as const;

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
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

  async createForUserIds(
    userIds: string[],
    type: string,
    title: string,
    body?: string | null,
    data?: Record<string, unknown> | null,
  ): Promise<NotificationData[]> {
    const created: NotificationData[] = [];
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

  async notifyRentalCreated(
    rentalId: string,
    applicationSlug: string,
    tenantName: string,
    propertyAddress: string,
  ): Promise<void> {
    const userIds = await this.getUserIdsByRoleCodes([...RENTAL_NOTIFICATION_ROLE_CODES]);
    if (userIds.length === 0) return;
    await this.createForUserIds(
      userIds,
      'RENTAL_CREATED',
      'Nuevo alquiler registrado',
      `Inquilino: ${tenantName}. Propiedad: ${propertyAddress}`,
      { rentalId, applicationSlug },
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
}
