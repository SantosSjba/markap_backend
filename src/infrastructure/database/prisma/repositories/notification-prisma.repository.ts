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
    const n = await (this.prisma as any).notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        data: data.data ?? null,
      },
    });
    return NotificationPrismaMapper.toDomain(n);
  }

  async findManyByUserId(
    filters: ListNotificationsFilters,
  ): Promise<ListNotificationsResult> {
    const where: any = { userId: filters.userId };
    if (filters.unreadOnly) {
      where.readAt = null;
    }
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const offset = Math.max(0, filters.offset ?? 0);

    const [data, total] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (this.prisma as any).notification.count({ where }),
    ]);

    return {
      data: data.map((n: any) => NotificationPrismaMapper.toDomain(n)),
      total,
    };
  }

  async findById(id: string): Promise<Notification | null> {
    const n = await (this.prisma as any).notification.findUnique({
      where: { id },
    });
    return n ? NotificationPrismaMapper.toDomain(n) : null;
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const n = await (this.prisma as any).notification.findFirst({
      where: { id, userId },
    });
    if (!n) return null;
    const updated = await (this.prisma as any).notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return NotificationPrismaMapper.toDomain(updated);
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return (this.prisma as any).notification.count({
      where: { userId, readAt: null },
    });
  }
}
