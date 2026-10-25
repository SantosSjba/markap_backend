export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}
export abstract class NotificationDeliveryPort {
  abstract emitToUser(userId: string, payload: NotificationPayload): void;
}
