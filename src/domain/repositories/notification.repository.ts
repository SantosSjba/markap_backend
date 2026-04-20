import type { Notification } from '@domain/entities/notification.entity';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

export interface ListNotificationsFilters {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListNotificationsResult {
  data: Notification[];
  total: number;
}

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findManyByUserId(filters: ListNotificationsFilters): Promise<ListNotificationsResult>;
  findById(id: string): Promise<Notification | null>;
  markAsRead(id: string, userId: string): Promise<Notification | null>;
  countUnreadByUserId(userId: string): Promise<number>;
}
