/**
 * Notificación persistida para un usuario
 */
export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}

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
  data: NotificationData[];
  total: number;
}

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationData>;
  findManyByUserId(filters: ListNotificationsFilters): Promise<ListNotificationsResult>;
  findById(id: string): Promise<NotificationData | null>;
  markAsRead(id: string, userId: string): Promise<NotificationData | null>;
  countUnreadByUserId(userId: string): Promise<number>;
}
