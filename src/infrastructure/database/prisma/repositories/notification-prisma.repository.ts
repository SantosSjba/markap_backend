import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationPrismaMapper } from '../mappers/notification-prisma.mapper';
import type {
  NotificationRepository,
  CreateNotificationData,
  ListNotificationsFilters,
  ListNotificationsResult,
} from '@domain/repositories/notification.repository';
import type { Notification } from '@domain/entities/notification.entity';

@Injectable()
export class NotificationPrismaRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const n = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        data:
          data.data == null
            ? Prisma.DbNull
            : (data.data as Prisma.InputJsonObject),
      },
    });
    return NotificationPrismaMapper.toDomain(n);
  }

  async findManyByUserId(
    filters: ListNotificationsFilters,
  ): Promise<ListNotificationsResult> {
    const where: Prisma.NotificationWhereInput = { userId: filters.userId };
    if (filters.unreadOnly) {
      where.readAt = null;
    }
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const offset = Math.max(0, filters.offset ?? 0);

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: data.map((n) => NotificationPrismaMapper.toDomain(n)),
      total,
    };
  }

  async findById(id: string): Promise<Notification | null> {
    const n = await this.prisma.notification.findUnique({
      where: { id },
    });
    return n ? NotificationPrismaMapper.toDomain(n) : null;
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const n = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!n) return null;
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return NotificationPrismaMapper.toDomain(updated);
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }
}
