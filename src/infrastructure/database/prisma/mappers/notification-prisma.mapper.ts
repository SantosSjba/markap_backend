import { Notification } from '@domain/entities/notification.entity';

export class NotificationPrismaMapper {
  static toDomain(n: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    data: unknown;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    return new Notification(
      n.id,
      n.userId,
      n.type,
      n.title,
      n.body,
      n.data as Record<string, unknown> | null,
      n.readAt,
      n.createdAt,
    );
  }
}
